const fs = require('fs');
const path = 'lib/llm.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace the simple JSON cleaning with a robust regex JSON extractor
const replacement = `
    let cleanedText = responseText.trim();
    
    // Attempt to extract JSON if it's wrapped in markdown or other text
    const jsonMatch = cleanedText.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    return JSON.parse(cleanedText);
`;

content = content.replace(/let cleanedText = responseText\.trim\(\);[\s\S]*?return JSON\.parse\(cleanedText\);/, replacement);

fs.writeFileSync(path, content);
console.log("Fixed JSON parsing in lib/llm.ts");
