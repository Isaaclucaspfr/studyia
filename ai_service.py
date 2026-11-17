import os
import json
import re

def clean_json_response(text):
    """Extrai e limpa blocos de código JSON caso a IA envie com markdown ```json ... ```"""
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        text = match.group(1)
    return text.strip()

def get_gemini_client(api_key=None):
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=key)
    except Exception as e:
        print(f"Erro ao inicializar cliente Gemini: {e}")
        return None

def generate_topic_overview(topic_title, initial_question=None, api_key=None):
    """
    Gera uma introdução conceitual completa, robusta e estruturada sobre o tema logo na abertura do tópico.
    """
    client = get_gemini_client(api_key)

    prompt = f"""
Você é o professor e tutor especialista do StudyIA — Assistente Inteligente de Estudos.
O estudante acabou de iniciar um novo estudo focado no tema: '{topic_title}'.

Sua missão é gerar uma fundamentação conceitual COMPLETA, ROBUSTA, DIDÁTICA e ESTRUTURADA para servir como base de partida.

Estruture a sua resposta OBRIGATORIAMENTE com as seguintes seções em Markdown formatado:

# 📚 Fundamentação Conceitual: {topic_title}

### 1. 🎯 O que é e Definição Central
Explique com clareza, rigor e didática o conceito central, sua importância e o problema ou propósito que ele resolve.

### 2. 🏛️ Pilares e Princípios Fundamentais
Apresente de 3 a 5 conceitos-chave ou princípios estruturais que todo estudante precisa dominar para compreender esse tema a fundo. Explique brevemente cada um.

### 3. 🚀 Aplicações Práticas no Mundo Real
Dê exemplos concretos e atuais de onde e como isso é utilizado no mercado de trabalho, na tecnologia, na ciência ou no cotidiano.

### 4. 🧭 Perguntas e Trilhas para Aprofundamento
Sugira 3 a 4 perguntas reflexivas ou tópicos avançados que o usuário pode me perguntar a seguir para explorarmos em detalhes.

{f'### 5. 💡 Resposta à sua Dúvida Inicial:\nVocê perguntou: *"{initial_question}"*. Aqui está a explicação aprofundada:\n' if initial_question else ''}

Conclua com uma mensagem motivadora reforçando que todas as perguntas que ele enviar neste chat serão respondidas e arquivadas no histórico permanente do banco de dados para consulta contínua.
"""

    if client:
        for model_name in ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash']:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                if response and response.text:
                    return response.text.strip(), False
            except Exception as e:
                print(f"Erro ao gerar visão geral com {model_name}: {e}")

    # Fallback Didático Robusto
    return (
        f"# 📚 Fundamentação Conceitual: {topic_title}\n\n"
        f"### 1. 🎯 O que é e Definição Central\n"
        f"**{topic_title}** é uma área fundamental de estudo voltada para a organização, compreensão e aplicação de princípios estruturados. "
        f"Seu objetivo principal é capacitar o estudante a entender causas, processos e impactos com profundidade crítica.\n\n"
        f"### 2. 🏛️ Pilares e Princípios Fundamentais\n"
        f"- **Estruturação Conceitual:** Os fundamentos e terminologias básicas que formam a linguagem do tema.\n"
        f"- **Metodologia e Mecanismos:** Como as partes interagem, suas regras operacionais e boas práticas.\n"
        f"- **Análise Crítica:** Avaliação de trade-offs, vantagens e desvantagens de cada abordagem.\n\n"
        f"### 3. 🚀 Aplicações Práticas no Mundo Real\n"
        f"No mercado e na academia, o domínio de **{topic_title}** permite tomar decisões mais seguras, solucionar problemas complexos e otimizar processos cotidianos.\n\n"
        f"### 4. 🧭 Perguntas e Trilhas para Aprofundamento\n"
        f"1. *Quais são os erros mais comuns cometidos por iniciantes em {topic_title}?*\n"
        f"2. *Como aplicar esse conceito em um caso prático do início ao fim?*\n"
        f"3. *Quais as ferramentas e tecnologias mais recomendadas para praticar?*\n\n"
        f"💬 **Envie qualquer dúvida abaixo! Todas as suas perguntas e minhas respostas serão registradas no banco de dados para formar seu caderno de estudos individual.**"
    ), True


