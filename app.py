import os
import json
from functools import wraps
from datetime import datetime
from flask import (
    Flask, render_template, request, redirect, url_for,
    session, flash, jsonify, abort
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

import database
from file_processor import allowed_file, extract_text_from_file
import ai_service

# Carrega variáveis de ambiente
load_dotenv()

app = Flask(__name__)

if not os.environ.get("GEMINI_API_KEY"):
    app.logger.warning("GEMINI_API_KEY não definida: o StudyIA vai rodar em modo demonstração")

app.secret_key = os.environ.get("SECRET_KEY", "studyia_secret_una_2026")

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Evita cache de CSS/JS no navegador durante desenvolvimento

# Inicializa o banco de dados
database.init_db()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash("Por favor, faça login para acessar esta página.", "warning")
            return redirect(url_for('login'))

        # Sessão órfã: o cookie aponta para um usuário que não existe neste banco
        # (banco recriado, outro DATABASE_PATH, usuário removido). Sem esta checagem,
        # as páginas abrem e o primeiro INSERT falha com FOREIGN KEY (erro 500).
        conn = database.get_db_connection()
        user_exists = conn.execute(
            "SELECT 1 FROM users WHERE id = ?", (session['user_id'],)
        ).fetchone()
        conn.close()
        if not user_exists:
            session.clear()
            flash("Sua sessão expirou. Entre novamente.", "info")
            return redirect(url_for('login'))

        return f(*args, **kwargs)
    return decorated_function

def get_current_user_api_key():
    # A chave do Gemini vem só do ambiente (.env). A coluna users.gemini_api_key
    # não é mais lida e sai num PR futuro de banco (docs/features/01, opção C).
    return os.environ.get("GEMINI_API_KEY", "")

@app.context_processor
def inject_ai_mode():
    # Modo demonstração efetivo, disponível em todos os templates
    return {"ai_demo_mode": not os.environ.get("GEMINI_API_KEY")}

# ----------------------------------------------------
# ROTAS DE AUTENTICAÇÃO (F01 / RNF04 / RNF05)
# ----------------------------------------------------

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    # Visitante sem sessão: landing page (docs/features/04-landing-page.md, §5.1)
    return render_template('landing.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        username = request.form.get('username', '').strip().lower()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        if not name or not username or not email or not password:
            flash("Todos os campos obrigatórios devem ser preenchidos.", "danger")
            return render_template('register.html')

        if password != confirm_password:
            flash("As senhas informadas não coincidem.", "danger")
            return render_template('register.html')

        if len(password) < 6:
            flash("A senha deve conter no mínimo 6 caracteres.", "warning")
            return render_template('register.html')

        conn = database.get_db_connection()
        existing_user = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?", (username, email)
        ).fetchone()

        if existing_user:
            conn.close()
            flash("Nome de usuário ou e-mail já cadastrado no sistema.", "danger")
            return render_template('register.html')

        pw_hash = generate_password_hash(password)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)",
            (name, username, email, pw_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()

        session['user_id'] = user_id
        session['username'] = username
        session['name'] = name
        flash(f"Conta criada com sucesso! Bem-vindo(a) ao StudyIA, {name}.", "success")
        return redirect(url_for('dashboard'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        login_input = request.form.get('login_input', '').strip().lower()
        password = request.form.get('password', '')

        conn = database.get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE username = ? OR email = ?", (login_input, login_input)
        ).fetchone()
        conn.close()

        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['name'] = user['name']
            flash(f"Login realizado com sucesso! Olá, {user['name']}.", "success")
            return redirect(url_for('dashboard'))
        else:
            flash("Credenciais inválidas. Verifique seu usuário/e-mail e senha.", "danger")

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash("Sua sessão foi encerrada com segurança.", "info")
    return redirect(url_for('login'))

# ----------------------------------------------------
# DASHBOARD E HISTÓRICO (F02, F04, F05)
# ----------------------------------------------------

@app.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user_id']
    conn = database.get_db_connection()

    # Histórico de pesquisas e arquivos do usuário
    topics = conn.execute("""
        SELECT t.*,
               (SELECT COUNT(*) FROM study_plans p WHERE p.topic_id = t.id) as plans_count,
               (SELECT COUNT(*) FROM mini_seminars s WHERE s.topic_id = t.id) as seminars_count
        FROM study_topics t
        WHERE t.user_id = ?
        ORDER BY t.updated_at DESC, t.id DESC
    """, (user_id,)).fetchall()

    # Estatísticas do aluno
    total_topics = len(topics)
    total_plans = conn.execute("SELECT COUNT(*) FROM study_plans WHERE user_id = ?", (user_id,)).fetchone()[0]
    seminar_stats = conn.execute("""
        SELECT COUNT(*) as total_seminars, AVG(score) as avg_score
        FROM mini_seminars
        WHERE user_id = ? AND is_completed = 1
    """, (user_id,)).fetchone()

    total_seminars = seminar_stats['total_seminars'] or 0
    avg_score = round(seminar_stats['avg_score'], 1) if seminar_stats['avg_score'] is not None else None

    conn.close()

    return render_template(
        'dashboard.html',
        topics=topics,
        total_topics=total_topics,
        total_plans=total_plans,
        total_seminars=total_seminars,
        avg_score=avg_score
    )

# ----------------------------------------------------
# CRIAÇÃO DE TÓPICOS: ASSUNTO OU ARQUIVO (F02 / F05)
# ----------------------------------------------------

@app.route('/topic/new-subject', methods=['POST'])
@login_required
def new_subject():
    title = request.form.get('title', '').strip()
    initial_question = request.form.get('initial_question', '').strip()

    if not title:
        flash("Por favor, informe o assunto que deseja pesquisar.", "warning")
        return redirect(url_for('dashboard'))

    user_id = session['user_id']
    api_key = get_current_user_api_key()

    # 1. Cria o tópico no banco e fecha a conexão imediatamente
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO study_topics (user_id, title, topic_type)
        VALUES (?, ?, 'subject')
    """, (user_id, title))
    topic_id = cursor.lastrowid

    if initial_question:
        cursor.execute("""
            INSERT INTO chat_messages (topic_id, sender, content)
            VALUES (?, 'user', ?)
        """, (topic_id, initial_question))

    conn.commit()
    conn.close()

    # 2. Chama a IA para gerar a aula conceitual com o banco livre
    overview_text, is_simulated = ai_service.generate_topic_overview(
        topic_title=title,
        initial_question=initial_question,
        api_key=api_key
    )

    # 3. Abre rapidamente a conexão para persistir a resposta da IA
    conn = database.get_db_connection()
    conn.execute("""
        INSERT INTO chat_messages (topic_id, sender, content)
        VALUES (?, 'assistant', ?)
    """, (topic_id, overview_text))
    conn.commit()
    conn.close()

    flash(f"Estudo sobre '{title}' iniciado com fundamentação conceitual completa!", "success")
    return redirect(url_for('view_topic', topic_id=topic_id))

@app.route('/topic/<int:topic_id>/export')
@login_required
def export_topic(topic_id):
    user_id = session['user_id']
    conn = database.get_db_connection()
    topic = conn.execute("SELECT * FROM study_topics WHERE id = ? AND user_id = ?", (topic_id, user_id)).fetchone()
    if not topic:
        conn.close()
        flash("Tópico não encontrado.", "danger")
        return redirect(url_for('dashboard'))

    messages = conn.execute("SELECT * FROM chat_messages WHERE topic_id = ? ORDER BY id ASC", (topic_id,)).fetchall()
    conn.close()

    lines = [
        f"# Caderno de Estudos: {topic['title']}",
        f"**Tipo:** {'Estudo de Arquivo (' + topic['file_name'] + ')' if topic['topic_type'] == 'file' else 'Pesquisa Geral'}",
        f"**Exportado do StudyIA em:** {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        "---",
        ""
    ]
    for m in messages:
        label = "👤 **Pergunta do Estudante**" if m['sender'] == 'user' else "🤖 **Resposta do StudyIA**"
        lines.append(f"### {label} *({m['created_at'][:16]})*")
        lines.append(m['content'])
        lines.append("\n---\n")

    md_content = "\n".join(lines)
    return (
        md_content,
        200,
        {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": f"attachment; filename=estudo_{topic_id}_{secure_filename(topic['title'])}.md"
        }
    )

@app.route('/topic/upload-file', methods=['POST'])
@login_required
def upload_file():
    if 'document' not in request.files:
        flash("Nenhum arquivo foi selecionado para envio.", "danger")
        return redirect(url_for('dashboard'))

    file = request.files['document']
    if file.filename == '':
        flash("Selecione um arquivo PDF, TXT ou MD.", "warning")
        return redirect(url_for('dashboard'))

    if not allowed_file(file.filename):
        flash("Formato não suportado. Por favor, envie arquivos em PDF, TXT ou MD.", "danger")
        return redirect(url_for('dashboard'))

    user_id = session['user_id']
    orig_filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    saved_filename = f"user{user_id}_{timestamp}_{orig_filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
    file.save(file_path)

    # Extrai o texto do documento
    extracted_text, error = extract_text_from_file(file_path)
    if error:
        if os.path.exists(file_path):
            os.remove(file_path)
        flash(f"Falha no processamento: {error}", "danger")
        return redirect(url_for('dashboard'))

    # Título baseado no nome do arquivo ou campo opcional
    topic_title = request.form.get('custom_title', '').strip() or orig_filename

    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO study_topics (user_id, title, topic_type, file_name, file_path, extracted_text)
        VALUES (?, ?, 'file', ?, ?, ?)
    """, (user_id, topic_title, orig_filename, file_path, extracted_text))
    topic_id = cursor.lastrowid

    # Boas-vindas do assistente em modo exclusivo
    welcome_text = (
        f"Arquivo **{orig_filename}** carregado e processado com sucesso! (Modo: **Estudo Exclusivo de Arquivo**).\n\n"
        "🔒 **Garantia de Fidelidade:** Minhas respostas, planos e perguntas de seminário serão gerados "
        "**estritamente a partir do conteúdo deste documento**. Se você perguntar algo que não conste no texto, "
        "eu avisarei expressamente."
    )
    cursor.execute("""
        INSERT INTO chat_messages (topic_id, sender, content)
        VALUES (?, 'assistant', ?)
    """, (topic_id, welcome_text))

    conn.commit()
    conn.close()

    flash(f"Arquivo '{orig_filename}' processado com sucesso!", "success")
    return redirect(url_for('view_topic', topic_id=topic_id))

@app.route('/topic/<int:topic_id>/delete', methods=['POST'])
@login_required
def delete_topic(topic_id):
    user_id = session['user_id']
    conn = database.get_db_connection()
    topic = conn.execute("SELECT * FROM study_topics WHERE id = ? AND user_id = ?", (topic_id, user_id)).fetchone()

    if not topic:
        conn.close()
        flash("Tópico de estudo não encontrado.", "danger")
        return redirect(url_for('dashboard'))

    # Se for arquivo, remove do disco
    if topic['file_path'] and os.path.exists(topic['file_path']):
        try:
            os.remove(topic['file_path'])
        except Exception:
            pass

    conn.execute("DELETE FROM study_topics WHERE id = ?", (topic_id,))
    conn.commit()
    conn.close()

    flash(f"'{topic['title']}' foi excluído com sucesso.", "info")
    return redirect(url_for('dashboard'))

# ----------------------------------------------------
# VISUALIZAÇÃO DO TÓPICO E CHAT (F03, F06, F12)
# ----------------------------------------------------

@app.route('/topic/<int:topic_id>')
@login_required
def view_topic(topic_id):
    user_id = session['user_id']
    conn = database.get_db_connection()
    topic = conn.execute(
        "SELECT * FROM study_topics WHERE id = ? AND user_id = ?", (topic_id, user_id)
    ).fetchone()

    if not topic:
        conn.close()
        flash("Tópico não encontrado ou você não tem permissão para acessá-lo.", "danger")
        return redirect(url_for('dashboard'))

    messages = conn.execute(
        "SELECT * FROM chat_messages WHERE topic_id = ? ORDER BY id ASC", (topic_id,)
    ).fetchall()

    plans = conn.execute(
        "SELECT * FROM study_plans WHERE topic_id = ? ORDER BY id DESC", (topic_id,)
    ).fetchall()

    seminars = conn.execute(
        "SELECT * FROM mini_seminars WHERE topic_id = ? ORDER BY id DESC", (topic_id,)
    ).fetchall()

    conn.close()

    return render_template(
        'study_topic.html',
        topic=topic,
        messages=messages,
        plans=plans,
        seminars=seminars
    )

@app.route('/topic/<int:topic_id>/message', methods=['POST'])
@login_required
def send_message(topic_id):
    user_id = session['user_id']
    conn = database.get_db_connection()
    topic = conn.execute(
        "SELECT * FROM study_topics WHERE id = ? AND user_id = ?", (topic_id, user_id)
    ).fetchone()

    if not topic:
        conn.close()
        return jsonify({"error": "Tópico não encontrado"}), 404

    data = request.get_json() or {}
    user_message = data.get('message', '').strip()

    if not user_message:
        conn.close()
        return jsonify({"error": "Mensagem vazia"}), 400

    # Salva pergunta do usuário e commita imediatamente
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO chat_messages (topic_id, sender, content)
        VALUES (?, 'user', ?)
    """, (topic_id, user_message))
    conn.commit()

    # Busca histórico recente
    history_rows = conn.execute(
        "SELECT sender, content FROM chat_messages WHERE topic_id = ? ORDER BY id ASC", (topic_id,)
    ).fetchall()
    history = [{"sender": r['sender'], "content": r['content']} for r in history_rows]
    topic_title = topic['title']
    topic_type = topic['topic_type']
    extracted_text = topic['extracted_text']
    conn.close()

    # Chama IA com banco desconectado
    api_key = get_current_user_api_key()
    ai_reply, is_simulated = ai_service.ask_assistant(
        topic_title=topic_title,
        topic_type=topic_type,
        file_text=extracted_text,
        history=history,
        user_message=user_message,
        api_key=api_key
    )

    # Abre para salvar resposta e atualizar timestamp
    conn = database.get_db_connection()
    conn.execute("""
        INSERT INTO chat_messages (topic_id, sender, content)
        VALUES (?, 'assistant', ?)
    """, (topic_id, ai_reply))
    conn.execute("UPDATE study_topics SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (topic_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "reply": ai_reply,
        "is_simulated": is_simulated
    })

# ----------------------------------------------------
# PLANOS DE ESTUDO (F07, F08, F09, F13, F14)
# ----------------------------------------------------

@app.route('/topic/<int:topic_id>/plan/create', methods=['GET', 'POST'])
@login_required
def create_plan(topic_id):
    user_id = session['user_id']
    conn = database.get_db_connection()
    topic = conn.execute(
        "SELECT * FROM study_topics WHERE id = ? AND user_id = ?", (topic_id, user_id)
    ).fetchone()

    if not topic:
        conn.close()
        flash("Tópico de estudo não encontrado.", "danger")
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        goal = request.form.get('goal', 'Compreensão geral e fixação').strip()
        level = request.form.get('level', 'Iniciante')
        daily_minutes = int(request.form.get('daily_minutes', 30))
        days_per_week = int(request.form.get('days_per_week', 5))
        deadline = request.form.get('deadline', '').strip()

        topic_title = topic['title']
        topic_type = topic['topic_type']
        extracted_text = topic['extracted_text']
        conn.close()

        api_key = get_current_user_api_key()
        plan_data, is_simulated = ai_service.generate_study_plan(
            topic_title=topic_title,
            topic_type=topic_type,
            file_text=extracted_text,
            goal=goal,
            level=level,
            daily_minutes=daily_minutes,
            days_per_week=days_per_week,
            deadline=deadline,
            api_key=api_key
        )

        conn = database.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO study_plans (
                topic_id, user_id, goal, level, daily_minutes,
                days_per_week, deadline, plan_json, progress_percent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.0)
        """, (
            topic_id, user_id, goal, level, daily_minutes,
            days_per_week, deadline, json.dumps(plan_data, ensure_ascii=False)
        ))
        plan_id = cursor.lastrowid
        conn.commit()
        conn.close()

        flash("Plano de estudo personalizado gerado com sucesso!", "success")
        return redirect(url_for('view_plan', plan_id=plan_id))

    conn.close()
    return render_template('plan_create.html', topic=topic)

