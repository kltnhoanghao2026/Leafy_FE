const fs = require('fs');
const path = require('path');

function fixDefaultToNamedExports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('export default function')) {
        content = content.replace(/export default function/g, 'export function');
        fs.writeFileSync(filePath, content);
        console.log('Fixed export in', filePath);
    }
}

fixDefaultToNamedExports('src/features/admin/seeding/pages/DataSeedingPage.tsx');
fixDefaultToNamedExports('src/features/admin/sync/pages/DataSyncPage.tsx');

// Clean up weird imports in certificates page
const certPage = 'src/features/admin/certificates/pages/CertificateApprovalPage.tsx';
let certContent = fs.readFileSync(certPage, 'utf8');
certContent = certContent.replace(/from '\.\.\/api\/'/g, "from '../api/certificates.api'");
certContent = certContent.replace(/from '\.\/ApprovalCard'/g, "from '../components/ApprovalCard'");
certContent = certContent.replace(/from '\.\/SkeletonCard'/g, "from '../components/SkeletonCard'");
certContent = certContent.replace(/from '\.\/CertificateItem'/g, "from '../components/CertificateItem'");
certContent = certContent.replace(/from '\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/'/g, "from '../../../types'"); // Assuming it was importing types from admin root
fs.writeFileSync(certPage, certContent);

// Fix types imports
function fixTypesImports(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixTypesImports(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            if (content.includes('from "../types"')) {
                content = content.replace(/from "\.\.\/types"/g, 'from "../../types"');
                changed = true;
            }
            if (content.includes("from '../types'")) {
                content = content.replace(/from '\.\.\/types'/g, "from '../../types'");
                changed = true;
            }
            if (content.includes('from "../../../shared/types/api"')) {
                content = content.replace(/from "\.\.\/\.\.\/\.\.\/shared/g, 'from "../../../../shared');
                content = content.replace(/from '\.\.\/\.\.\/\.\.\/shared/g, "from '../../../../shared");
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed types in', fullPath);
            }
        }
    }
}
fixTypesImports('src/features/admin');

