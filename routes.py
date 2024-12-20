from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# Lista de tarefas (simples, em memória)
tasks = []

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        task = request.form.get('task')
        if task:
            tasks.append(task)
        return redirect(url_for('index'))
    return render_template('index.html', tasks=tasks)

@app.route('/delete/<int:task_id>', methods=['GET'])
def delete_task(task_id):
    if 0 <= task_id < len(tasks):
        tasks.pop(task_id)
    return redirect(url_for('index'))
