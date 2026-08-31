const axios = require('axios');
const fs = require('fs');

const {
  SLACK_WEBHOOK_URL,
  GITHUB_SERVER,
  GITHUB_REPO,
  GITHUB_RUN,
  GITHUB_ACTOR,
  GITHUB_REF,
  GITHUB_EVENT,
  REPORT_URL,
  BASE_URL,
  MATRIX_PROJECT
} = process.env;

let testSummary = '';
let passedCount = 0;
let failedCount = 0;
let flakyCount = 0;
let totalRetries = 0;
let aiHealedInfo = null;

if (fs.existsSync('.ai-healed.json')) {
  try {
    aiHealedInfo = JSON.parse(fs.readFileSync('.ai-healed.json', 'utf8'));
  } catch (e) {}
}

console.log('Current working directory:', process.cwd());
console.log('Checking for results.json...');
if (fs.existsSync('results.json')) {
  console.log('results.json found.');
} else {
  console.log('results.json NOT found.');
}

try {
  const results = JSON.parse(fs.readFileSync('results.json', 'utf8'));
  console.log('results.json parsed successfully.');
  
  const getAllSpecs = (suite) => {
    let specs = [];
    if (suite.specs) {
      specs.push(...suite.specs);
    }
    if (suite.suites) {
      for (const subSuite of suite.suites) {
        specs.push(...getAllSpecs(subSuite));
      }
    }
    return specs;
  };

  const allSpecs = [];
  if (results.suites) {
    for (const suite of results.suites) {
      allSpecs.push(...getAllSpecs(suite));
    }
  }

  const failedSpecs = [];
  const flakySpecs = [];

  allSpecs.forEach(spec => {
    if (!spec.tests || spec.tests.length === 0) return;
    
    for (const testInstance of spec.tests) {
      const attempts = testInstance.results || [];
      if (attempts.length === 0) continue;
      
      totalRetries += Math.max(0, attempts.length - 1);

      const hasFailures = attempts.some(r => r.status === 'failed' || r.status === 'timedOut');
      const hasPass = attempts.some(r => r.status === 'passed');
      const isSkipped = attempts.every(r => r.status === 'skipped');

      let isFlaky = hasFailures && hasPass;
      let finalStatus = 'unknown';
      
      if (isFlaky) {
        finalStatus = 'flaky';
      } else if (hasPass || isSkipped) {
        finalStatus = 'passed';
      } else if (hasFailures) {
        finalStatus = 'failed';
      } else {
        finalStatus = attempts[0]?.status || 'unknown';
      }

      const browser = testInstance.projectName || 'unknown';

      if (finalStatus === 'flaky') {
        flakyCount++;
        flakySpecs.push({ title: spec.title, browser });
      } else if (finalStatus === 'passed') {
        passedCount++;
      } else if (finalStatus === 'failed') {
        failedCount++;
        const lastFailure = attempts.reverse().find(r => r.status === 'failed' || r.status === 'timedOut');
        let errorMsg = 'Unknown error';
        if (lastFailure && lastFailure.error && lastFailure.error.message) {
          errorMsg = lastFailure.error.message.split('\n')[0].substring(0, 150);
        }
        failedSpecs.push({ title: spec.title, browser, error: errorMsg });
      }
    }
  });

  let summaryParts = [];
  if (failedSpecs.length > 0) {
    summaryParts.push(`*🔴 Failed Tests (${failedSpecs.length}):*\n` + failedSpecs.map(s => `• *${s.title}* (_${s.browser}_)\n    > ❌ \`${s.error}\``).join('\n'));
  }
  if (flakySpecs.length > 0) {
    summaryParts.push(`*🟡 Flaky Tests (Passed on Retry) (${flakySpecs.length}):*\n` + flakySpecs.map(s => `• *${s.title}* (_${s.browser}_)`).join('\n'));
  }
  summaryParts.push(`*🟢 Passed Tests:* \`${passedCount}\` specs completed successfully.`);
  
  if (aiHealedInfo && aiHealedInfo.healed) {
    summaryParts.push(`*🤖 AI Agentic Self-Healer Status:* ✨ *Auto-Repaired via Gemini AI (${aiHealedInfo.model})*\n• *Files Auto-Healed:* \`${aiHealedInfo.repairedFiles.join('`, `')}\``);
  }

  testSummary = summaryParts.join('\n\n');
  console.log('Grouped test summary generated:', testSummary);
} catch (e) {
  console.error('Error parsing results.json:', e);
  testSummary = 'Could not parse test results.';
}

const site = 'SmartCarCheck';
const env = 'Prod';

const runUrl = `${GITHUB_SERVER}/${GITHUB_REPO}/actions/runs/${GITHUB_RUN}`;
const owner = GITHUB_REPO ? GITHUB_REPO.split('/')[0] : '';
const repoName = GITHUB_REPO ? GITHUB_REPO.split('/')[1] : '';

const allureUrl = (owner && repoName) ? `https://${owner}.github.io/${repoName}/` : '';
const playwrightUrl = (owner && repoName) ? `https://${owner}.github.io/${repoName}/playwright/` : '';

const isSuccess = failedCount === 0 && (passedCount > 0 || flakyCount > 0);
const statusEmoji = isSuccess ? '✅' : '❌';
const statusText = isSuccess ? (aiHealedInfo?.healed ? 'Passed (AI Auto-Healed 🤖)' : 'Passed') : 'Failed';
const mentions = !isSuccess ? ' CC: <@U03UR6FFQKB> <@U09UE83AWGP>' : '';
const barColor = isSuccess ? '#2EB67D' : '#E01E5A';

const payload = {
  text: `${statusEmoji} SCC Monitoring Flow (Cross Browser Testflow)${mentions}`,
  attachments: [
    {
      color: barColor,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${statusEmoji} SCC Monitoring Flow`,
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Status:* ${statusEmoji} *${statusText}*${mentions}\n*Total Tests:* \`${passedCount + failedCount + flakyCount}\` | *Passed:* \`${passedCount}\` | *Failed:* \`${failedCount}\` | *Flaky:* \`${flakyCount}\` | *Retries:* \`${totalRetries}\``
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Environment:* \`${env}\` (${site})\n` +
                  `*Base URL:* <${BASE_URL}|${BASE_URL || 'N/A'}>\n` +
                  `*Workflow Run:* <${runUrl}|View Workflow Run 🛠️>\n` +
                  (allureUrl ? `*Allure Analytics:* <${allureUrl}|View Allure Visual Dashboard 📊>\n` : '') +
                  (playwrightUrl ? `*Playwright Report:* <${playwrightUrl}|View Playwright HTML Report 🎭>\n` : '') +
                  `*Trigger Details:* \`${GITHUB_ACTOR || 'N/A'}\` via \`${GITHUB_EVENT || 'N/A'}\` (\`${GITHUB_REF || 'N/A'}\`)`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Test Summary:*\n${testSummary}`
          }
        }
      ]
    }
  ]
};

console.log('Slack Payload:', JSON.stringify(payload, null, 2));

if (SLACK_WEBHOOK_URL) {
  axios.post(SLACK_WEBHOOK_URL, payload, { timeout: 10000 })
    .then(() => {
      console.log('Slack main channel notification sent successfully.');
    })
    .catch(err => console.error('Error sending Slack notification:', err.message));
} else {
  console.log('SLACK_WEBHOOK_URL not set, skipping notification.');
}
