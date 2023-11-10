from flask import Flask, request, jsonify, render_template, redirect, session
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from datetime import datetime, timedelta
from dateutil.parser import parse
import os
import pytz

# Initialize app
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))

app.secret_key = ""

# Setup Database
db_name = 'savings.sqlite'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, db_name)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.urandom(12).hex()
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=31)

db = SQLAlchemy(app)
ma = Marshmallow(app)


# Saving Class/Model
class Saving(db.Model):
    __tablename__ = 'saving'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    amount_saved = db.Column(db.Integer, default=0) 
    amount_goal = db.Column(db.Integer, nullable=False)
    created_date = db.Column(db.DateTime, default=datetime.now)
    goal_completed_date = db.Column(db.DateTime)
    currency = db.Column(db.String, default='PHP')
    is_goal_completed = db.Column(db.Boolean, default=False)
    history = db.Column(db.String, default='')

    def __init__(self, name, amount_goal):
        self.name = name
        self.amount_goal = amount_goal
    

# Saving Schema
class SavingSchema(ma.Schema):
    class Meta:
        fields = ('id', 'name', 'amount_saved', 'amount_goal', 'created_date', 
        'goal_completed_date', 'is_goal_completed', 'history', 'currency')


# Initialize Saving Schema
saving_schema = SavingSchema()
savings_schema = SavingSchema(many=True)


# Initialize db
with app.app_context():
    # db.drop_all()
    db.create_all() 

# Settings
supported_currency_codes = ["USD", "PHP", "EUR", "JPY", "GBP", "CAD", "AUD"]


@app.route('/home')
def home():
    return render_template('home.html')


@app.route('/saving')
def session_route():
    saving = None

    if 'saving_id' in session:
        saving_data = db.session.get(Saving, session['saving_id'])
        saving_data_history = saving_data.history.split(',') if saving_data.history else []
        saving = {
            'amount_goal': saving_data.amount_goal,
            'amount_saved': saving_data.amount_saved,
            'name': saving_data.name,
            'is_goal_completed': saving_data.is_goal_completed,
            'history': saving_data_history,
            'id': saving_data.id,
            'created_date': saving_data.created_date,
            'goal_completed_date': saving_data.goal_completed_date,
            'currency': saving_data.currency,
        }

    return jsonify({ 'saving': saving }), 200


