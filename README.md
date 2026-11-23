# StudyIA — Assistente Inteligente de Estudos 🚀
**Projeto A3 — Inteligência Artificial para o Cotidiano**  
*Unidade Curricular: Inteligência Artificial (Sistemas de Informação)*

---

## 📖 Visão Geral

O **StudyIA** é uma aplicação completa desenvolvida para transformar a forma como estudantes, profissionais e entusiastas pesquisam e aprendem. A plataforma resolve a sobrecarga e a dispersão de informações, organizando os conteúdos em um processo estruturado de aprendizagem com:

1. **Pesquisa por Assunto Geral:** Interação conversacional didática com a IA para explicar temas e esclarecer dúvidas.
2. **Estudo Exclusivo de Arquivo Anexado:** Upload e processamento de arquivos (PDF, TXT, MD) com garantia de fidelidade estrita ao material enviado.
3. **Planos de Estudo Personalizados:** Cronogramas com metas diárias temporizadas e checklist interativo de progresso.
4. **Mini Seminários Interativos:** Avaliações formativas com perguntas de múltipla escolha e discursivas, retorno pedagógico imediato e notas de aproveitamento.
5. **Histórico Individual Seguro:** Autenticação por login e senha com persistência isolada por usuário.

---

## 🛠️ Tecnologias Utilizadas

* **Linguagem & Backend:** Python 3.12, Flask 3.1
* **Banco de Dados:** SQLite3 (com integridade relacional e chaves estrangeiras)
* **Segurança:** `werkzeug.security` (PBKDF2 SHA256 para senhas)
* **Processamento de Documentos:** `pypdf` para extração de textos de PDFs e leitor de arquivos UTF-8
* **Inteligência Artificial:** Google Gemini (`google-genai` SDK) + Motor de Simulação Didática Inteligente para demonstrações offline
* **Frontend:** HTML5 semântico, CSS3 moderno (Design System customizado responsivo) e JavaScript assíncrono (Fetch API)

---

## 📋 Mapeamento de Requisitos do GitBook

| Requisito | Funcionalidade | Implementação no Projeto |
| :--- | :--- | :--- |
| **F01** | Cadastro e Acesso | Rotas `/register`, `/login`, `/logout` com sessão criptografada |
| **F02** | Pesquisa de Assuntos | Rota `/topic/new-subject` |
| **F03** | Assistente de IA | Rota `/topic/<id>/message` com prompts didáticos estruturados |
| **F04** | Histórico Individual | Tabela `study_topics` isolada por `user_id` e exibida no `/dashboard` |
| **F05** | Anexo de Arquivo | Rota `/topic/upload-file` (validação de formato PDF/TXT/MD e limite de 10MB) |
| **F06** | Estudo Exclusivo de Arquivo | Prompt ancorado estritamente no texto do documento com recusa a dados externos |
| **F07** | Preferências de Estudo | Formulário em `/topic/<id>/plan/create` (nível, tempo/dia, dias/semana, prazo) |
| **F08 / F09** | Geração e Visualização do Plano | Cronograma temporizado por sessões em `/plan/<id>` |
| **F10 / F11** | Mini Seminário e Retorno | Rota `/seminar/<id>` com perguntas interativas e feedback avaliativo da IA |
| **F12** | Consulta de Atividades | Vínculo relacional entre tópicos, planos e seminários |
| **F13** | Acompanhamento do Progresso | Checkbox interativo com cálculo dinâmico de percentual de conclusão |
| **F14** | Ajuste do Plano | Botão para redefinir parâmetros pedagógicos |
| **F15** | Exclusão de Conteúdos | Rota `/topic/<id>/delete` com confirmação e exclusão em cascata |
| **RNF04** | Segurança | Hash seguro de senhas e proteção de arquivos |
| **RNF06** | Transparência de IA | Avisos visuais claros de que o conteúdo foi gerado por IA |
| **RNF07** | Fidelidade ao Arquivo | Bloqueio de respostas fora do escopo do documento enviado |

---

## 🚀 Como Executar o Projeto

### 1. Clonar ou Acessar a Pasta do Projeto
```bash
cd "c:\Users\Administrator\Documents\projeto una terca"
```

### 2. Instalar as Dependências
```bash
pip install -r requirements.txt
```

### 3. Configurar a Chave da API Gemini (Opcional)
A chave do Google AI Studio fica **só** no arquivo `.env` (ou na variável de ambiente `GEMINI_API_KEY` do servidor):
```env
GEMINI_API_KEY=AIzaSy...
```
*Nota: a interface web não pede nem guarda chave. Sem `GEMINI_API_KEY`, a aplicação roda no **Modo de Demonstração**: o painel mostra um aviso, as respostas usam conteúdo de exemplo e o servidor registra um alerta no log ao iniciar.*

### 4. Executar os Testes Automatizados
```bash
python -m unittest test_app.py
```

### 5. Iniciar o Servidor Web
```bash
python app.py
```
Abra seu navegador em: **`http://localhost:5000`**

---

## 👥 Integrantes do Grupo
* Patrick Stuart (324116667)
* Arthur Fernandes (324116669)
* Kauã Henrique (326131242)
* Renzo Soares (324120646)
* Isaac Lucas (324127235)
* Juan Eremita (324120088)
* Luan Oliveira (326215050)
* Rafael Kayck (324152307)
