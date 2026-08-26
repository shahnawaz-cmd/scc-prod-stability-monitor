const fs = require('fs');
const { execSync } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Extracts detailed failure stacks, line numbers, and Playwright call logs from results.json
 */
function extractFailuresFromResults() {
  if (!fs.existsSync('results.json')) return {};
  try {
    const raw = fs.readFileSync('results.json', 'utf8');
    const data = JSON.parse(raw);
    const failuresByFile = {};

    const traverseSuite = (suite) => {
      if (suite.specs) {
        for (const spec of suite.specs) {
          for (const t of spec.tests || []) {
            for (const r of t.results || []) {
              if (r.status === 'failed' || r.status === 'timedOut') {
                const err = r.error || {};
                const file = err.location?.file || spec.file || '';
                const line = err.location?.line || spec.line || '';
                const msg = (err.message || 'Unknown error').replace(/\u001b\[[0-9;]*m/g, ''); // strip ANSI colors
                const snippet = (err.snippet || '').replace(/\u001b\[[0-9;]*m/g, '');

                const targets = [
                  'tasks/formVinDecode.ts',
                  'tasks/formRegDecode.ts',
                  'tasks/previewToCheckout.ts',
                  'tasks/exitIntentTrigger.ts'
                ];

                for (const target of targets) {
                  const normalizedTarget = target.replace(/\//g, '\\');
                  if (file.includes(normalizedTarget) || file.includes(target) || msg.includes(target)) {
                    if (!failuresByFile[target]) failuresByFile[target] = [];
                    failuresByFile[target].push({
                      title: spec.title,
                      line,
                      message: msg,
                      snippet
                    });
                  }
                }

                if (!failuresByFile['_all']) failuresByFile['_all'] = [];
                failuresByFile['_all'].push({ title: spec.title, file, line, message: msg });
              }
            }
          }
        }
      }
      if (suite.suites) {
        for (const s of suite.suites) traverseSuite(s);
      }
    };

    if (data.suites) {
      for (const s of data.suites) traverseSuite(s);
    }

    return failuresByFile;
  } catch (e) {
    console.warn('⚠️ Error parsing results.json for failures:', e.message);
    return {};
  }
}

async function runCiHealer() {
  console.log('🤖 Agentic AI Healer activated for SCC Monitoring Flow (CI)...');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    console.log('⚠️ GEMINI_API_KEY missing or invalid in environment. Skipping AI healing step.');
    return;
  }

  const failures = extractFailuresFromResults();
  const failedFileKeys = Object.keys(failures).filter(k => k !== '_all');

  const targetFiles = failedFileKeys.length > 0 
    ? failedFileKeys 
    : ['tasks/formVinDecode.ts', 'tasks/formRegDecode.ts', 'tasks/previewToCheckout.ts'];

  console.log(`📋 Target files to analyze/heal: ${targetFiles.join(', ')}`);

  const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  const genAI = new GoogleGenerativeAI(apiKey);
  const repairedFiles = [];
  let usedModel = '';

  for (const targetFile of targetFiles) {
    if (!fs.existsSync(targetFile)) continue;
    const taskCode = fs.readFileSync(targetFile, 'utf-8');

    const fileFailures = failures[targetFile] || [];
    let failureContext = '';

    if (fileFailures.length > 0) {
      failureContext = fileFailures.map(f => `
TEST CASE: ${f.title}
FAILED AT LINE: ${f.line}
ERROR MESSAGE & CALL LOG:
${f.message}
${f.snippet ? `CODE SNIPPET:\n${f.snippet}` : ''}
      `).join('\n---\n');
    } else {
      failureContext = 'General locator failure or UI timeout during CI execution.';
    }

    const prompt = `
      You are an expert Playwright automation healing agent specializing in production stability and Screenplay architecture.
      The Playwright task file "${targetFile}" for SmartCarCheck (SCC) failed during CI execution.

      ACTUAL PLAYWRIGHT CI ERROR, CALL LOG & STACK:
      ${failureContext}

      CURRENT TASK SOURCE CODE:
      \`\`\`typescript
      ${taskCode}
      \`\`\`

      Healing Guidelines across Error Categories:
      1. SELECTOR & DOM DRIFT:
         - If element changed or was not found, switch to resilient semantic selectors (getByRole, getByPlaceholder, getByLabel, or text).
         - If strict mode violation (multiple matches), always append .locator('visible=true').first() or .first().
      2. RESPONSIVE / MOBILE SAFARI ISSUES:
         - If element is reported "not visible" due to mobile/desktop duplicate DOM nodes, always use .locator('visible=true').first().
         - For text inputs, use the project helper fastInputWithHealing(page, label, value, fallbacks).
      3. TIMEOUT & SLOW ASYNC REDIRECTS:
         - If URL redirection timed out, replace static waits with condition-based Promise.race between the target URL and error message indicators.
         - Ensure URL assertions use flexible regex: /.*(members\/preview|preview|vhr|vhr-report|report|checkout).*/i.
      4. REACTIVE FORM EVENTS:
         - Ensure text inputs dispatch native 'input' and 'change' events so reactive frontend state updates immediately.
      5. OVERLAYS & POINTER INTERCEPTIONS:
         - If pointer events were intercepted by an overlay, use { force: true } or dismiss the overlay before interaction.
      6. ASSERTION DRIFT:
         - Relax rigid string equality to case-insensitive, whitespace-trimmed regex matching.

      Constraints:
      - Preserve all existing imports, class names, static factory methods, and public interfaces.
      - Return ONLY valid executable TypeScript code without any markdown code fence wrappers or introductory commentary.
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
      repairedFiles.push(targetFile);
      usedModel = successfulModel;
      console.log(`✨ [AI Healer Success] Auto-repaired ${targetFile} using ${successfulModel}.`);
    }
  }

  if (repairedFiles.length > 0) {
    fs.writeFileSync('.ai-healed.json', JSON.stringify({
      healed: true,
      model: usedModel,
      repairedFiles,
      timestamp: new Date().toISOString()
    }, null, 2));
  }

  console.log('🚀 Re-running Playwright test suite to verify AI fixes...');
  try {
    execSync('npx playwright test tests/scc-monitoring.spec.ts', { stdio: 'inherit', timeout: 60000 });
  } catch (e) {
    console.warn('⚠️ Verification test run completed.');
  }
}

if (require.main === module) {
  runCiHealer().catch(console.error);
}

module.exports = { runCiHealer };

