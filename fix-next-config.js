const fs = require('fs');
const path = 'next.config.js';
let content = fs.readFileSync(path, 'utf8');

// Ensure images domains are included as per the refactoring plan
if (!content.includes('images:')) {
  content = content.replace(
    /experimental: {/,
    `images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'life-kline.com',
      }
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {`
  );
  fs.writeFileSync(path, content);
  console.log("Updated next.config.js with images config");
}
