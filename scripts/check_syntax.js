const fs = require('fs');
const path = require('path');
const vm = require('vm');

let errors = [];

function walk(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const d of entries) {
		const p = path.join(dir, d.name);
		if (d.isDirectory()) {
			if (['node_modules', '.git'].includes(d.name)) continue;
			walk(p);
		} else if (p.endsWith('.js')) {
			try {
				const src = fs.readFileSync(p, 'utf8');
				new vm.Script(src, { filename: p });
			} catch (e) {
				errors.push({ file: p, error: e.message });
			}
		}
	}
}

walk(process.cwd());

if (errors.length) {
	console.error('SYNTAX_ERRORS', JSON.stringify(errors, null, 2));
	process.exit(2);
} else {
	console.log('NO_SYNTAX_ERRORS');
}