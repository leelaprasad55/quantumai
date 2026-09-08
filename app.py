import os
import sqlite3
from datetime import datetime
from functools import wraps

from flask import Flask, flash, g, jsonify, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

from curriculum import MODULES

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'change-this-in-production')
app.config['DATABASE'] = os.environ.get('DATABASE_PATH', os.path.join(app.instance_path, 'quantumlearn.db'))
os.makedirs(app.instance_path, exist_ok=True)


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_error=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    get_db().executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            education TEXT,
            goal TEXT,
            role TEXT NOT NULL DEFAULT 'student',
            knowledge_test_done INTEGER NOT NULL DEFAULT 0,
            knowledge_score INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS progress (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            completed_modules TEXT NOT NULL DEFAULT '[]',
            completed_topics TEXT NOT NULL DEFAULT '[]',
            total_time INTEGER NOT NULL DEFAULT 0,
            lab_experiments INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        );
    ''')
    get_db().commit()


with app.app_context():
    init_db()


def current_user():
    user_id = session.get('user_id')
    return get_db().execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone() if user_id else None


@app.context_processor
def inject_user():
    return {'current_user': current_user()}


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if current_user() is None:
            return redirect(url_for('login', next=request.path))
        return view(*args, **kwargs)
    return wrapped


@app.route('/')
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        user = get_db().execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        if user is None or not check_password_hash(user['password_hash'], request.form.get('password', '')):
            flash('Invalid email or password.', 'danger')
        else:
            session.clear()
            session['user_id'] = user['id']
            return redirect(url_for('dashboard'))
    return render_template('auth.html', mode='login')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        try:
            if not name or not email or len(password) < 8:
                raise ValueError('Name, email, and a password of at least 8 characters are required.')
            db = get_db()
            cursor = db.execute(
                'INSERT INTO users (name, email, password_hash, education, goal, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                (name, email, generate_password_hash(password), request.form.get('education', ''), request.form.get('goal', ''), datetime.utcnow().isoformat()),
            )
            db.execute('INSERT INTO progress (user_id, updated_at) VALUES (?, ?)', (cursor.lastrowid, datetime.utcnow().isoformat()))
            db.commit()
            session['user_id'] = cursor.lastrowid
            return redirect(url_for('dashboard'))
        except ValueError as error:
            flash(str(error), 'danger')
        except sqlite3.IntegrityError:
            flash('An account with that email already exists.', 'danger')
    return render_template('auth.html', mode='register')


@app.post('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.get('/dashboard')
@login_required
def dashboard():
    user = current_user()
    progress = get_db().execute('SELECT * FROM progress WHERE user_id = ?', (user['id'],)).fetchone()
    completed = len(progress['completed_modules'].strip('[]').split(',')) if progress and progress['completed_modules'] != '[]' else 0
    next_module = MODULES[min(completed, len(MODULES) - 1)]
    return render_template('dashboard.html', user=user, progress=progress, completed=completed, next_module=next_module)


@app.get('/modules')
@login_required
def modules():
    return render_template('modules.html', modules=MODULES)


@app.get('/modules/<int:module_id>')
@login_required
def module_detail(module_id):
    module = next((item for item in MODULES if item['id'] == module_id), None)
    return render_template('module_detail.html', module=module) if module else (render_template('404.html'), 404)


@app.post('/api/progress/modules/<int:module_id>')
@login_required
def complete_module(module_id):
    if not any(item['id'] == module_id for item in MODULES):
        return jsonify({'error': 'Unknown module'}), 404
    user = current_user()
    db = get_db()
    progress = db.execute('SELECT completed_modules FROM progress WHERE user_id = ?', (user['id'],)).fetchone()
    values = progress['completed_modules'].strip('[]') if progress else ''
    completed = {int(value) for value in values.split(',') if value.strip()}
    completed.add(module_id)
    db.execute('UPDATE progress SET completed_modules = ?, updated_at = ? WHERE user_id = ?', (str(sorted(completed)).replace(' ', ''), datetime.utcnow().isoformat(), user['id']))
    db.commit()
    return jsonify({'success': True, 'completedModules': sorted(completed)})


@app.post('/api/tutor')
@login_required
def tutor():
    message = request.json.get('message', '').strip() if request.is_json else ''
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    return jsonify({'text': 'Ask me about qubits, superposition, entanglement, gates, or quantum algorithms. Configure GROQ_API_KEY on Render to enable the live AI tutor.'})


@app.errorhandler(404)
def not_found(_error):
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=os.environ.get('FLASK_DEBUG') == '1')