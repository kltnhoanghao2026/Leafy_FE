import os

SRC_DIR = "src/features/admin"

def update_index_ts():
    for root, dirs, files in os.walk(SRC_DIR):
        # We only want to look at directories that are direct children of src/features/admin
        # Or just any directory that has index.ts and .api.ts or .queries.ts
        if 'index.ts' in files:
            index_path = os.path.join(root, 'index.ts')
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find all .api.ts and .queries.ts in the SAME directory
            exports = []
            for file in files:
                if file.endswith('.api.ts') or file.endswith('.queries.ts'):
                    export_stmt = f"export * from './{file[:-3]}';\n"
                    if export_stmt not in content:
                        exports.append(export_stmt)
            
            if exports:
                with open(index_path, 'a', encoding='utf-8') as f:
                    for ext in exports:
                        f.write(ext)
                print(f"Updated {index_path}")

update_index_ts()
