import os
import re

SRC_DIR = "src/features/admin"

def find_types_file(current_file):
    # Try looking for types.ts in the current dir, then parent, etc. until src/features/admin
    dir_path = os.path.dirname(current_file)
    admin_dir = os.path.abspath(SRC_DIR)
    
    while os.path.abspath(dir_path).startswith(admin_dir):
        types_path = os.path.join(dir_path, 'types.ts')
        if os.path.exists(types_path):
            rel_path = os.path.relpath(dir_path, os.path.dirname(current_file))
            if os.name == 'nt':
                rel_path = rel_path.replace('\\', '/')
            if not rel_path.startswith('.'):
                rel_path = './' + rel_path
            return f"{rel_path}/types" if rel_path != '.' else "./types"
        
        # move up
        if os.path.abspath(dir_path) == admin_dir:
            break
        dir_path = os.path.dirname(dir_path)
    
    return None

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    def repl_types(match):
        imports = match.group(1)
        rel_types = find_types_file(file_path)
        if rel_types:
            # If it's a valid types path, replace it
            return f'import {imports} from "{rel_types}";'
        return match.group(0)

    # Match any import of types inside the same tree, that is not an absolute path or external module
    content = re.sub(r'import\s+(.*?)\s+from\s+[\'"](?:\.\./)*types[\'"];', repl_types, content, flags=re.DOTALL)
    content = re.sub(r'import\s+(.*?)\s+from\s+[\'"]\./types[\'"];', repl_types, content, flags=re.DOTALL)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file_path}")

for root, _, files in os.walk(SRC_DIR):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
