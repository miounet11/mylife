import { generateFortuneInterpretation } from './lib/llm';

async function test() {
  console.log("Testing real LLM generation...");
  
  const sampleBazi = {
    "dayMaster": "戊",
    "pillars": [
      {
        "celestialStem": "庚",
        "earthlyBranch": "午"
      }
    ]
  };

  const result = await generateFortuneInterpretation(sampleBazi);
  console.log("Result:");
  console.log(JSON.stringify(result, null, 2));
}

test();
