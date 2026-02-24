const fs = require('fs');
const path = 'app/result/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The dynamic import for TrustReport was wrongly pointing to trust-signals!
content = content.replace(
  /const TrustReport = NextDynamic\(\(\) => import\('@\/components\/trust-signals'\)/,
  "const TrustReport = NextDynamic(() => import('@/components/trust-report')"
);

fs.writeFileSync(path, content);
console.log("Fixed TrustReport import in app/result/[id]/page.tsx");
