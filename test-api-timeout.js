// 测试 API 超时处理
const testData = {
  name: '测试用户',
  birthDate: '2000-01-01',
  birthTime: '12:00',
  birthPlace: '北京',
  gender: 'male'
};

console.log('Testing API timeout handling...');
console.log('Request data:', testData);

const startTime = Date.now();

fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData),
})
  .then(async (response) => {
    const duration = Date.now() - startTime;
    console.log(`\nResponse received in ${duration}ms`);
    console.log('Status:', response.status);

    const data = await response.json();
    console.log('\nResponse data:');
    console.log('- Success:', data.success);
    console.log('- Has result:', !!data.result);
    console.log('- LLM used:', data.result?.llmUsed);
    console.log('- Fortune ID:', data.result?.fortuneId);

    if (duration > 30000) {
      console.log('\n⚠️  WARNING: Request took longer than 30 seconds!');
    } else {
      console.log('\n✓ Request completed within timeout');
    }
  })
  .catch((error) => {
    const duration = Date.now() - startTime;
    console.error(`\n✗ Request failed after ${duration}ms:`, error.message);
  });
