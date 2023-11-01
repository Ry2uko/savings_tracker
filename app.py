from flask import Flask, request, jsonify, render_template, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from datetime import datetime
from dateutil.parser import parse
import os
import pytz

# Initialize app
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))

# Setup Database
db_name = 'savings.sqlite'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, db_name)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
ma = Marshmallow(app)

with app.app_context():
    #db.drop_all()
    db.create_all() 


# Saving Class/Model
class Saving(db.Model):
    __tablename__ = 'saving'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    amount_saved = db.Column(db.Integer, default=0) 
    amount_goal = db.Column(db.Integer, nullable=False)
    created_date = db.Column(db.DateTime, default=db.func.now())
    goal_completed_date = db.Column(db.DateTime)
    is_goal_completed = db.Column(db.Boolean, default=False)

    def __init__(self, name, amount_goal):
        self.name = name
        self.amount_goal = amount_goal


# Saving Schema
class SavingSchema(ma.Schema):
    class Meta:
        fields = ('id', 'name', 'amount_saved', 'amount_goal', 'created_date', 
        'goal_completed_date', 'is_goal_completed')


# Initialize Schema
saving_schema = SavingSchema()
savings_schema = SavingSchema(many=True)


@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/savings/api', methods=['GET', 'POST', 'PUT', 'DELETE'])
def savings_api():
    if request.method == 'GET':
        all_savings = Saving.query.all()
        result = savings_schema.dump(all_savings)

        tz = request.args.get('tz')
        if tz:
            parse_time_zone(tz, result)

        return jsonify(result)
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

        return saving_schema.jsonify(new_saving), 200
    elif request.method == 'PUT':
        if 'id' not in request.json:
            return handle_err('No id.')

        id = request.json['id']
        saving = Saving.query.get(id)
        if saving == None:
            return handle_err('Id not found.', 404)

        # Validate updates
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

            saving.amount_saved += added_amount
            saving.amount_saved = round(saving.amount_saved, 2)
            # If user reached the amount goal
            if saving.amount_saved >= saving.amount_goal:
                saving.is_goal_completed = True
                saving.goal_completed_date = db.func.now()

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

        if 'amount_saved' in request.json:
            if 'added_amount' in request.json:
                return handle_err("Don't use 'amount_saved' and 'added_amount' together.")

            amount_saved = request.json['amount_saved']

            try:
                amount_saved = float(amount_saved)
                if amount_saved < 0:
                    raise ValueError
                elif amount_saved >= saving.amount_goal:
                    return handle_err('Amount saved should be lower than amount goal.')
            except ValueError:
                return handle_err('Invalid amount.')

            # If goal has already been reached
            if saving.is_goal_completed:
                saving.is_goal_completed = False
                saving.goal_completed_date = None

            saving.amount_saved = amount_saved

        db.session.commit()

        return saving_schema.jsonify(saving), 200
    elif request.method == 'DELETE':
        if 'id' not in request.json:
            return handle_err('No id.')
        
        id = request.json['id']

        if not id:
            return handle_err('Invalid id.')
        
        saving = Saving.query.get(id)
        if saving == None:
            return handle_err('Id not found.', 404)

        db.session.delete(saving)
        db.session.commit()

        return saving_schema.jsonify(saving), 200


@app.route('/savings')
def savings():
    return render_template('savings.html')


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