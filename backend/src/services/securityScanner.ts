/**
 * Automated Security & Penetration Code Scanner Service
 * Scans uploaded files, URLs, descriptions, and text submissions for:
 * 1. Blacklisted dangerous executable file extensions (.exe, .bat, .vbs, .ps1, .sh, .php, .js, .cmd, etc.)
 * 2. Cross-Site Scripting (XSS) & Script Injections (<script>, javascript:, onerror=, onload=)
 * 3. Remote Code Execution (RCE) / Shellcode (exec, system, passthru, cmd.exe, powershell, /bin/bash)
 * 4. SQL Injections & Dynamic Code Injection (DROP TABLE, UNION SELECT, <?php)
 */

export interface SecurityScanResult {
  status: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  riskScore: number; // 0 (Safe) to 100 (Critical Threat)
  threatsDetected: string[];
  scanDetails: string;
  scannedAt: string;
}

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.vbs', '.ps1', '.sh', '.php', '.phtml', '.php3', '.php4', '.php5',
  '.js', '.cmd', '.dll', '.scr', '.jar', '.msi', '.py', '.com', '.cpl', '.htaccess',
  '.vbe', '.jse', '.wsf', '.wsh', '.reg', '.inf', '.sys', '.drv'
];

const MALICIOUS_PATTERNS: Array<{ name: string; pattern: RegExp; score: number }> = [
  // XSS & Script Injection
  { name: 'XSS Script Tag Injection', pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi, score: 50 },
  { name: 'XSS JavaScript URI Protocol', pattern: /javascript\s*:/gi, score: 40 },
  { name: 'XSS Inline HTML Event Handler', pattern: /\bon(error|load|click|mouseover|submit|focus|blur|keydown)\s*=/gi, score: 45 },
  { name: 'XSS Dynamic Evaluation (eval/Function)', pattern: /\b(eval|Function)\s*\(.*?\)/gi, score: 50 },

  // Remote Code Execution & Shellcode
  { name: 'RCE Shell Command Execution', pattern: /\b(exec|passthru|shell_exec|system|popen|proc_open)\s*\(/gi, score: 60 },
  { name: 'RCE Windows CMD Command Payload', pattern: /\b(cmd\.exe|powershell\.exe|wscript\.exe|cscript\.exe)\b/gi, score: 60 },
  { name: 'RCE Linux Shell Binary Invocation', pattern: /\b(\/bin\/sh|\/bin\/bash|\/usr\/bin\/python)\b/gi, score: 50 },
  { name: 'Base64 Encoded Script Payload', pattern: /data:(text\/html|application\/javascript);base64,/gi, score: 40 },

  // Code Injections & Server Side Execution
  { name: 'PHP Execution Tag', pattern: /<\?php|<\?=/gi, score: 50 },
  { name: 'ASP / JSP Code Tag', pattern: /<%|%\>/gi, score: 40 },
  { name: 'SQL Injection Sequence', pattern: /\b(UNION\s+ALL\s+SELECT|DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO\s+.*?\s+SELECT)\b/gi, score: 50 },

  // Obfuscated / Embedded Penetration Strings
  { name: 'Embedded Obfuscated Character Code', pattern: /String\.fromCharCode\s*\(/gi, score: 35 },
  { name: 'Suspicious Dynamic Macro Keyword', pattern: /AutoOpen|Document_Open|Workbook_Open/gi, score: 30 },
];

export function scanResourcePayload(data: {
  title?: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  authorName?: string;
  authorEmail?: string;
}): SecurityScanResult {
  const threatsDetected: string[] = [];
  let riskScore = 0;

  const title = String(data.title || '');
  const description = String(data.description || '');
  const fileUrl = String(data.fileUrl || '');
  const fileType = String(data.fileType || '').toLowerCase();
  const authorName = String(data.authorName || '');
  const authorEmail = String(data.authorEmail || '');

  const fullTextContent = `${title} \n ${description} \n ${fileUrl} \n ${authorName} \n ${authorEmail}`;

  // 1. Check dangerous file extensions in URL or fileType
  const urlLower = fileUrl.toLowerCase();
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (urlLower.endsWith(ext) || fileType.includes(ext.replace('.', ''))) {
      threatsDetected.push(`Blocked dangerous executable file extension (${ext})`);
      riskScore += 80;
      break;
    }
  }

  // 2. Scan content against security pattern engine
  for (const item of MALICIOUS_PATTERNS) {
    if (item.pattern.test(fullTextContent)) {
      threatsDetected.push(`Detected pattern: ${item.name}`);
      riskScore += item.score;
    }
  }

  // 3. Determine status based on risk score
  let status: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' = 'CLEAN';
  if (riskScore >= 50) {
    status = 'MALICIOUS';
  } else if (riskScore > 0) {
    status = 'SUSPICIOUS';
  }

  const scanDetails = threatsDetected.length > 0
    ? `Threat Alert (${status}): ${threatsDetected.join('; ')}. Risk Score: ${riskScore}/100.`
    : `Security Scan Passed: No malicious code, executable payloads, or script injections detected. (Risk Score: 0/100).`;

  return {
    status,
    riskScore: Math.min(100, riskScore),
    threatsDetected,
    scanDetails,
    scannedAt: new Date().toISOString(),
  };
}
