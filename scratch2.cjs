const fs = require('fs');
const path = require('path');

function fixImportsInPages(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixImportsInPages(fullPath);
        } else if ((fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) && fullPath.includes('pages')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // Anything starting with '../../../' becomes '../../../../'
            const regex3 = /from\s+["']\.\.\/\.\.\/\.\.\/([^"']+)["']/g;
            if (regex3.test(content)) {
                content = content.replace(regex3, 'from "../../../../"');
                changed = true;
            }

            // Anything starting with '../../' becomes '../../../'
            // We must be careful not to match things we JUST replaced with '../../../../'
            // So we'll use a replacer function
            
            // Actually, let's do a uniform pass:
            let lines = content.split('\n');
            let newLines = lines.map(line => {
                if (line.includes('from "') || line.includes("from '")) {
                    // Match paths starting with '../'
                    // but skip '../api', '../hooks'
                    const match = line.match(/from\s+["'](\.\.\/[^"']+)["']/);
                    if (match) {
                        const importPath = match[1];
                        if (!importPath.startsWith('../api') && !importPath.startsWith('../hooks')) {
                            return line.replace(importPath, '../' + importPath);
                        }
                    }
                }
                return line;
            });
            
            content = newLines.join('\n');
            if (content !== fs.readFileSync(fullPath, 'utf8')) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed path imports in', fullPath);
            }
        }
    }
}

fixImportsInPages(path.join(__dirname, 'src', 'features', 'admin'));
fixImportsInPages(path.join(__dirname, 'src', 'features', 'disease-detection'));
fixImportsInPages(path.join(__dirname, 'src', 'features', 'rag-chat'));