@app.route('/plan/<int:plan_id>')
@login_required
def view_plan(plan_id):
    user_id = session['user_id']
    conn = database.get_db_connection()
    plan = conn.execute("""
        SELECT p.*, t.title as topic_title, t.topic_type
        FROM study_plans p
        JOIN study_topics t ON t.id = p.topic_id
        WHERE p.id = ? AND p.user_id = ?
    """, (plan_id, user_id)).fetchone()

    if not plan:
        conn.close()
        flash("Plano de estudo não encontrado.", "danger")
        return redirect(url_for('dashboard'))

    plan_data = json.loads(plan['plan_json'])
    completed_tasks = json.loads(plan['completed_tasks_json'] or '[]')
    conn.close()

    return render_template(
        'plan_view.html',
        plan=plan,
        plan_data=plan_data,
        completed_tasks=completed_tasks
    )

@app.route('/plan/<int:plan_id>/toggle-task', methods=['POST'])
@login_required
def toggle_task(plan_id):
    user_id = session['user_id']
    data = request.get_json() or {}
    task_key = data.get('task_key')

    if not task_key:
        return jsonify({"error": "Chave da tarefa não fornecida"}), 400

    conn = database.get_db_connection()
    plan = conn.execute(
        "SELECT * FROM study_plans WHERE id = ? AND user_id = ?", (plan_id, user_id)
    ).fetchone()

    if not plan:
        conn.close()
        return jsonify({"error": "Plano não encontrado"}), 404

    plan_data = json.loads(plan['plan_json'])
    completed = json.loads(plan['completed_tasks_json'] or '[]')

    # Alterna o estado da tarefa
    if task_key in completed:
        completed.remove(task_key)
        status = "unchecked"
    else:
        completed.append(task_key)
        status = "checked"

    # Calcula percentual total de progresso (F13)
    total_tasks = 0
    for day in plan_data.get('days', []):
        total_tasks += len(day.get('tasks', []))

    progress = round((len(completed) / max(1, total_tasks)) * 100, 1) if total_tasks > 0 else 0.0

    conn.execute("""
        UPDATE study_plans
        SET completed_tasks_json = ?, progress_percent = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (json.dumps(completed), progress, plan_id))
    conn.commit()
    conn.close()

    return jsonify({
        "status": status,
        "progress_percent": progress,
        "completed_count": len(completed),
        "total_tasks": total_tasks
    })

# ----------------------------------------------------
# MINI SEMINÁRIOS INTERATIVOS (F10, F11, F12)
# ----------------------------------------------------

@app.route('/topic/<int:topic_id>/seminar/create', methods=['POST'])
@login_required
def create_seminar(topic_id):
    user_id = session['user_id']
    conn = database.get_db_connection()
    topic = conn.execute(
        "SELECT * FROM study_topics WHERE id = ? AND user_id = ?", (topic_id, user_id)
    ).fetchone()

    if not topic:
        conn.close()
        flash("Tópico não encontrado.", "danger")
        return redirect(url_for('dashboard'))

    topic_title = topic['title']
    topic_type = topic['topic_type']
    extracted_text = topic['extracted_text']
    conn.close()

    api_key = get_current_user_api_key()
    seminar_data, is_simulated = ai_service.generate_mini_seminar(
        topic_title=topic_title,
        topic_type=topic_type,
        file_text=extracted_text,
        api_key=api_key
    )

    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO mini_seminars (topic_id, user_id, title, questions_json)
        VALUES (?, ?, ?, ?)
    """, (
        topic_id, user_id, seminar_data.get('title', f"Mini Seminário: {topic_title}"),
        json.dumps(seminar_data, ensure_ascii=False)
    ))
    seminar_id = cursor.lastrowid
    conn.commit()
    conn.close()

    flash("Mini Seminário preparado com sucesso! Responda às perguntas abaixo.", "info")
    return redirect(url_for('view_seminar', seminar_id=seminar_id))