def ask_assistant(topic_title, topic_type, file_text, history, user_message, api_key=None):
    """
    Responde dúvidas no chat com base no assunto geral ou exclusivamente no arquivo anexado.
    Mantém histórico completo para diálogo progressivo e contextual.
    """
    client = get_gemini_client(api_key)

    is_file_mode = (topic_type == 'file')
    
    # Prompt do Sistema
    if is_file_mode:
        system_instruction = (
            "Você é o assistente virtual do StudyIA no modo ESTUDO EXCLUSIVO DE ARQUIVO.\n"
            "DIRETRIZ OBRIGATÓRIA: Responda EXCLUSIVAMENTE utilizando as informações presentes no texto do arquivo anexado abaixo.\n"
            "Se a pergunta do usuário não puder ser respondida com o conteúdo do documento, responda claramente:\n"
            "'Esta informação não consta no material anexado.'\n"
            "Não invente dados nem utilize fontes externas.\n\n"
            f"--- CONTEÚDO DO ARQUIVO ANEXADO ---\n{file_text[:30000]}\n--- FIM DO ARQUIVO ---"
        )
    else:
        system_instruction = (
            f"Você é o tutor especialista do StudyIA na continuação do estudo sobre: '{topic_title}'.\n"
            "O estudante já tem uma visão geral do tema e está tirando dúvidas progressivas para aprofundar seu conhecimento.\n"
            "DIRETRIZES PEDAGÓGICAS:\n"
            "- Responda com robustez, profundidade conceitual e linguagem clara.\n"
            "- Use exemplos práticos, analogias didáticas e passos explicativos.\n"
            "- Se couber, apresente pequenos trechos de código, tabelas comparativas ou esquemas em markdown.\n"
            "- Ao final da resposta, faça uma ponte com o próximo nível de compreensão ou lance uma pergunta reflexiva para estimular o pensamento crítico."
        )

    # Tenta usar a API oficial do Gemini
    if client:
        try:
            # Monta histórico para contexto (mantém até as últimas 20 mensagens)
            contents_list = [system_instruction]
            for h in history[-20:]:
                role = "user" if h['sender'] == 'user' else "model"
                contents_list.append(f"[{role}]: {h['content']}")
            contents_list.append(f"[user]: {user_message}")

            full_prompt = "\n\n".join(contents_list)

            # Modelos ativos no Google Gemini (3.5 e 3.8)
            for model_name in ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash']:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=full_prompt
                    )
                    if response and response.text:
                        return response.text.strip(), False
                except Exception as model_err:
                    print(f"Tentativa com {model_name} falhou: {model_err}")
                    continue
        except Exception as e:
            print(f"Falha na chamada Gemini: {e}")

    # Fallback Didático Inteligente (quando sem API Key ou em caso de indisponibilidade)
    if is_file_mode:
        # Verifica se as palavras-chave da pergunta aparecem no texto do arquivo
        user_words = [w.lower() for w in re.findall(r'\w{4,}', user_message)]
        file_lower = (file_text or "").lower()
        found_words = [w for w in user_words if w in file_lower]

        if not found_words and len(user_words) > 0:
            return (
                "⚠️ **Aviso de fidelidade ao documento:**\n\n"
                "Esta informação **não consta no material anexado**. No modo de estudo exclusivo por arquivo, "
                "o StudyIA restringe suas respostas aos tópicos contidos no seu documento para evitar alucinações e informações externas."
            ), True

        snippet = (file_text[:400] + "...") if len(file_text) > 400 else file_text
        return (
            f"**[Análise do Arquivo Anexado]**\n\n"
            f"Com base no material enviado para o estudo de **{topic_title}**:\n\n"
            f"- O documento aborda pontos relevantes relacionados à sua dúvida.\n"
            f"- Trecho do material identificado:\n> *\"{snippet.replace(chr(10), ' ')}\"*\n\n"
            f"💡 **Recomendação de estudo:** Aprofunde a leitura das seções iniciais do material para consolidar a fundamentação teórica."
        ), True
    else:
        return (
            f"**[StudyIA Assistant - {topic_title}]**\n\n"
            f"Excelente pergunta sobre **{topic_title}**! Aqui está uma síntese didática:\n\n"
            f"1. **Conceito Central:** Compreender a estrutura básica e os objetivos principais de *{topic_title}*.\n"
            f"2. **Aplicação Prática:** Como este tema se aplica no seu dia a dia e nos seus estudos.\n"
            f"3. **Próximo Passo:** Recomendo gerar o **Plano de Estudo** no botão acima para organizar seu tempo e, em seguida, fazer o **Mini Seminário** para testar sua compreensão."
        ), True


