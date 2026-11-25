import io
import json
import unittest
import time
from app import app
import database

class StudyIATestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        import os
        os.environ['GEMINI_API_KEY'] = ''  # Para execução ultrarrápida dos testes unitários
        self.client = app.test_client()
        database.init_db()

        # Limpa o usuário de teste se já existir
        conn = database.get_db_connection()
        conn.execute("DELETE FROM users WHERE username = 'alunoteste'")
        conn.commit()
        conn.close()

    def test_full_user_flow(self):
        # 1. Registro de Usuário (F01)
        res = self.client.post('/register', data={
            'name': 'Aluno Teste',
            'username': 'alunoteste',
            'email': f'aluno_{int(time.time())}@teste.com',
            'password': 'senha123teste',
            'confirm_password': 'senha123teste'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Painel de Estudos", res.data)

        # 2. Iniciar Pesquisa de Assunto Geral com Fundamentação Conceitual Inicial (F02)
        res = self.client.post('/topic/new-subject', data={
            'title': 'Engenharia de Software e IA',
            'initial_question': 'Quais os principais benefícios de IA no desenvolvimento?'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Engenharia de Software e IA", res.data)

        # Obter o ID do tópico criado
        conn = database.get_db_connection()
        topic = conn.execute("SELECT id FROM study_topics WHERE title = ?", ('Engenharia de Software e IA',)).fetchone()
        self.assertIsNotNone(topic)
        topic_id = topic['id']

        # Verifica se a fundamentação conceitual inicial foi salva no banco de dados SQLite
        messages = conn.execute("SELECT * FROM chat_messages WHERE topic_id = ?", (topic_id,)).fetchall()
        self.assertTrue(len(messages) >= 1)
        self.assertIn("Conceitual", messages[-1]['content'])

        # 3. Teste de Envio de Dúvida Sucessiva no Chat (Armazenamento contínuo) (F03)
        res = self.client.post(f'/topic/{topic_id}/message', json={
            'message': 'Como organizar meus estudos de forma autorregulada?'
        })
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertIn('reply', json_data)

        # Verifica que a nova pergunta e resposta foram persistidas no SQLite
        messages_after = conn.execute("SELECT * FROM chat_messages WHERE topic_id = ?", (topic_id,)).fetchall()
        self.assertEqual(len(messages_after), len(messages) + 2)

        # 4. Teste de Exportação do Caderno de Estudos com todo o histórico gravado
        res_export = self.client.get(f'/topic/{topic_id}/export')
        self.assertEqual(res_export.status_code, 200)
        self.assertIn(b"Caderno de Estudos", res_export.data)

        # 5. Upload de Arquivo para Estudo Exclusivo (F05 / F06)
        file_content = (
            "Apostila de Banco de Dados.\n"
            "Normalização é o processo formal de organização de dados para evitar redundância.\n"
            "A Primeira Forma Normal (1FN) elimina grupos repetitivos de colunas."
        )
        fake_file = (io.BytesIO(file_content.encode('utf-8')), 'banco_dados.txt')
        res = self.client.post('/topic/upload-file', data={
            'document': fake_file,
            'custom_title': 'Apostila BD 2026'
        }, content_type='multipart/form-data', follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Apostila BD 2026", res.data)

        file_topic = conn.execute("SELECT id FROM study_topics WHERE title = ?", ('Apostila BD 2026',)).fetchone()
        file_topic_id = file_topic['id']

        # 6. Pergunta de informação que NÃO consta no arquivo (Verifica F06 - Fidelidade estrita)
        res = self.client.post(f'/topic/{file_topic_id}/message', json={
            'message': 'Qual a distância entre a Terra e Marte em quilômetros astronômicos?'
        })
        self.assertEqual(res.status_code, 200)
        reply = res.get_json()['reply']
        self.assertIn("não consta", reply.lower())

        # 7. Gerar Plano de Estudo (F07 / F08 / F09)
        res = self.client.post(f'/topic/{topic_id}/plan/create', data={
            'goal': 'Preparação para a prova final',
            'level': 'Intermediário',
            'daily_minutes': '30',
            'days_per_week': '5',
            'deadline': '10 dias'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Progresso Geral de Execu", res.data)

        plan = conn.execute("SELECT id FROM study_plans WHERE topic_id = ?", (topic_id,)).fetchone()
        plan_id = plan['id']

        # 8. Marcar Tarefa do Plano e Acompanhar Progresso (F13)
        res = self.client.post(f'/plan/{plan_id}/toggle-task', json={
            'task_key': 'd1_t0'
        })
        self.assertEqual(res.status_code, 200)
        progress_data = res.get_json()
        self.assertTrue(progress_data['progress_percent'] > 0)

        # 9. Criar e Submeter Mini Seminário (F10 / F11 / F12)
        res = self.client.post(f'/topic/{topic_id}/seminar/create', follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        seminar = conn.execute("SELECT id, questions_json FROM mini_seminars WHERE topic_id = ?", (topic_id,)).fetchone()
        seminar_id = seminar['id']
        q_data = json.loads(seminar['questions_json'])
        q1_id = str(q_data['questions'][0]['id'])
        q1_correct = q_data['questions'][0].get('correct_answer', 'A')

        res = self.client.post(f'/seminar/{seminar_id}/submit', data={
            f'q_{q1_id}': q1_correct,
            'q_2': 'A',
            'q_3': 'Minha resposta discursiva explicando com profundidade os conceitos e estratégias de aprendizagem.'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"avaliado com sucesso", res.data)

        conn.close()
        print("\n✅ Todos os testes automatizados do StudyIA passaram com 100% de sucesso!")


class RemoverConfigurarIATestCase(unittest.TestCase):
    """Funcionalidade 01 (docs/features/01-remover-configurar-ia.md): a chave do
    Gemini vem só do ambiente e a interface não pede mais chave."""

    def setUp(self):
        import os
        app.config['TESTING'] = True
        self._env_key = os.environ.get('GEMINI_API_KEY')
        os.environ['GEMINI_API_KEY'] = ''
        self.client = app.test_client()
        database.init_db()

        conn = database.get_db_connection()
        conn.execute("DELETE FROM users WHERE username = 'alunochave'")
        conn.commit()
        conn.close()

        self.client.post('/register', data={
            'name': 'Aluno Chave',
            'username': 'alunochave',
            'email': f'chave_{time.time_ns()}@teste.com',
            'password': 'senha123teste',
            'confirm_password': 'senha123teste'
        }, follow_redirects=True)

        conn = database.get_db_connection()
        self.user_id = conn.execute("SELECT id FROM users WHERE username = 'alunochave'").fetchone()['id']
        conn.close()

    def tearDown(self):
        import os
        if self._env_key is None:
            os.environ.pop('GEMINI_API_KEY', None)
        else:
            os.environ['GEMINI_API_KEY'] = self._env_key

    def test_rota_da_chave_removida(self):
        res = self.client.post('/settings/api-key', data={'gemini_api_key': 'AIzaSyTESTE'})
        self.assertIn(res.status_code, (404, 405))

        conn = database.get_db_connection()
        saved = conn.execute("SELECT gemini_api_key FROM users WHERE id = ?", (self.user_id,)).fetchone()
        conn.close()
        self.assertEqual(saved['gemini_api_key'] or '', '')

    def test_html_sem_modal_e_sem_botao(self):
        res = self.client.get('/dashboard')
        self.assertEqual(res.status_code, 200)
        for trecho in (b'settingsModal', b'openSettingsBtn', b'closeSettingsBtn',
                       b'gemini_api_key', b'Configurar IA', b'onclick'):
            self.assertNotIn(trecho, res.data)

    def test_banner_sem_chave_no_ambiente(self):
        import os
        os.environ['GEMINI_API_KEY'] = ''
        res = self.client.get('/dashboard')
        self.assertIn('Modo demonstração'.encode('utf-8'), res.data)
        self.assertIn('A IA não está configurada neste servidor'.encode('utf-8'), res.data)

    def test_banner_some_com_chave_no_ambiente(self):
        import os
        os.environ['GEMINI_API_KEY'] = 'chave-de-teste'
        res = self.client.get('/dashboard')
        self.assertEqual(res.status_code, 200)
        self.assertNotIn('A IA não está configurada neste servidor'.encode('utf-8'), res.data)

    def test_chave_do_banco_nao_e_usada(self):
        import os
        from flask import session
        from app import get_current_user_api_key

        conn = database.get_db_connection()
        conn.execute("UPDATE users SET gemini_api_key = 'chave-antiga-do-banco' WHERE id = ?", (self.user_id,))
        conn.commit()
        conn.close()

        os.environ['GEMINI_API_KEY'] = 'chave-do-ambiente'
        with app.test_request_context():
            session['user_id'] = self.user_id
            self.assertEqual(get_current_user_api_key(), 'chave-do-ambiente')

    def test_limpeza_das_chaves_salvas(self):
        conn = database.get_db_connection()
        conn.execute("UPDATE users SET gemini_api_key = 'chave-antiga-do-banco' WHERE id = ?", (self.user_id,))
        conn.commit()
        conn.close()

        database.init_db()

        conn = database.get_db_connection()
        restantes = conn.execute("SELECT COUNT(*) FROM users WHERE gemini_api_key != ''").fetchone()[0]
        conn.close()
        self.assertEqual(restantes, 0)


class SessaoOrfaTestCase(unittest.TestCase):
    """Sessão órfã (docs/handoff/backend-pendencias.md §17): o cookie aponta para
    um user_id que não existe no banco. O login_required limpa a sessão e manda
    para o login, em vez de abrir a página e falhar no INSERT (erro 500)."""

    def setUp(self):
        import os
        app.config['TESTING'] = True
        self._env_key = os.environ.get('GEMINI_API_KEY')
        os.environ['GEMINI_API_KEY'] = ''
        self.client = app.test_client()
        database.init_db()

        conn = database.get_db_connection()
        conn.execute("DELETE FROM users WHERE username = 'alunoorfao'")
        conn.commit()
        conn.close()

        self.client.post('/register', data={
            'name': 'Aluno Orfao',
            'username': 'alunoorfao',
            'email': f'orfao_{time.time_ns()}@teste.com',
            'password': 'senha123teste',
            'confirm_password': 'senha123teste'
        }, follow_redirects=True)

        # Remove o usuário do banco, mas mantém o cookie de sessão no cliente.
        conn = database.get_db_connection()
        self.user_id = conn.execute("SELECT id FROM users WHERE username = 'alunoorfao'").fetchone()['id']
        conn.execute("DELETE FROM users WHERE id = ?", (self.user_id,))
        conn.commit()
        conn.close()

        with self.client.session_transaction() as sess:
            self.assertEqual(sess.get('user_id'), self.user_id)

    def tearDown(self):
        import os
        if self._env_key is None:
            os.environ.pop('GEMINI_API_KEY', None)
        else:
            os.environ['GEMINI_API_KEY'] = self._env_key

    def test_dashboard_redireciona_e_limpa_a_sessao(self):
        res = self.client.get('/dashboard')
        self.assertEqual(res.status_code, 302)
        self.assertTrue(res.headers['Location'].endswith('/login'))

        with self.client.session_transaction() as sess:
            self.assertNotIn('user_id', sess)

        res = self.client.get('/login')
        self.assertEqual(res.status_code, 200)
        self.assertIn('Sua sessão expirou. Entre novamente.'.encode('utf-8'), res.data)

    def test_criar_assunto_nao_da_500(self):
        res = self.client.post('/topic/new-subject', data={
            'title': 'Assunto da Sessao Orfa',
            'initial_question': ''
        })
        self.assertEqual(res.status_code, 302)
        self.assertTrue(res.headers['Location'].endswith('/login'))

        conn = database.get_db_connection()
        criados = conn.execute(
            "SELECT COUNT(*) FROM study_topics WHERE title = 'Assunto da Sessao Orfa'"
        ).fetchone()[0]
        conn.close()
        self.assertEqual(criados, 0)

    def test_rota_json_mantem_o_redirect(self):
        # Decisão registrada: as rotas chamadas por fetch continuam com o redirect
        # do login_required (não 401 JSON) até o grupo decidir. Ver docs/handoff §17.
        res = self.client.post('/topic/1/message', json={'message': 'oi'})
        self.assertEqual(res.status_code, 302)
        self.assertTrue(res.headers['Location'].endswith('/login'))

    def test_sessao_valida_continua_entrando(self):
        self.client.post('/register', data={
            'name': 'Aluno Orfao',
            'username': 'alunoorfao',
            'email': f'orfao2_{time.time_ns()}@teste.com',
            'password': 'senha123teste',
            'confirm_password': 'senha123teste'
        })
        res = self.client.get('/dashboard')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Painel de Estudos", res.data)


class LandingTestCase(unittest.TestCase):
    """Landing page (docs/features/04-landing-page.md, §5.1): a rota / mostra a
    landing a quem não tem sessão e manda quem está logado para o dashboard."""

    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        database.init_db()

        conn = database.get_db_connection()
        conn.execute("DELETE FROM users WHERE username = 'alunolanding'")
        conn.commit()
        conn.close()

    def test_visitante_sem_sessao_ve_a_landing(self):
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('Transforme qualquer tema em'.encode('utf-8'), res.data)
        # Os dois caminhos da landing: cadastro e login
        self.assertIn(b'href="/register"', res.data)
        self.assertIn(b'href="/login"', res.data)

    def test_logado_vai_para_o_dashboard(self):
        self.client.post('/register', data={
            'name': 'Aluno Landing',
            'username': 'alunolanding',
            'email': f'landing_{time.time_ns()}@teste.com',
            'password': 'senha123teste',
            'confirm_password': 'senha123teste'
        })
        res = self.client.get('/')
        self.assertEqual(res.status_code, 302)
        self.assertTrue(res.headers['Location'].endswith('/dashboard'))


if __name__ == '__main__':
    unittest.main()
