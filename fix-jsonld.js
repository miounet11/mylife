const fs = require('fs');
const path = 'app/result/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// we will inject JSON-LD right inside the return of the component
// first, let's find the main return (
const returnIndex = content.indexOf('return (');
if (returnIndex !== -1) {
  const jsonLdCode = `
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: \`\${result.basic.name || '测算者'}的命理分析报告\`,
    description: \`AI驱动的八字命理分析，像真正的大师一样精准可信。此为\${result.basic.name || '测算者'}的专属报告。\`,
    author: {
      '@type': 'Organization',
      name: '人生K线',
      url: 'https://life-kline.com'
    }
  };
  `;

  // Insert before return
  content = content.substring(0, returnIndex) + jsonLdCode + content.substring(returnIndex);
  
  // Now inject the script tag inside the top div
  const topDivIndex = content.indexOf('<div className="min-h-screen bg-gradient-to-b from-white to-purple-50">');
  if (topDivIndex !== -1) {
    const scriptTag = `
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />`;
    
    // We add it right after the div opening
    const insertPos = topDivIndex + '<div className="min-h-screen bg-gradient-to-b from-white to-purple-50">'.length;
    content = content.substring(0, insertPos) + scriptTag + content.substring(insertPos);
    
    fs.writeFileSync(path, content);
    console.log("Injected JSON-LD into app/result/[id]/page.tsx");
  } else {
    console.log("Could not find top div to inject JSON-LD");
  }
} else {
  console.log("Could not find return to inject JSON-LD");
}