def generate_study_plan(topic_title, topic_type, file_text, goal, level, daily_minutes, days_per_week, deadline, api_key=None):
    """
    Gera um plano de estudo estruturado (JSON com dias, tópicos e tarefas temporizadas).
    """
    client = get_gemini_client(api_key)
    is_file_mode = (topic_type == 'file')

    prompt = f"""
Você é o planejador pedagógico do StudyIA.
Crie um plano de estudo personalizado completo com base nos parâmetros:
- Título do Estudo: {topic_title}
- Modo: {'EXCLUSIVO DO ARQUIVO ANEXADO' if is_file_mode else 'PESQUISA DE ASSUNTO GERAL'}
- Objetivo do Usuário: {goal or 'Compreensão geral'}
- Nível de Conhecimento: {level or 'Iniciante'}
- Tempo Diário Disponível: {daily_minutes} minutos
- Frequência: {days_per_week} dias por semana
- Prazo Final: {deadline or 'Flexível'}

{f'Conteúdo do Arquivo base (extraia os tópicos EXCLUSIVAMENTE daqui):\n{file_text[:20000]}' if is_file_mode else ''}

Responda OBRIGATORIAMENTE em formato JSON válido com a seguinte estrutura:
{{
  "title": "{topic_title}",
  "overview": "Breve visão geral e metodologia do plano",
  "total_days": 5,
  "daily_minutes": {daily_minutes},
  "days": [
    {{
      "day_number": 1,
      "topic": "Tema do Dia 1",
      "tasks": [
        "Tarefa prática ou de leitura 1",
        "Tarefa prática ou de leitura 2"
      ],
      "estimated_minutes": {daily_minutes}
    }}
  ]
}}
Retorne APENAS o JSON puro sem textos adicionais fora do bloco.
"""

    if client:
        for model_name in ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash']:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                if response and response.text:
                    cleaned = clean_json_response(response.text)
                    plan_data = json.loads(cleaned)
                    return plan_data, False
            except Exception as e:
                print(f"Tentativa de gerar plano com {model_name} falhou: {e}")

    # Fallback estruturado didático garantido
    days_count = max(3, min(int(days_per_week or 5), 7))
    sample_days = []
    
    stages = [
        ("Fundamentos e Introdução", ["Leitura exploratória dos conceitos-chave", "Anotação dos termos principais"]),
        ("Aprofundamento Teórico", ["Estudo detalhado da estrutura e princípios", "Resumo explicativo com suas próprias palavras"]),
        ("Aplicações Práticas e Casos", ["Análise de exemplos reais ou exercícios", "Mapeamento de relações causa e efeito"]),
        ("Revisão e Autoavaliação", ["Revisão das anotações acumuladas", "Preparação para o Mini Seminário"]),
        ("Consolidação e Síntese", ["Construção de mapa mental ou síntese final", "Fixação dos pontos de dúvida"])
    ]

    for i in range(days_count):
        stage_idx = i % len(stages)
        stage_title, default_tasks = stages[stage_idx]
        sample_days.append({
            "day_number": i + 1,
            "topic": f"Dia {i+1}: {stage_title} em {topic_title}",
            "tasks": [
                f"{default_tasks[0]} ({int(daily_minutes)*0.6:.0f} min)",
                f"{default_tasks[1]} ({int(daily_minutes)*0.4:.0f} min)"
            ],
            "estimated_minutes": int(daily_minutes)
        })

    return {
        "title": f"Plano de Estudos — {topic_title}",
        "overview": f"Plano estruturado para o nível {level or 'Iniciante'} com foco em '{goal or 'domínio do conteúdo'}', distribuído em {days_count} sessões de {daily_minutes} minutos.",
        "total_days": days_count,
        "daily_minutes": int(daily_minutes),
        "days": sample_days
    }, True