@app.route('/savings/api', methods=['GET', 'POST', 'PUT', 'DELETE'])
def savings_api():
    if request.method == 'GET':
        all_savings = Saving.query.all()
        result = savings_schema.dump(all_savings)

        tz = request.args.get('tz')
        if tz:
            parse_time_zone(tz, result)

        return jsonify({ 'savings': result }), 200
    elif request.method == 'POST':
        if 'name' not in request.json:
            return handle_err('No name.')
        elif 'amount_goal' not in request.json:
            return handle_err('No amount goal.')

        name = request.json['name']
        amount_goal = request.json['amount_goal']

        if not name:
            return handle_err('Invalid name.')
        try:
            amount_goal = float(amount_goal)
            if amount_goal <= 0:
                raise ValueError
        except ValueError:
            return handle_err('Invalid amount goal.')
        
        amount_goal = round(amount_goal, 2)

        new_saving = Saving(name, amount_goal)
        db.session.add(new_saving)
        db.session.commit()

        session["saving_id"] = new_saving.id;
        session.permanent = True

        new_saving_data = saving_schema.dump(new_saving)

        return jsonify({ 'saving': new_saving_data }), 200
    elif request.method == 'PUT':
        if 'id' not in request.json:
            return handle_err('No id.')

        id = request.json['id']
        saving = db.session.get(Saving, id)
        if saving == None:
            return handle_err('Id not found.', 404)

        # Validate updates
        if 'added_amount' in request.json and 'subtracted_amount' in request.json:
            return handle_err('added_amount and subtracted_amount cannot be used together.')
    
        if 'added_amount' in request.json:
            # If goal has already been completed
            if saving.is_goal_completed:
                return handle_err('Amount goal has already been reached.')

            added_amount = request.json['added_amount']

            try:
                added_amount = float(added_amount)
                if added_amount <= 0:
                    raise ValueError
            except ValueError:
                return handle_err('Invalid added amount.')

            # Add to history
            history_entry = f'{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}:+{added_amount}'
            history_list = saving.history.split(',') if saving.history else []
            history_list.append(history_entry)
            saving.history = ','.join(history_list)

            saving.amount_saved += added_amount
            saving.amount_saved = round(saving.amount_saved, 2)

            # If user reached the amount goal
            if saving.amount_saved >= saving.amount_goal:
                saving.amount_saved = saving.amount_goal
                saving.is_goal_completed = True
                saving.goal_completed_date = datetime.now()

        if 'subtracted_amount' in request.json:
            # If goal has already been completed
            if saving.amount_saved <= 0:
                return handle_err('Nothing to subtract.')

            subtracted_amount = request.json['subtracted_amount']

            try:
                subtracted_amount = float(subtracted_amount)
                if subtracted_amount <= 0:
                    raise ValueError
            except ValueError:
                return handle_err('Invalid subtracted amount.')

            if subtracted_amount > saving.amount_saved:
                return handle_err('Not enough saving amount.')

            if saving.is_goal_completed and (saving.amount_saved-subtracted_amount) < saving.amount_goal:
                saving.is_goal_completed = False
                saving.goal_completed_date = None

            # Add to history
            history_entry = f'{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}:-{subtracted_amount}'
            history_list = saving.history.split(',') if saving.history else []
            history_list.append(history_entry)
            saving.history = ','.join(history_list)

            saving.amount_saved -= subtracted_amount
            saving.amount_saved = round(saving.amount_saved, 2)

        if 'name' in request.json:
            name = request.json['name']
            if not name:
                return handle_err('Invalid name.')

            saving.name = name

        if 'amount_goal' in request.json:
            amount_goal = request.json['amount_goal']

            try: 
                amount_goal = float(amount_goal)
                if amount_goal <= 0:
                    raise ValueError
                elif amount_goal <= saving.amount_saved:
                    return handle_err('Amount goal should be higher than amount saved.')
            except ValueError:
                return handle_err('Invalid amount goal.')
            
            # If goal has already been reached
            if saving.is_goal_completed:
                saving.is_goal_completed = False
                saving.goal_completed_date = None

            saving.amount_goal = amount_goal

        if 'currency' in request.json:
            currency = request.json['currency']
            if not currency:
                return handle_err('Invalid currency.')
            elif currency.upper() not in supported_currency_codes:
                return handle_err(f"Currency not supported. Supported currencies: {', '.join(supported_currency_codes)}")
            
            saving.currency = currency.upper()

        db.session.commit()

        saving_data = saving_schema.dump(saving)

        return jsonify({ 'saving': saving_data }), 200
    elif request.method == 'DELETE':
        if 'id' not in request.json:
            return handle_err('No id.')
        
        id = request.json['id']

        if not id:
            return handle_err('Invalid id.')
        
        saving = db.session.get(Saving, id)
        if saving == None:
            return handle_err('Id not found.', 404)

        db.session.delete(saving)
        db.session.commit()

        saving_data = saving_schema.dump(saving)

        return { 'saving': saving_data }, 200


@app.route('/savings/api/<string:id>')
def saving_api(id):
    saving = db.session.get(Saving, id)
    if saving == None:
        return handle_err('Id not found.')
    saving_data = saving_schema.dump(saving)

    return jsonify({ 'saving': saving_data }), 200


@app.route('/savings')
def savings():
    all_savings = Saving.query.all()
    result = savings_schema.dump(all_savings)
    savings = [saving['name'] for saving in result]

    return render_template('savings.html', savings=savings)


@app.route('/stats')
def stats():
    return render_template('stats.html')


@app.route('/settings')
def settings():
    return render_template('settings.html')


@app.errorhandler(404)
def page_not_found(e):
    return redirect('/home')


def handle_err(msg, status=400):
    return (jsonify({'error': msg}), status)


def parse_time_zone(tz, savings):
    try:
        user_timezone = pytz.timezone(tz) 
    except pytz.UnknownTimeZoneError:
        return

    for saving in savings:
        # Convert dates to user timezone
        created_date = datetime.fromisoformat(saving['created_date'])
        created_date = created_date.astimezone(user_timezone)
        print(created_date)
        saving['created_date'] = created_date.strftime("%Y-%m-%d %H:%M:%S%z")

        if saving['goal_completed_date']:
            goal_completed_date = datetime.fromisoformat(saving['goal_completed_date'])
            goal_completed_date = goal_completed_date.astimezone(user_timezone)
            saving['goal_completed_date'] = goal_completed_date.strftime("%Y-%m-%d %H:%M:%S%z")


if __name__ == '__main__':
    app.run(debug=True)