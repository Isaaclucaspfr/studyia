import os
from pypdf import PdfReader

ALLOWED_EXTENSIONS = {'pdf', 'txt', 'md'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path):
    """
    Extrai texto legível de arquivos PDF, TXT ou MD.
    Retorna (texto_extraido, erro)
    """
    if not os.path.exists(file_path):
        return None, "Arquivo não encontrado."

    ext = file_path.rsplit('.', 1)[1].lower() if '.' in file_path else ''

    try:
        if ext == 'pdf':
            reader = PdfReader(file_path)
            text_parts = []
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_parts.append(f"--- Página {idx + 1} ---\n{page_text}")
            
            full_text = "\n\n".join(text_parts).strip()
            if not full_text:
                return None, "O arquivo PDF não contém texto legível (pode ser um documento digitalizado por imagem)."
            return full_text, None

        elif ext in ('txt', 'md'):
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read().strip()
                if not content:
                    return None, "O arquivo de texto enviado está vazio."
                return content, None

        else:
            return None, f"Formato de arquivo '.{ext}' não suportado. Formatos aceitos: PDF, TXT, MD."

    except Exception as e:
        return None, f"Erro ao processar o arquivo: {str(e)}"
