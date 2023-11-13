from flask import Flask, request, jsonify, render_template, redirect, session
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from datetime import datetime, timedelta
from dateutil.parser import parse
import os
import pytz

# Initialize app & database
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))

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


# Initialization
saving_schema = SavingSchema()
savings_schema = SavingSchema(many=True)

with app.app_context():
    # db.drop_all()
    db.create_all() 

# Settings / Config
supported_currency_codes = ["USD", "PHP", "EUR", "JPY", "GBP", "CAD", "AUD"]


# Session
@app.route('/session', methods=['GET', 'PUT'])
def session_route():
    """Return and change session's saving data"""

    saving = None
    # FOR DEVELOPMENT ONLY
    # session['saving_id'] = 1

    if request.method == 'GET':
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

    elif request.method == 'PUT':
        if 'id' not in request.json:
            return handle_err('No id.')

        id = request.json['id']
        if not id:
            return handle_err('Invalid id.')

        saving = db.session.get(Saving, id)
        if saving == None:
            return handle_err('Id not found.')
        
        session['saving_id'] = id

        saving_data = saving_schema.dump(saving)
        return jsonify({ 'saving': saving_data }), 200


# Routes
@app.route('/home')
def home():
    """Render home page"""

    return render_template('home.html')


@app.route('/savings')
def savings():
    """Render savings page and savings (name, id, & status)"""

    def get_status(saving):
        """ return status of each saving """

        if saving['is_goal_completed']:
            return 'completed'
        elif saving['amount_saved'] <= 0:
            return 'empty'

        return 'in-progress'

    all_savings = Saving.query.all()
    result = savings_schema.dump(all_savings)
    result = sort_savings(result)

    savings = [[saving['name'], saving['id'], get_status(saving)] for saving in result]

    return render_template('savings.html', savings=savings)


@app.route('/stats')
def stats():
    """Render stats page"""
    return render_template('stats.html')


@app.route('/settings')
def settings():
    """Render setting page"""
    return render_template('settings.html')


# API
@app.route('/savings/api', methods=['GET', 'POST', 'PUT', 'DELETE'])
def savings_api():
    """CRUD API for savings"""

    if request.method == 'GET':
        all_savings = Saving.query.all()
        result = savings_schema.dump(all_savings)
        result = sort_savings(result)
        
        # parse all date to timezone if user provided one (e.g. '?tz=Asia/Manila')
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
        
        if len(name) > 100:
            return handle_err('Name must be less than 100 characters.')

        amount_goal = round(amount_goal, 2)
        new_saving = Saving(name, amount_goal)
        db.session.add(new_saving)
        db.session.commit()

        # save to session
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

        # Handle each field if provided
        if 'added_amount' in request.json:
            if 'withdrawed_amount' in request.json or 'amount_saved' in request.json:
                return handle_err('added_amount, withdrawed_amount, or amount_saved cannot be used together.')

            # handle if goal is already completed
            if saving.is_goal_completed:
                return handle_err('Amount goal has already been reached.')

            added_amount = request.json['added_amount']
            try:
                added_amount = float(added_amount)
                if added_amount <= 0:
                    raise ValueError
            except ValueError:
                return handle_err('Invalid added amount.')

            added_amount = round(added_amount, 2)
            saving.history = append_to_history(saving.history, added_amount, 'add')
            saving.amount_saved += added_amount

            # If user reached the amount goal
            if saving.amount_saved >= saving.amount_goal:
                saving.amount_saved = saving.amount_goal
                saving.is_goal_completed = True
                saving.goal_completed_date = datetime.now()

        if 'withdrawed_amount' in request.json:
            if 'added_amount' in request.json or 'amount_saved' in request.json:
                return handle_err('added_amount, withdrawed_amount, or amount_saved cannot be used together.')

            # handle if no amount_saved yet
            if saving.amount_saved <= 0:
                return handle_err('Nothing to withdraw.')

            withdrawed_amount = request.json['withdrawed_amount']
            try:
                withdrawed_amount = float(withdrawed_amount)
                if withdrawed_amount <= 0:
                    raise ValueError
            except ValueError:
                return handle_err('Invalid withdrawed amount.')

            if withdrawed_amount > saving.amount_saved:
                return handle_err('Not enough saving amount.')

            withdrawed_amount = round(withdrawed_amount, 2)
            saving.history = append_to_history(saving.history, withdrawed_amount, 'withdraw')
            saving.amount_saved -= withdrawed_amount

            if saving.is_goal_completed and (saving.amount_saved-withdrawed_amount) < saving.amount_goal:
                """  the other condition is not actually necessary, since if 
                the amount_saved becomes greater than amount goal, the amount_saved would 
                just be equal to the amount_goal """
            
                saving.is_goal_completed = False
                saving.goal_completed_date = None

        if 'amount_saved' in request.json:
            if 'withdrawed_amount' in request.json or 'added_amount' in request.json:
                return handle_err('added_amount, withdrawed_amount, or amount_saved cannot be used together.')

            amount_saved = request.json['amount_saved']
            try: 
                amount_saved = float(amount_saved)
                if amount_saved < 0:
                    raise ValueError
                elif amount_saved > saving.amount_goal:
                    return handle_err('Amount saved must not be greater than amount goal.')
            except ValueError:
                return handle_err('Invalid amount saved.')

            amount_saved = round(amount_saved, 2)
            saving.history = append_to_history(saving.history, amount_saved, 'edit')
            saving.amount_saved = amount_saved

            # handle if goal is already completed
            if saving.is_goal_completed and amount_saved < saving.amount_goal:
                saving.is_goal_completed = False
                saving.goal_completed_date = None
            
            # handle if amount_saved is set 'equal' to amount_goal
            elif amount_saved >= saving.amount_goal:
                saving.is_goal_completed = True
                saving.goal_completed_date = datetime.now()

            saving.amount_saved = amount_saved

        if 'name' in request.json:
            name = request.json['name']
            if not name:
                return handle_err('Invalid name.')
            elif len(name) > 100:
                return handle_err('Name must be less than 100 characters.')
            
            saving.name = name

        if 'amount_goal' in request.json:
            amount_goal = request.json['amount_goal']

            try: 
                amount_goal = float(amount_goal)
                if amount_goal <= 0:
                    raise ValueError
                elif amount_goal <= saving.amount_saved:
                    return handle_err('Amount goal must be higher than amount saved.')
            except ValueError:
                return handle_err('Invalid amount goal.')
            
            # handle when goal is already completed
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
        return jsonify({ 'saving': saving_data }), 200


