const fs = require("fs");
const path = require("path");
const { routeLineEvent } = require("./controller");

async function main() {
  const sampleName = process.argv[2] || "sample-webhook-direct.json";
  const samplePath = path.join(__dirname, "data", sampleName);

  if (!fs.existsSync(samplePath)) {
    console.error(`sample file not found: ${samplePath}`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(samplePath, "utf8"));
  const events = Array.isArray(payload.events) ? payload.events : [];

  const results = [];
  for (const event of events) {
    const result = await routeLineEvent(event, {
      generateClaudeReply: async ({ channel, trigger }) =>
        `[mock ${channel} reply${trigger ? `:${trigger}` : ""}]`
    });
    results.push(result);
  }

  console.log(JSON.stringify({ sample: sampleName, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
