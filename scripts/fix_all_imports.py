import os
import re

SRC_DIR = "src/features"

def get_correct_rel_path(from_file, to_dir):
    # from_file: e.g. src/features/admin/users/api/users.api.ts
    # to_dir: e.g. src/lib
    from_dir = os.path.dirname(from_file)
    rel_path = os.path.relpath(to_dir, from_dir)
    if os.name == 'nt':
        rel_path = rel_path.replace('\\', '/')
    if not rel_path.startswith('.'):
        rel_path = './' + rel_path
    return rel_path

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    def repl_lib(match):
        imports = match.group(1)
        module_name = match.group(2) # e.g. apiClient, routes
        rel = get_correct_rel_path(file_path, "src/lib")
        return f'import {imports} from "{rel}/{module_name}";'

    # Match import ... from "...lib/apiClient"
    content = re.sub(r'import\s+(.*?)\s+from\s+[\'"](?:\.\./)+lib/([^\'"]+)[\'"];', repl_lib, content, flags=re.DOTALL)

    def repl_shared(match):
        imports = match.group(1)
        module_name = match.group(2)
        rel = get_correct_rel_path(file_path, "src/shared")
        return f'import {imports} from "{rel}/{module_name}";'

    # Match import ... from "...shared/..."
    content = re.sub(r'import\s+(.*?)\s+from\s+[\'"](?:\.\./)+shared/([^\'"]+)[\'"];', repl_shared, content, flags=re.DOTALL)

    def repl_types(match):
        imports = match.group(1)
        # It's importing from 'types' which is in the feature root
        # Find feature root: it's either src/features/admin/something or src/features/something
        parts = file_path.replace('\\', '/').split('/')
        feature_name = parts[3] if parts[2] == 'admin' else parts[2]
        if parts[2] == 'admin':
            feature_root = f"src/features/admin/{feature_name}"
        else:
            feature_root = f"src/features/{feature_name}"
            
        rel = get_correct_rel_path(file_path, feature_root)
        return f'import {imports} from "{rel}/types";'

    # Match import ... from "...types" ONLY IF it's not shared/types
    content = re.sub(r'import\s+(.*?)\s+from\s+[\'"](?:\.\./)*types[\'"];', repl_types, content, flags=re.DOTALL)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file_path}")

for root, _, files in os.walk(SRC_DIR):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
