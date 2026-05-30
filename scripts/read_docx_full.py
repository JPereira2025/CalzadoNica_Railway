import zipfile
import re
from pathlib import Path

path = Path(__file__).resolve().parent.parent / 'Docs' / '1- Organización y estructuración de aplicaciones Node.js con Express.docx'
if not path.exists():
    raise SystemExit(f'Missing file: {path}')
with zipfile.ZipFile(path, 'r') as z:
    xml = z.read('word/document.xml').decode('utf-8')
text = re.sub(r'<w:p[^>]*>', '\n', xml)
text = re.sub(r'<[^>]+>', '', text)
text = re.sub(r'\n{2,}', '\n', text).strip()
print(text)
