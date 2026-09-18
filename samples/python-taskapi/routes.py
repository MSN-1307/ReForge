from flask import Blueprint, request, jsonify
from models import db, Task

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([t.to_dict() for t in tasks])

@bp.route('/tasks/<int:id>', methods=['GET'])
def get_task(id):
    task = Task.query.get_or_404(id)
    return jsonify(task.to_dict())

@bp.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json() or {}
    task = Task(
        title=data.get('title', 'Untitled'),
        description=data.get('description', ''),
        completed=data.get('completed', False),
        priority=data.get('priority', 1)
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201

@bp.route('/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    task = Task.query.get_or_404(id)
    data = request.get_json() or {}
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.completed = data.get('completed', task.completed)
    task.priority = data.get('priority', task.priority)
    db.session.commit()
    return jsonify(task.to_dict())

@bp.route('/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    task = Task.query.get_or_404(id)
    db.session.delete(task)
    db.session.commit()
    return '', 204