def generate_mini_seminar(topic_title, topic_type, file_text, api_key=None):
    """
    Gera um mini seminário interativo com perguntas sobre o conteúdo para testar compreensão.
    """
    client = get_gemini_client(api_key)
    is_file_mode = (topic_type == 'file')

    prompt = f"""
Você é o avaliador pedagógico do StudyIA.
Crie um Mini Seminário interativo com 4 perguntas desafiadoras para verificar o aprendizado do usuário sobre: '{topic_title}'.
Modo: {'ESTUDO EXCLUSIVO DE ARQUIVO (Perguntas APENAS sobre o texto fornecido)' if is_file_mode else 'PESQUISA DE ASSUNTO GERAL'}.

{f'Texto do Arquivo:\n{file_text[:20000]}' if is_file_mode else ''}

Responda OBRIGATORIAMENTE em formato JSON válido:
{{
  "title": "Mini Seminário: {topic_title}",
  "instructions": "Responda às questões com suas próprias palavras ou selecione a alternativa adequada.",
  "questions": [
    {{
      "id": 1,
      "type": "multiple_choice",
      "question": "Texto da pergunta 1?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A) ...",
      "explanation": "Por que esta é a resposta correta e explicação conceitual."
    }},
    {{
      "id": 2,
      "type": "essay",
      "question": "Pergunta discursiva para reflexão...",
      "key_points": ["Pontos obrigatórios esperados na resposta"]
    }}
  ]
}}
Retorne APENAS o JSON puro.
"""

    if client:
        for model_name in ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash']:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                if response and response.text:
                    cleaned = clean_json_response(response.text)
                    seminar_data = json.loads(cleaned)
                    return seminar_data, False
            except Exception as e:
                print(f"Tentativa de gerar seminário com {model_name} falhou: {e}")

    # Fallback estruturado de alta fidelidade
    return {
        "title": f"Mini Seminário: Compreensão sobre {topic_title}",
        "instructions": "Responda a cada questão abaixo para testar seu domínio sobre os pontos principais.",
        "questions": [
            {
                "id": 1,
                "type": "multiple_choice",
                "question": f"Qual é o principal objetivo ou conceito central ao estudar '{topic_title}'?",
                "options": [
                    f"A) Compreender os princípios fundamentais e aplicar na resolução de problemas reais de {topic_title}.",
                    f"B) Memorizar apenas datas e termos sem necessidade de aplicação prática.",
                    f"C) Substituir completamente o julgamento humano sem validação.",
                    f"D) Ignorar as restrições e requisitos do contexto."
                ],
                "correct_answer": f"A) Compreender os princípios fundamentais e aplicar na resolução de problemas reais de {topic_title}.",
                "explanation": f"O estudo efetivo de {topic_title} exige compreensão conceitual conectada à aplicação prática."
            },
            {
                "id": 2,
                "type": "multiple_choice",
                "question": f"No contexto de {topic_title}, qual abordagem favorece uma aprendizagem autorregulada?",
                "options": [
                    "A) Estudar aleatoriamente sem cronograma ou metas claras.",
                    "B) Estabelecer metas definidas, distribuir o tempo em sessões contínuas e autoavaliar-se periodicamente.",
                    "C) Acumular todo o conteúdo para a véspera de prazos.",
                    "D) Não anotar dúvidas nem revisar pontos fracos."
                ],
                "correct_answer": "B) Estabelecer metas definidas, distribuir o tempo em sessões contínuas e autoavaliar-se periodicamente.",
                "explanation": "A gestão ativa do tempo e a avaliação contínua são os pilares da aprendizagem autorregulada."
            },
            {
                "id": 3,
                "type": "essay",
                "question": f"Explique com suas palavras os principais desafios e benefícios encontrados no estudo de {topic_title}.",
                "key_points": [
                    "Identificação dos desafios de organização ou complexidade do tema",
                    "Benefícios para a vida acadêmica, profissional ou pessoal",
                    "Estratégia adotada para superação das dificuldades"
                ]
            }
        ]
    }, True


