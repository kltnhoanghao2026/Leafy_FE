import os
import re

SRC_DIR = "src"

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    def repl_api(match):
        feature_dir = os.path.dirname(os.path.dirname(file_path))
        
        # Check if feature_dir/api exists
        if os.path.isdir(os.path.join(feature_dir, 'api')):
            api_dir = os.path.join(feature_dir, 'api')
            index_file = os.path.join(api_dir, 'index.ts')
            if not os.path.exists(index_file):
                with open(index_file, 'w', encoding='utf-8') as idx:
                    for f in os.listdir(api_dir):
                        if f.endswith('.ts') and f != 'index.ts':
                            idx.write(f"export * from './{f[:-3]}';\n")
            return match.group(0) # Keep "../api/"
        else:
            index_file = os.path.join(feature_dir, 'index.ts')
            if not os.path.exists(index_file):
                with open(index_file, 'w', encoding='utf-8') as idx:
                    for f in os.listdir(feature_dir):
                        if f.endswith('.api.ts') or f.endswith('.queries.ts'):
                            idx.write(f"export * from './{f[:-3]}';\n")
            return match.group(0).replace('"../api/"', '"../"')

    # DOTALL allows .*? to match across newlines
    content = re.sub(r'import\s+(.*?)\s+from\s+"../api/";', repl_api, content, flags=re.DOTALL)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file_path}")

for root, _, files in os.walk(SRC_DIR):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
