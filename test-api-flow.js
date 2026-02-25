const http = require('http');

const data = JSON.stringify({
  name: "测试用户",
  gender: "male",
  birthDate: "1992-08-08",
  birthTime: "10:30",
  birthPlace: "上海市",
  timezone: 8
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log(`Success: ${parsed.success}`);
      console.log(`Report ID: ${parsed.reportId}`);
      if (parsed.success) {
         console.log("Analysis flow works! The API successfully parsed LLM JSON.");
      } else {
         console.error("API error:", parsed.error);
      }
    } catch(e) {
      console.error("Failed to parse response body:", body);
    }
  });
});

req.on('error', (error) => {
  console.error("Request failed:", error);
});

req.write(data);
req.end();