@app.route('/savings/api/<string:id>')
def saving_api(id):
    """Return saving data with given id"""

    saving = db.session.get(Saving, id)
    if saving == None:
        return handle_err('Id not found.')
    saving_data = saving_schema.dump(saving)

    return jsonify({ 'saving': saving_data }), 200


# Not found
@app.errorhandler(404)
def page_not_found(e):
    return redirect('/home')


# Helper Functions
def handle_err(msg, status=400):
    """Return error object"""
    return (jsonify({'error': msg}), status)


def parse_time_zone(tz, savings):
    """Convert dates of every saving to given timezone"""

    try:
        user_timezone = pytz.timezone(tz) 
    except pytz.UnknownTimeZoneError:
        return

    for saving in savings:
        created_date = datetime.fromisoformat(saving['created_date'])
        created_date = created_date.astimezone(user_timezone)
        print(created_date)
        saving['created_date'] = created_date.strftime("%Y-%m-%d %H:%M:%S%z")

        if saving['goal_completed_date']:
            goal_completed_date = datetime.fromisoformat(saving['goal_completed_date'])
            goal_completed_date = goal_completed_date.astimezone(user_timezone)
            saving['goal_completed_date'] = goal_completed_date.strftime("%Y-%m-%d %H:%M:%S%z")


def append_to_history(history, amount, append_type='edit'):
    """Append amount operation to saving history (add/withdraw/edit)"""

    append_types = {
        'add': '+',
        'withdraw': '-',
        'edit': '~'
    }

    symbol = append_types[append_type.lower()]

    # Add to history
    history_entry = f'{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}:{symbol}{amount}'
    history_list = history.split(',') if history else []
    history_list.append(history_entry)
    history = ','.join(history_list)

    return history


def sort_savings(savings):
    """ sort by status, progress->empty->completed """

    def sort_result(saving):
        empty = saving['amount_saved'] <= 0
        completed = saving['is_goal_completed']
        in_progress = saving['amount_saved'] > 0 and saving['amount_saved'] < saving['amount_goal']

        return (in_progress, empty, completed)
    
    return sorted(savings, key=sort_result, reverse=True)


if __name__ == '__main__':
    app.run(debug=True)