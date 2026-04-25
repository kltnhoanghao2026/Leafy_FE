const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // Fix imports in pages
            if (fullPath.includes(path.join('features', 'admin')) && fullPath.includes('pages')) {
                const queriesRegex = /from\s+["']\.\/([^"']+\.queries)["']/g;
                if (queriesRegex.test(content)) {
                    content = content.replace(queriesRegex, 'from "../api/"');
                    changed = true;
                }
                const apiRegex = /from\s+["']\.\/([^"']+\.api)["']/g;
                if (apiRegex.test(content)) {
                    content = content.replace(apiRegex, 'from "../api/"');
                    changed = true;
                }
                const keysRegex = /from\s+["']\.\/([^"']+Keys)["']/g;
                if (keysRegex.test(content)) {
                    content = content.replace(keysRegex, 'from "../api/"');
                    changed = true;
                }
                const hooksRegex = /from\s+["']\.\/(use[^"']+)["']/g;
                if (hooksRegex.test(content)) {
                    content = content.replace(hooksRegex, 'from "../hooks/"');
                    changed = true;
                }
            }
            
            // Fix imports in hooks
            if (fullPath.includes(path.join('features', 'admin')) && fullPath.includes('hooks')) {
                const apiRegex = /from\s+["']\.\/([^"']+\.api)["']/g;
                if (apiRegex.test(content)) {
                    content = content.replace(apiRegex, 'from "../api/"');
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed imports in', fullPath);
            }
        }
    }
}

replaceInDir(path.join(__dirname, 'src', 'features', 'admin'));
