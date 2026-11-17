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

if __name__ == '__main__':
    unittest.main()
