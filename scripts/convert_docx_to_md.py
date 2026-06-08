import zipfile
import os
import xml.etree.ElementTree as ET

DOCS_DIR = os.path.join(os.getcwd(), 'Docs')
OUT_DIR = os.path.join(DOCS_DIR, 'converted')

os.makedirs(OUT_DIR, exist_ok=True)

def extract_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            if 'word/document.xml' not in z.namelist():
                return ''
            xml = z.read('word/document.xml')
            root = ET.fromstring(xml)
            paragraphs = []
            # iterate over paragraph nodes
            for p in root.iter():
                if p.tag.endswith('}p'):
                    texts = []
                    for node in p.iter():
                        if node.tag.endswith('}t') and node.text:
                            texts.append(node.text)
                    if texts:
                        paragraphs.append(''.join(texts))
            return '\n\n'.join(paragraphs)
    except zipfile.BadZipFile:
        return None
    except Exception as e:
        return None

for fname in os.listdir(DOCS_DIR):
    if not fname.lower().endswith('.docx'):
        continue
    if fname.startswith('~$'):
        # temp file, skip
        continue
    path = os.path.join(DOCS_DIR, fname)
    outname = os.path.splitext(fname)[0] + '.md'
    outpath = os.path.join(OUT_DIR, outname)
    text = extract_text(path)
    if text is None:
        print(f'SKIP {fname} (not a valid docx or error)')
        continue
    if not text.strip():
        print(f'EMPTY {fname} (no extracted text)')
    header = f'# {fname}\n\n'
    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(header)
        f.write(text)
    print(f'WROTE {outpath}')
