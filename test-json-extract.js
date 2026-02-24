const text = `
Here is your analysis:
\`\`\`json
{
  "test": 123
}
\`\`\`
`;

const match = text.match(/\{[\s\S]*\}/);
console.log(match ? JSON.parse(match[0]) : "No match");
