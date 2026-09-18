from flask import Flask
from flask_cors import CORS
from models import db
from routes import bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db.init_app(app)

app.register_blueprint(bp)

with app.app_context():
    db.create_all()

@app.route('/health')
def health():
    return {"status": "UP", "service": "python-taskapi"}

if __name__ == '__main__':
    app.run(port=5000)
