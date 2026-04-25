import os
import re

def fix_cert_components():
    comp_dir = "src/features/admin/certificates/components"
    for file in os.listdir(comp_dir):
        if file.endswith('.tsx'):
            path = os.path.join(comp_dir, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = content.replace("'./certificates.queries'", "'../certificates.queries'")
            content = content.replace('"./certificates.queries"', '"../certificates.queries"')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

def fix_cert_pages():
    page_path = "src/features/admin/certificates/pages/CertificateApprovalPage.tsx"
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("'./ApprovalCard'", "'../components/ApprovalCard'")
    content = content.replace('"./ApprovalCard"', '"../components/ApprovalCard"')
    content = content.replace("'./SkeletonCard'", "'../components/SkeletonCard'")
    content = content.replace('"./SkeletonCard"', '"../components/SkeletonCard"')
    content = content.replace("'./CertificateItem'", "'../components/CertificateItem'")
    content = content.replace('"./CertificateItem"', '"../components/CertificateItem"')
    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_cert_components()
fix_cert_pages()
