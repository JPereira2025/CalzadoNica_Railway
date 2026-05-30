import re
from pathlib import Path

root = Path(r'c:\xampp\htdocs\CalzadoNica')
index_path = root / 'index.html'
text = index_path.read_text(encoding='utf-8')

# Find page section markers
pattern = re.compile(r'<div id="([a-z0-9-]+)-page" class="page(?:\s|\")')
starts = []
for m in pattern.finditer(text):
    starts.append((m.start(), m.group(1)))

if not starts:
    raise SystemExit('No page sections found')

# We will parse matching divs with a stack from each start.
sections = []
for start, name in starts:
    i = start
    stack = []
    while i < len(text):
        if text.startswith('<div', i):
            stack.append('div')
            i += 4
        elif text.startswith('</div>', i):
            if not stack:
                raise SystemExit(f'unexpected closing div at {i}')
            stack.pop()
            i += 6
            if not stack:
                end = i
                section = text[start:end]
                sections.append((name, start, end, section))
                break
        else:
            i += 1
    else:
        raise SystemExit(f'Unclosed div for page {name}')

# Ensure sections are in order and non-overlapping
sections.sort(key=lambda x: x[1])
for i in range(len(sections)-1):
    if sections[i][2] > sections[i+1][1]:
        raise SystemExit('Overlapping sections detected')

pages_dir = root / 'pages'
pages_dir.mkdir(exist_ok=True)

new_text = []
pos = 0
for name, start, end, section in sections:
    new_text.append(text[pos:start])
    new_text.append(f'<!-- PAGE: {name} -->\n')
    pos = end
    out_path = pages_dir / f'{name}.html'
    out_path.write_text(section + '\n', encoding='utf-8')
    print(f'written {out_path}')
new_text.append(text[pos:])

index_new = ''.join(new_text)
index_new = index_new.replace('<!-- PAGE: dashboard -->', '<div id="page-content">\n    <div id="loading-page" class="text-center py-20 text-gray-500">Cargando módulo...</div>\n</div>')
# Remove remaining page placeholders if any
index_new = index_new.replace('<!-- PAGE: empleados -->', '')
index_new = index_new.replace('<!-- PAGE: categorias -->', '')
index_new = index_new.replace('<!-- PAGE: estilos -->', '')
index_new = index_new.replace('<!-- PAGE: productos -->', '')
index_new = index_new.replace('<!-- PAGE: codigos -->', '')
index_new = index_new.replace('<!-- PAGE: usuarios -->', '')
index_new = index_new.replace('<!-- PAGE: facturacion -->', '')

index_path.write_text(index_new, encoding='utf-8')
print('index.html updated')
