import zipfile
import xml.etree.ElementTree as ET
import os

def get_docx_text(path):
    try:
        with zipfile.ZipFile(path) as docx:
            if 'word/document.xml' not in docx.namelist():
                return f"Error: 'word/document.xml' not found in {path}"
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            # Find all text nodes, joining them with spaces or newlines as appropriate
            # w:t contains the text, w:p is a paragraph
            paragraphs = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [t.text for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text]
                if texts:
                    paragraphs.append(''.join(texts))
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {path}: {str(e)}"

rules_dir = r"d:\Projects\SafeGuard AI\rules"
files_to_read = ["SafeGuard_AI_PDR.docx", "SafeGuard_AI_Prompt_Strategy_TechStack.docx"]

for file in files_to_read:
    full_path = os.path.join(rules_dir, file)
    text = get_docx_text(full_path)
    out_path = os.path.join(rules_dir, file.replace('.docx', '.txt'))
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Extracted {file} to {out_path}")
