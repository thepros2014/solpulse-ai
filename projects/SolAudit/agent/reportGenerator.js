const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '../data/audit_findings.json');
const OUTPUT_PATH = path.join(__dirname, '../reports/AUDIT_REPORT.md');

function generateReport() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error("No findings found to report on.");
    return;
  }
  
  const findings = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  
  let report = `# SolAudit Security Assessment Report\n\n`;
  report += `## Executive Summary\n`;
  report += `This report outlines the findings from the automated SolAudit security scanner on several open-source Solana repositories including \`coral-xyz/anchor\` and \`solana-labs/solana-program-library\`. A total of **${findings.length}** issues were found.\n\n`;
  
  report += `## Findings Summary\n\n`;
  report += `| ID | Severity | Title | File | Line |\n`;
  report += `|---|---|---|---|---|\n`;
  
  findings.forEach(f => {
    report += `| ${f.id} | ${f.severity} | ${f.vulnerabilityType} | \`${f.file}\` | ${f.lineRange} |\n`;
  });
  
  report += `\n## Detailed Findings\n\n`;
  
  findings.forEach(f => {
    report += `### [${f.id}] ${f.severity}: ${f.vulnerabilityType}\n\n`;
    report += `**Repository:** \`${f.repo}\`\n\n`;
    report += `**File:** \`${f.file}\` (Lines: ${f.lineRange})\n\n`;
    report += `**Description & Impact:**\n${f.impact}\n\n`;
    report += `**Vulnerable Code:**\n\`\`\`rust\n${f.vulnerableCode}\n\`\`\`\n\n`;
    report += `**Recommended Fix:**\n\`\`\`rust\n${f.recommendedFix}\n\`\`\`\n\n`;
    report += `---\n\n`;
  });
  
  report += `## Conclusion and Remediation Priority\n`;
  report += `The identified vulnerabilities pose varying levels of risk to the respective protocols. Critical and High severity issues, such as missing signer constraints and integer overflows, must be addressed immediately to prevent potential exploits. Medium severity issues should be patched in the next release cycle.\n`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, report);
  console.log(`Report generated successfully at ${OUTPUT_PATH}`);
}

generateReport();
