import zipfile
import sys
import os
import xml.etree.ElementTree as ET

def extract_text(docx_path):
    with zipfile.ZipFile(docx_path) as z:
        if 'word/document.xml' not in z.namelist():
            return ''
        xml = z.read('word/document.xml')
        root = ET.fromstring(xml)
        texts = []
        for node in root.iter():
            if node.tag.endswith('}t'):
                texts.append(node.text)
        return ''.join(t for t in texts if t)

if __name__ == '__main__':
    docs_dir = os.path.join(os.getcwd(), 'Docs')
    if not os.path.isdir(docs_dir):
        print('NO_DOCS_DIR')
        sys.exit(1)
    for fname in os.listdir(docs_dir):
        if fname.lower().endswith('.docx'):
            path = os.path.join(docs_dir, fname)
            text = extract_text(path)
            print('---FILE---', fname)
            print(text[:2000])
            print('\n\n')