@app.route('/seminar/<int:seminar_id>')
@login_required
def view_seminar(seminar_id):
    user_id = session['user_id']
    conn = database.get_db_connection()
    seminar = conn.execute("""
        SELECT s.*, t.title as topic_title, t.topic_type
        FROM mini_seminars s
        JOIN study_topics t ON t.id = s.topic_id
        WHERE s.id = ? AND s.user_id = ?
    """, (seminar_id, user_id)).fetchone()

    if not seminar:
        conn.close()
        flash("Mini Seminário não encontrado.", "danger")
        return redirect(url_for('dashboard'))

    questions_data = json.loads(seminar['questions_json'])
    user_answers = json.loads(seminar['user_answers_json'] or '{}')
    feedback_data = json.loads(seminar['feedback_json'] or '{}') if seminar['feedback_json'] else None
    conn.close()

    return render_template(
        'seminar_view.html',
        seminar=seminar,
        questions_data=questions_data,
        user_answers=user_answers,
        feedback_data=feedback_data
    )

@app.route('/seminar/<int:seminar_id>/submit', methods=['POST'])
@login_required
def submit_seminar(seminar_id):
    user_id = session['user_id']
    conn = database.get_db_connection()
    seminar = conn.execute("""
        SELECT s.*, t.title as topic_title, t.topic_type, t.extracted_text
        FROM mini_seminars s
        JOIN study_topics t ON t.id = s.topic_id
        WHERE s.id = ? AND s.user_id = ?
    """, (seminar_id, user_id)).fetchone()

    if not seminar:
        conn.close()
        flash("Mini Seminário não encontrado.", "danger")
        return redirect(url_for('dashboard'))

    questions_data = json.loads(seminar['questions_json'])
    questions_list = questions_data.get('questions', [])
    topic_title = seminar['topic_title']
    topic_type = seminar['topic_type']
    extracted_text = seminar['extracted_text']
    conn.close()

    # Coleta as respostas do formulário
    user_answers = {}
    for q in questions_list:
        qid = str(q.get('id'))
        answer = request.form.get(f"q_{qid}", "").strip()
        user_answers[qid] = answer

    api_key = get_current_user_api_key()
    evaluation, is_simulated = ai_service.evaluate_mini_seminar(
        topic_title=topic_title,
        topic_type=topic_type,
        file_text=extracted_text,
        questions=questions_list,
        user_answers=user_answers,
        api_key=api_key
    )

    score = float(evaluation.get('score', 0.0))

    conn = database.get_db_connection()
    conn.execute("""
        UPDATE mini_seminars
        SET user_answers_json = ?, feedback_json = ?, score = ?, is_completed = 1
        WHERE id = ?
    """, (
        json.dumps(user_answers, ensure_ascii=False),
        json.dumps(evaluation, ensure_ascii=False),
        score,
        seminar_id
    ))
    conn.commit()
    conn.close()

    flash(f"Mini Seminário avaliado com sucesso! Sua nota foi: {score}%", "success")
    return redirect(url_for('view_seminar', seminar_id=seminar_id))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
