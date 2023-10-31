from flask import Flask, request, jsonify, render_template, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import os

# Initialize app
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))

# Setup Database
db_name = 'db.sqlite'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, db_name)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
ma = Marshmallow(app)


@app.route('/home')
def home():
    return render_template('home.html')


@app.route('/stats')
def stats():
    return render_template('stats.html')


@app.route('/banks')
def banks():
    return render_template('banks.html')


@app.route('/settings')
def settings():
    return render_template('settings.html')


@app.errorhandler(404)
def page_not_found(e):
    return redirect('/home')


if __name__ == '__main__':
    app.run(debug=True)