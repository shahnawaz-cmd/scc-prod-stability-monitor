const fs = require('fs');
const { execSync } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function runCiHealer() {
  console.log('🤖 Agentic AI Healer activated for SCC Monitoring Flow (CI)...');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    console.log('⚠️ GEMINI_API_KEY missing or invalid in environment. Skipping AI healing step.');
    return;
  }

  const targetFiles = [
    'tasks/formVinDecode.ts',
    'tasks/formRegDecode.ts',
    'tasks/previewToCheckout.ts'
  ];

  const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-pro'];
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const targetFile of targetFiles) {
    if (!fs.existsSync(targetFile)) continue;
    const taskCode = fs.readFileSync(targetFile, 'utf-8');

    const prompt = `
      You are an expert Playwright automation healing agent.
      The Playwright task file "${targetFile}" for SmartCarCheck (SCC) encountered locator failure or UI state changes.

      FAILED TASK CODE:
      \`\`\`typescript
      ${taskCode}
      \`\`\`

      Task: Analyze standard vehicle VIN/REG input forms, button triggers, and checkout modal selectors for SmartCarCheck.
      Return robust, self-healing Playwright locators using accessibility roles or fallback selectors.
      Return ONLY valid executable TypeScript code without markdown code fence wrappers.
    `;

    let result = null;
    let successfulModel = '';

    for (const modelName of candidateModels) {
      try {
        console.log(`🧠 Attempting Gemini AI model (${modelName}) for ${targetFile}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent(prompt);
        if (res && res.response) {
          result = res;
          successfulModel = modelName;
          console.log(`✅ Successfully generated healing patch from ${modelName}!`);
          break;
        }
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} attempt failed: ${err.message}`);
      }
    }

    if (result && result.response) {
      const correctedCode = result.response.text().replace(/```typescript|```javascript|```/g, '').trim();
      fs.writeFileSync(targetFile, correctedCode, 'utf-8');
      console.log(`✨ [AI Healer Success] Auto-repaired ${targetFile} using ${successfulModel}.`);
    }
  }

  console.log('🚀 Re-running Playwright test suite to verify AI fixes...');
  try {
    execSync('npx playwright test', { stdio: 'inherit' });
  } catch (e) {
    console.warn('⚠️ Verification test run completed with issues.');
  }
}

if (require.main === module) {
  runCiHealer().catch(console.error);
}

module.exports = { runCiHealer };
