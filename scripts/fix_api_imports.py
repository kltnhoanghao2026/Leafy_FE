import os
import re

SRC_DIR = "src/features/admin"

def fix_feature_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # These files were moved up one directory level.
    # So all relative imports that go up must have one `../` removed.
    
    # Fix import "../../../../shared/..." to "../../../shared/..."
    content = re.sub(r'(\"|\')\.\./\.\./\.\./\.\./shared', r'\1../../../shared', content)
    
    # Fix import "../../../lib/..." to "../../lib/..."
    content = re.sub(r'(\"|\')\.\./\.\./\.\./lib', r'\1../../lib', content)
    
    # Fix import "../../types" to "../types"
    content = re.sub(r'(\"|\')\.\./\.\./types', r'\1../types', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed relative paths in {file_path}")

for root, _, files in os.walk(SRC_DIR):
    for file in files:
        if file.endswith('.api.ts') or file.endswith('.queries.ts') or file.endswith('Keys.ts'):
            # Only fix files that are directly in the feature dir (not in an 'api' subfolder)
            # wait, if they are in 'api' subfolder, they didn't move!
            # Let's check the path:
            rel_path = os.path.relpath(os.path.join(root, file), SRC_DIR)
            parts = rel_path.replace('\\', '/').split('/')
            # If parts is like ['profiles', 'profiles.api.ts'] (length 2), it means they moved up.
            if len(parts) == 2:
                fix_feature_file(os.path.join(root, file))

