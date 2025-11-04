export interface FilterConfig {
  enableResponseTruncation: boolean;
  enableStackCompression: boolean;
  enableSessionCompression: boolean;
  enableHTTPGrouping: boolean;
  enableContextAwareFiltering: boolean;
}

let config: FilterConfig = {
  enableResponseTruncation: true,
  enableStackCompression: true,
  enableSessionCompression: true,
  enableHTTPGrouping: true,
  enableContextAwareFiltering: true,
};

export function setFilterConfig(newConfig: FilterConfig) {
  config = newConfig;
}

function isAppiumLog(line: string): boolean {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{3} - \[/.test(line);
}

function cleanLogLine(line: string): string {
  return line
    .replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{3}/g, 'TIMESTAMP')
    .replace(/\b0x[0-9a-fA-F]{10,}/g, '0xHEX')
    .replace(/@[a-f0-9]{4,}\b(?!\s*\([^)]*\))/gi, '@OBJ')
    .replace(/\b\d+ms\b/g, 'Xms')
    .replace(/\b\d+\.\d+ms\b/g, 'X.Xms')
    .replace(/http:\/\/[^\s]+/gi, 'http://HOST')
    .replace(/:\d{4,5}(?=\s|$)/g, ':PORT')
    .replace(/(\/[^\s'"]+\/)[^\s'"]+(\/[^'"\s]+)/g, (match, p1, p2) => {
      if (match.length > 60) {
        return p1 + '...' + p2;
      }
      return match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function isMeaningful(line: string, index: number, allLines: string[], context: { nearError: boolean } = { nearError: false }): boolean {
  if (!line || line.length < 10) return false;
  if (!isAppiumLog(line)) return false;

  if (config.enableContextAwareFiltering && context.nearError === false) {
    const routineSuccess = [
      /Successfully.*found.*element/i,
      /Element.*is.*visible/i,
      /Command.*succeeded/i,
      /Waiting.*completed/i,
      /Got response with status 200.*element.*200/i,
    ];

    if (/\[debug\]/i.test(line) && routineSuccess.some(p => p.test(line))) {
      return false;
    }
  }

  const levelMatch = line.match(/^.*? - \[([^\]]+)\]/);
  const level = levelMatch ? levelMatch[1].toLowerCase() : '';

  const excludePatterns = [
    /\[debug\].*?(?:Clearing new command timeout|Plugins which can handle|Plugin.*is now handling|Executing default handling)(?!.*Error)/i,
    /\[debug\].*?(?:Executing command|Calling AppiumDriver|Matched.*to command name)(?!.*Error)/i,
    /\[debug\].*?(?:Proxying \[.*\] to \[.*\] with (?:no )?body)(?!.*Error)/i,
    /\[debug\].*?(?:Got response with status 200|Responding to client)(?!.*Error)/i,
    /\[debug\].*?(?:Waiting up to \d+ ms for condition)/i,
    /\[debug\].*?(?:Valid locator strategies|Event.*logged at)(?!.*Error)/i,
    /\[debug\].*?(?:The value of.*setting did not change)/i,
    /\[debug\].*?(?:Would have proxied command directly)(?!.*Error)/i,
    /\[debug\].*?(?:Received the following W3C actions|Preprocessed actions)/i,
    /\[debug\].*?(?:Added.*property.*to.*request body)/i,
    /\[debug\].*?(?:Cached the protocol value|Available devices)/i,
    /\[debug\].*?(?:Crash reports root.*does not exist)/i,
    /\[debug\].*?(?:Checking BaseDriver versions)/i,
    /\[debug\].*?(?:Taking screenshot with WDA)(?!.*Error)/i,
    /\[debug\].*?(?:Creating iDevice object)/i,
    /\[HTTP\] \[HTTP\] <-- .* 200 .* -\d+$/,
    /\[HTTP\] \[HTTP\] --> GET.*\/context.*\{\}$/,
    /\[HTTP\] \[HTTP\] <-- GET.*\/context 200\s+\d+\s+\d+$/,
    /^.*? - \[HTTP\] \[HTTP\]\s*$/,
  ];

  if (level.includes('http') && /\[HTTP\] \[HTTP\] <--.*\s(4\d{2}|5\d{2})\s/.test(line)) {
    return true;
  }

  const hasError = /Error|Exception|Failed|Cannot|NoSuchElement|Timeout|InvalidArgument|StaleElement|status [4-5]\d{2}/i.test(line);
  if (hasError) return true;

  if (excludePatterns.some(p => p.test(line))) return false;

  if (level.includes('http')) {
    if (/\[HTTP\] \[HTTP\] -->/.test(line)) {
      return true;
    }
    if (/\[HTTP\] \[HTTP\] <--.*\/session.*200/.test(line) &&
      (/POST.*\/session|DELETE.*\/session/.test(line) || /session.*created|session.*deleted/i.test(line))) return true;
    if (/\[HTTP\] \[HTTP\] <--.*200\s+\d{4,}/.test(line)) return true;
    if (/\[HTTP\] \[HTTP\] <--.*\s(4\d{2}|5\d{2})\s/.test(line)) return true;
  }

  const errorKeywords = [
    /NoSuchElementError/i,
    /TimeoutError|timeout/i,
    /InvalidArgument/i,
    /StaleElementReference/i,
    /WebDriverException/i,
  ];

  if (errorKeywords.some(p => p.test(line))) return true;

  if (/^[^{]*\{.*(value|id|using|text).*["']/i.test(line)) {
    if (index > 0 && /\[HTTP\] \[HTTP\] -->/.test(allLines[index - 1])) {
      return true;
    }
  }

  if (/WARNING|WARN|Warning/i.test(line)) return true;

  const criticalPatterns = [
    /Session.*created|Session.*deleted|Session.*destroyed/i,
    /Creating.*session|Deleting.*session/i,
    /New.*session.*created.*successfully/i,
    /Determined.*protocol/i,
    /Session.*created.*with.*session.*id/i,
    /Cannot retrieve.*Original error/i,
    /Capability.*changed.*may cause.*behavior/i,
    /The following capabilities.*provided.*not recognized/i,
    /Proxying to WDA with an unknown route/i,
    /Capability.*changed from.*to/i,
    /Will reuse.*WDA instance/i,
    /Using.*WDA.*agent|Using.*WDA.*path/i,
    /WDA.*build.*settings/i,
  ];

  if (criticalPatterns.some(p => p.test(line))) return true;

  if (level.includes('http') && /\[HTTP\] \[HTTP\] <--/.test(line)) {
    if (/\s(4\d{2}|5\d{2})\s/.test(line)) return true;
  }

  if (!level.includes('debug')) {
    if (/Session|session/i.test(line)) {
      if (/Session created|Session deleted|New.*session/i.test(line)) return true;
    }

    if (/Appium.*creating|Driver.*installed|Attempting.*find.*driver/i.test(line)) return true;

    if (/WDA|WebDriverAgent/i.test(line)) {
      if (/Error|Failed|Cannot|Ready|ready/i.test(line)) return true;
      if (/reuse.*WDA|Using.*WDA/i.test(line)) return true;
    }

    if (/Capability|capability/i.test(line) &&
      (/changed|not recognized|provided/i.test(line))) return true;
  }

  if (level.includes('debug')) {
    if (errorKeywords.some(p => p.test(line))) return true;

    if (/Encountered.*internal.*error|Matched W3C error code/i.test(line)) return true;
    if (/doNativeFind|findNativeElement|NoSuchElement/i.test(line)) return true;

    if (/at\s+\w+\.|Stack trace|Traceback/i.test(line)) return true;
  }

  if (level.includes('debug') && !errorKeywords.some(p => p.test(line))) {
    return false;
  }

  return false;
}

function compressSessionSetup(lines: string[]): string[] {
  if (!config.enableSessionCompression) {
    return lines;
  }

  const sessionStart = lines.findIndex(l => /Session created with session id/i.test(l));
  const sessionReady = lines.findIndex(l => /session.*created successfully/i.test(l));

  if (sessionStart < 0 || sessionReady <= sessionStart || sessionReady - sessionStart < 5) {
    return lines;
  }

  const setupLines = lines.slice(sessionStart, sessionReady + 1);
  const beforeSetup = lines.slice(0, sessionStart);
  const afterSetup = lines.slice(sessionReady + 1);

  const errors = setupLines.filter(l =>
    /Error|Exception|Failed|Cannot|NoSuchElement/i.test(l)
  );

  const capabilities = setupLines.filter(l =>
    /capability.*changed|not recognized|provided.*but.*not recognized/i.test(l) &&
    !/Error|Exception|Failed/i.test(l)
  );

  const warnings = setupLines.filter(l =>
    /warning|deprecated|may cause.*behavior/i.test(l) &&
    !/Error|Exception|Failed/i.test(l)
  );

  const critical = setupLines.filter(l =>
    /Session.*created|Error|Exception|Failed|Cannot|NoSuchElement|WDA|WebDriverAgent/i.test(l) ||
    /capability.*changed|not recognized/i.test(l)
  );

  const compressed = [
    ...critical.filter(l => !/capability.*changed|not recognized/i.test(l)),
    ...errors,
    ...(capabilities.length > 0 ? [
      `[SUMMARY] ${capabilities.length} capability warning(s): ${capabilities.slice(0, 3).map(l => {
        const match = l.match(/capability.*?['"]([^'"]+)['"]|capability.*?([A-Za-z_][A-Za-z0-9_]*)/i);
        return match ? (match[1] || match[2] || 'capability') : 'capability';
      }).join(', ')}${capabilities.length > 3 ? ' ...' : ''}`
    ] : []),
    ...(warnings.length > capabilities.length ? [
      `[SUMMARY] ${warnings.length - capabilities.length} additional warning(s)`
    ] : []),
  ];

  return [...beforeSetup, ...compressed, ...afterSetup];
}

export function filterAppiumLogs(logContent: string): string | null {
  if (!logContent || typeof logContent !== 'string') return null;

  const originalLines = logContent.split(/\r?\n/);

  const errorIndices = originalLines.map((l, i) =>
    /Error|Exception|Failed|Cannot|NoSuchElement|status [4-5]\d{2}/i.test(l) ? i : -1
  ).filter(i => i >= 0);

  let processedLines = originalLines;
  if (config.enableSessionCompression) {
    processedLines = compressSessionSetup(processedLines);
  }

  const meaningful: string[] = [];
  for (let i = 0; i < processedLines.length; i++) {
    const context = { nearError: errorIndices.some(ei => Math.abs(ei - i) <= 5) };

    if (isMeaningful(processedLines[i], i, processedLines, context)) {
      meaningful.push(processedLines[i]);
    }
  }

  if (meaningful.length === 0) return null;

  return meaningful.join('\n').trim() || null;
}
