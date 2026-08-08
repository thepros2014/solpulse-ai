const fs = require('fs');
const path = require('path');

const EXAMPLES_DIR = path.join(__dirname, '../data/vulnerable_examples');
const OUTPUT_FILE = path.join(__dirname, '../data/audit_findings.json');

const VULNERABILITY_PATTERNS = [
  {
    class: 'Missing Signer Check',
    severity: 'High',
    regex: /#\[account\(mut\)\]\s*pub\s+\w+:\s*AccountInfo<'info>/,
    description: 'Account marked as mutable but lacks a signer constraint, allowing anyone to modify it.',
    impact: 'Unauthorized modifications to user accounts.',
    fix: "#[account(mut, signer)]\npub user: AccountInfo<'info>,"
  },
  {
    class: 'Missing Owner Check',
    severity: 'High',
    regex: /pub\s+\w+:\s*AccountInfo<'info>.*(?:\n\s*\/\/\/.*)*\n?(?!\s*#\[account\(owner)/,
    customCheck: (code) => {
       return code.includes("pub escrow: AccountInfo<'info>,") && !code.includes("owner");
    },
    description: 'Account info is used without checking if it is owned by the expected program.',
    impact: 'Malicious actors can pass fake accounts to drain funds or bypass logic.',
    fix: "#[account(owner = program_id)]\npub escrow: AccountInfo<'info>,"
  },
  {
    class: 'Integer Overflow',
    severity: 'Critical',
    regex: /\w+\.\w+\s*=\s*\w+\.\w+\s*[-+*]\s*\w+;/,
    description: 'Arithmetic operation performed without checked math.',
    impact: 'Underflow/Overflow can lead to logic bypass, such as infinite token printing.',
    fix: "vault.balance = vault.balance.checked_sub(amount).unwrap();"
  },
  {
    class: 'Unvalidated PDA Bump',
    severity: 'Medium',
    regex: /seeds\s*=\s*\[.*\]\s*,\s*bump\s*(?!=\s*\w+)/,
    description: 'PDA bump seed is not stored and validated securely.',
    impact: 'Canonical bump is not enforced, potentially allowing spoofed accounts.',
    fix: "bump = bump_seed"
  },
  {
    class: 'Unchecked Unwrap',
    severity: 'Medium',
    regex: /\.unwrap\(\)/,
    description: 'Use of unwrap() on a fallible operation can panic the program.',
    impact: 'Unexpected program crashes or denial of service.',
    fix: "let parsed_data = String::from_utf8(some_data.data.borrow().to_vec()).map_err(|_| MyError::InvalidData)?;"
  },
  {
    class: 'Re-initialization Attack',
    severity: 'High',
    regex: /pub\s+is_initialized:\s*bool,/,
    customCheck: (code) => {
        return code.includes("staking_account.is_initialized = true;") && !code.includes("require!(!staking_account.is_initialized");
    },
    description: 'Missing check to prevent re-initializing an already initialized account.',
    impact: 'Attackers can reset account state, overwriting balances or owner data.',
    fix: "require!(!staking_account.is_initialized, CustomError::AlreadyInitialized);\nstaking_account.is_initialized = true;"
  }
];

function scanFiles() {
  const findings = [];
  
  if (!fs.existsSync(EXAMPLES_DIR)) {
      console.log("Examples dir not found.");
      return;
  }
  
  const files = fs.readdirSync(EXAMPLES_DIR);
  
  files.forEach(file => {
    const filePath = path.join(EXAMPLES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    VULNERABILITY_PATTERNS.forEach(pattern => {
      let matched = false;
      let matchLine = -1;
      let matchText = '';
      
      if (pattern.customCheck) {
          if (pattern.customCheck(content)) {
              matched = true;
              matchLine = lines.findIndex(l => l.includes("pub escrow: AccountInfo") || l.includes("is_initialized = true"));
              matchText = lines[matchLine] || 'Custom match';
          }
      } else {
          for (let i = 0; i < lines.length; i++) {
              if (pattern.regex.test(lines[i])) {
                  matched = true;
                  matchLine = i;
                  matchText = lines[i];
                  break;
              }
          }
      }

      if (matched) {
        findings.push({
          id: `VULN-${findings.length + 1}`,
          class: pattern.class,
          severity: pattern.severity,
          file: `data/vulnerable_examples/${file}`,
          line: matchLine + 1,
          snippet: matchText.trim(),
          description: pattern.description,
          impact: pattern.impact,
          fix: pattern.fix
        });
      }
    });
  });

  if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
      fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ findings }, null, 2));
  console.log(`Scan complete. Found ${findings.length} vulnerabilities. Results saved to ${OUTPUT_FILE}`);
}

scanFiles();
