import os
import json
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
        CREATE TABLE IF NOT EXISTS skills (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            values_json TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS circuits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            qubits INTEGER NOT NULL,
            operations_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS experiments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            preset TEXT,
            shots INTEGER NOT NULL DEFAULT 1000,
            noise_model TEXT,
            fidelity REAL,
            results_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            activity_date TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 1,
            UNIQUE(user_id, activity_date)
        );
        CREATE TABLE IF NOT EXISTS gate_usage (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            gate TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY(user_id, gate)
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


def admin_required(view):
    @wraps(view)
    @login_required
    def wrapped(*args, **kwargs):
        if current_user()['role'] != 'admin':
            return render_template('404.html'), 404
        return view(*args, **kwargs)
    return wrapped


def mark_activity(user_id):
    today = datetime.utcnow().date().isoformat()
    db = get_db()
    db.execute('''INSERT INTO activity (user_id, activity_date, count) VALUES (?, ?, 1)
                  ON CONFLICT(user_id, activity_date) DO UPDATE SET count = count + 1''', (user_id, today))
    db.commit()


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
            db.execute('INSERT INTO skills (user_id, updated_at) VALUES (?, ?)', (cursor.lastrowid, datetime.utcnow().isoformat()))
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


@app.route('/test', methods=['GET', 'POST'])
@login_required
def knowledge_test():
    questions = [
        ('Which notation represents a qubit in a superposition?', ['|0>', '|1>', 'a|0> + b|1>', '00']),
        ('What does a Hadamard gate create from |0>?', ['A classical bit', 'Superposition', 'Noise', 'A measurement']),
        ('What is the purpose of a measurement?', ['To add qubits', 'To collapse a state to an outcome', 'To create a gate', 'To increase fidelity']),
        ('Which gate is commonly used as a controlled operation?', ['CNOT', 'Identity', 'T', 'S']),
    ]
    if request.method == 'POST':
        answers = request.form
        score = sum(1 for index, correct in enumerate(['2', '1', '1', '0']) if answers.get(f'q{index}') == correct)
        percentage = round(score / len(questions) * 100)
        db = get_db()
        db.execute('UPDATE users SET knowledge_test_done = 1, knowledge_score = ? WHERE id = ?', (percentage, current_user()['id']))
        db.commit()
        flash(f'Assessment complete: {percentage}%.', 'success')
        return redirect(url_for('dashboard'))
    return render_template('test.html', questions=questions)


@app.get('/modules')
@login_required
def modules():
    return render_template('modules.html', modules=MODULES)


@app.get('/roadmap')
@login_required
def roadmap():
    return render_template('roadmap.html', modules=MODULES)


@app.get('/skillmap')
@login_required
def skillmap():
    skills = get_db().execute('SELECT values_json FROM skills WHERE user_id = ?', (current_user()['id'],)).fetchone()
    values = json.loads(skills['values_json']) if skills else {}
    labels = ['mathematics', 'qubits', 'gates', 'circuits', 'qiskit', 'algorithms', 'qml', 'noise', 'hardware', 'research']
    return render_template('skillmap.html', skills={label: values.get(label, 0) for label in labels})


@app.get('/achievements')
@login_required
def achievements():
    progress = get_db().execute('SELECT completed_modules, lab_experiments FROM progress WHERE user_id = ?', (current_user()['id'],)).fetchone()
    completed = json.loads(progress['completed_modules'].replace('[', '[').replace(']', ']')) if progress and progress['completed_modules'] != '[]' else []
    badges = [
        ('Qubit Explorer', 'Complete Module 2', 2 in completed),
        ('Gate Master', 'Complete Modules 3 and 4', 3 in completed and 4 in completed),
        ('Quantum Architect', 'Complete all 24 modules', len(completed) >= 24),
        ('Lab Scientist', 'Run 10 experiments', (progress['lab_experiments'] if progress else 0) >= 10),
    ]
    return render_template('achievements.html', badges=badges)


@app.get('/race')
@login_required
def race():
    return render_template('race.html')


@app.route('/circuit', methods=['GET', 'POST'])
@login_required
def circuit():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        if name:
            get_db().execute('INSERT INTO circuits (user_id, name, qubits, operations_json, created_at) VALUES (?, ?, ?, ?, ?)', (current_user()['id'], name, int(request.form.get('qubits', 2)), request.form.get('operations', '[]'), datetime.utcnow().isoformat()))
            get_db().commit()
            flash('Circuit saved.', 'success')
    circuits = get_db().execute('SELECT * FROM circuits WHERE user_id = ? ORDER BY created_at DESC', (current_user()['id'],)).fetchall()
    return render_template('circuit.html', circuits=circuits)


@app.route('/lab', methods=['GET', 'POST'])
@login_required
def lab():
    if request.method == 'POST':
        db = get_db()
        db.execute('INSERT INTO experiments (user_id, name, preset, shots, noise_model, fidelity, results_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', (current_user()['id'], request.form.get('name', 'Untitled experiment'), request.form.get('preset', 'Bell State'), int(request.form.get('shots', 1000)), request.form.get('noise_model', 'ideal'), float(request.form.get('fidelity', 100)), request.form.get('results', '{}'), datetime.utcnow().isoformat()))
        db.execute('UPDATE progress SET lab_experiments = lab_experiments + 1, updated_at = ? WHERE user_id = ?', (datetime.utcnow().isoformat(), current_user()['id']))
        db.commit()
        flash('Experiment saved.', 'success')
    experiments = get_db().execute('SELECT * FROM experiments WHERE user_id = ? ORDER BY created_at DESC', (current_user()['id'],)).fetchall()
    return render_template('lab.html', experiments=experiments)


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
    mark_activity(user['id'])
    return jsonify({'success': True, 'completedModules': sorted(completed)})


@app.post('/api/circuits')
@login_required
def save_circuit_api():
    payload = request.get_json(silent=True) or {}
    db = get_db()
    cursor = db.execute('INSERT INTO circuits (user_id, name, qubits, operations_json, created_at) VALUES (?, ?, ?, ?, ?)', (current_user()['id'], payload.get('name', 'Untitled circuit'), int(payload.get('qubits', 2)), json.dumps(payload.get('operations', [])), datetime.utcnow().isoformat()))
    db.commit()
    return jsonify({'id': cursor.lastrowid, 'success': True})


@app.get('/api/chat')
@login_required
def chat_history():
    rows = get_db().execute('SELECT role, message, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at', (current_user()['id'],)).fetchall()
    return jsonify([dict(row) for row in rows])


@app.post('/api/tutor')
@login_required
def tutor():
    message = request.json.get('message', '').strip() if request.is_json else ''
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    db = get_db()
    db.execute('INSERT INTO chat_messages (user_id, role, message, created_at) VALUES (?, ?, ?, ?)', (current_user()['id'], 'user', message, datetime.utcnow().isoformat()))
    answer = 'Ask me about qubits, superposition, entanglement, gates, or quantum algorithms. Configure GROQ_API_KEY on Render to enable the live AI tutor.'
    db.execute('INSERT INTO chat_messages (user_id, role, message, created_at) VALUES (?, ?, ?, ?)', (current_user()['id'], 'ai', answer, datetime.utcnow().isoformat()))
    db.commit()
    return jsonify({'text': answer})


@app.get('/admin')
@admin_required
def admin():
    users = get_db().execute('SELECT id, name, email, role, knowledge_score, created_at FROM users ORDER BY created_at DESC').fetchall()
    activity = get_db().execute('SELECT activity_date, SUM(count) AS count FROM activity GROUP BY activity_date ORDER BY activity_date DESC LIMIT 30').fetchall()
    gates = get_db().execute('SELECT gate, SUM(count) AS count FROM gate_usage GROUP BY gate ORDER BY count DESC').fetchall()
    return render_template('admin.html', users=users, activity=activity, gates=gates, modules=MODULES)


@app.errorhandler(404)
def not_found(_error):
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=os.environ.get('FLASK_DEBUG') == '1')