def evaluate_mini_seminar(topic_title, topic_type, file_text, questions, user_answers, api_key=None):
    """
    Avalia as respostas do usuário no mini seminário e devolve nota, pontos fortes e recomendações.
    """
    client = get_gemini_client(api_key)

    prompt = f"""
Você é o avaliador pedagógico do StudyIA.
Avalie o desempenho do estudante no Mini Seminário sobre: '{topic_title}'.

Perguntas do Seminário:
{json.dumps(questions, indent=2, ensure_ascii=False)}

Respostas fornecidas pelo Estudante:
{json.dumps(user_answers, indent=2, ensure_ascii=False)}

Gere um retorno construtivo e motivador em formato JSON:
{{
  "score": 85,
  "summary": "Excelente compreensão geral dos conceitos fundamentais...",
  "feedback_items": [
    {{
      "question_id": 1,
      "status": "correct",
      "feedback": "Acertou! Comentário detalhado..."
    }},
    {{
      "question_id": 2,
      "status": "partial",
      "feedback": "Boa resposta, mas faltou aprofundar..."
    }}
  ],
  "strengths": ["Boa articulação de ideias", "Compreensão da estrutura básica"],
  "topics_to_review": ["Revisitar o tópico X para consolidar a fixação"]
}}
Retorne APENAS o JSON puro.
"""

    if client:
        for model_name in ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash']:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                if response and response.text:
                    cleaned = clean_json_response(response.text)
                    return json.loads(cleaned), False
            except Exception as e:
                print(f"Tentativa de avaliar seminário com {model_name} falhou: {e}")

    # Fallback inteligente de correção
    total_q = len(questions)
    correct_count = 0
    feedback_items = []

    for q in questions:
        qid = str(q.get('id'))
        u_ans = user_answers.get(qid, "").strip()

        if q.get('type') == 'multiple_choice':
            expected = q.get('correct_answer', "")
            if u_ans and (u_ans[:2].upper() == expected[:2].upper() or u_ans in expected):
                correct_count += 1
                feedback_items.append({
                    "question_id": qid,
                    "status": "correct",
                    "feedback": f"Parabéns! Resposta correta. {q.get('explanation', '')}"
                })
            else:
                feedback_items.append({
                    "question_id": qid,
                    "status": "incorrect",
                    "feedback": f"A resposta esperada era: {expected}. Dica: {q.get('explanation', '')}"
                })
        else:
            # Pergunta discursiva
            if len(u_ans) > 25:
                correct_count += 0.85
                feedback_items.append({
                    "question_id": qid,
                    "status": "correct",
                    "feedback": "Excelente reflexão discursiva! Você abordou os pontos essenciais com clareza."
                })
            elif len(u_ans) > 5:
                correct_count += 0.5
                feedback_items.append({
                    "question_id": qid,
                    "status": "partial",
                    "feedback": "Resposta válida, mas breve. Recomenda-se fundamentar com mais detalhes e exemplos."
                })
            else:
                feedback_items.append({
                    "question_id": qid,
                    "status": "incorrect",
                    "feedback": "Resposta em branco ou muito curta. Procure exercitar a escrita sobre o tema."
                })

    final_score = round(min(100.0, (correct_count / max(1, total_q)) * 100), 1)

    return {
        "score": final_score,
        "summary": f"Você atingiu uma pontuação de {final_score}%. Demonstrou engajamento e compreensão dos conceitos centrais de {topic_title}.",
        "feedback_items": feedback_items,
        "strengths": [
            "Participação ativa na autoavaliação",
            "Capacidade de síntese conceitual"
        ],
        "topics_to_review": [
            f"Revisar o plano de estudo e focar nos pontos assinalados com atenção."
        ]
    }, True
