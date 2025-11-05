

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

  const hasError = /Error|Exception|Failed|Cannot|NoSuchElement|Timeout|InvalidArgument|StaleElement|status [4-5]\d{2}|exit.*code [1-9]\d*|exited with code [1-9]\d*/i.test(line);
  if (hasError) return true;

  if (excludePatterns.some(p => p.test(line))) return false;

  const sourceMatch = line.match(/\[(?:debug|info|warn|error)\] \[([^\]]+)\]/i) || 
                      line.match(/^.*? - \[([^\]]+)\]/);
  const source = sourceMatch ? sourceMatch[1].toLowerCase() : '';
  const criticalSources = ['idevice', 'xcuitest', 'wdproxy', 'w3c', 'webdriveragent', 'wda'];
  if (criticalSources.some(cs => source.includes(cs))) {
    return true;
  }

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

function shouldTruncateResponse(line: string): { truncate: boolean; truncated?: string; reason?: string } {
  if (!config.enableResponseTruncation) {
    return { truncate: false };
  }

  if (/Error|error|fail|null|undefined|status [4-5]\d{2}/i.test(line)) {
    return { truncate: false, reason: 'contains_error' };
  }

  if (line.length < 500) {
    return { truncate: false, reason: 'small_payload' };
  }

  if (/Got response with status 200.*value.*\{/.test(line)) {
    const match = line.match(/value.*?(\{.+)/);
    if (match && match[1].length > 500) {
      const preview = match[1].substring(0, 200);
      const truncated = line.replace(match[1], preview + `... [${match[1].length} chars truncated]`);
      return { truncate: true, truncated };
    }
  }

  if (/\[HTTP\] \[HTTP\] <--.*200.*\{/.test(line) && line.length > 1000) {
    const jsonMatch = line.match(/(\{.+)/);
    if (jsonMatch && jsonMatch[1].length > 500) {
      const preview = jsonMatch[1].substring(0, 200);
      const truncated = line.replace(jsonMatch[1], preview + `... [${jsonMatch[1].length} chars truncated]`);
      return { truncate: true, truncated };
    }
  }

  return { truncate: false };
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

function extractElementIdFromError(line: string): string | null {
  const elementIdMatch = line.match(/value\s+['"]([^"']+)['"]|unable to find.*value\s+['"]([^"']+)['"]/i);
  if (elementIdMatch) {
    return elementIdMatch[1] || elementIdMatch[2];
  }
  return null;
}

function findElementIdInContext(allLines: string[], index: number): string | null {
  for (let i = index - 1; i >= 0 && i >= index - 10; i--) {
    const elementId = extractElementIdFromError(allLines[i]);
    if (elementId) {
      return elementId;
    }
    if (/Got response with status 404.*value.*["']/i.test(allLines[i])) {
      const elementId = extractElementIdFromError(allLines[i]);
      if (elementId) {
        return elementId;
      }
    }
  }
  return null;
}

function isCriticalLine(line: string, allLines: string[], index: number): boolean {
  if (/Error|Exception|Failed|Cannot|NoSuchElement/i.test(line)) return true;

  if (/\[HTTP\].*-->/i.test(line)) {
    if (/value.*['"][^'"]{3,}['"]|id.*['"][^'"]{3,}['"]|using.*['"][^'"]{3,}['"]/i.test(line)) return true;
    if (index + 1 < allLines.length) {
      const nextLine = allLines[index + 1];
      if (nextLine && /value.*["'][^"']{3,}["']|id.*["'][^"']{3,}["']|using.*["'][^"']{3,}["']|text.*["'][^"']{3,}["']/i.test(nextLine)) {
        return true;
      }
    }
  }

  if (/\[HTTP\].*<--.*\s(4\d{2}|5\d{2})\s/i.test(line)) return true;

  if (/at\s+\w+|traceback|stack/i.test(line)) return true;

  if (/^[^{]*\{.*value.*["']|^[^{]*\{.*id.*["']|^[^{]*\{.*using.*["']/i.test(line)) return true;

  if (/Matched W3C error code|Encountered internal error running command|NoSuchElementError/i.test(line)) {
    return true;
  }

  return false;
}

function groupSimilarLines(lines: string[], threshold = 0.85): Array<{ lines: string[]; count: number; pattern: string }> {
  if (!config.enableHTTPGrouping) {
    return lines.map(line => ({ lines: [line], count: 1, pattern: cleanLogLine(line) }));
  }

  const groups: Array<{ lines: string[]; count: number; pattern: string }> = [];
  const processed = new Set<number>();
  const cleanedPatterns = lines.map(l => cleanLogLine(l));

  for (let i = 0; i < lines.length; i++) {
    if (processed.has(i)) continue;

    const group = {
      lines: [lines[i]],
      count: 1,
      pattern: cleanedPatterns[i]
    };

    const isCritical = isCriticalLine(lines[i], lines, i);

    for (let j = i + 1; j < lines.length; j++) {
      if (processed.has(j)) continue;

      const isJCritical = isCriticalLine(lines[j], lines, j);

      if (isCritical && isJCritical) {
        if (/\[HTTP\].*-->/i.test(lines[i]) && i + 1 < lines.length &&
          /\[HTTP\].*-->/i.test(lines[j]) && j + 1 < lines.length) {
          const nextI = lines[i + 1];
          const nextJ = lines[j + 1];
          if (nextI && /value.*["']|id.*["']|using.*["']/i.test(nextI) &&
            nextJ && /value.*["']|id.*["']|using.*["']/i.test(nextJ)) {
            const combinedI = cleanLogLine(lines[i]) + ' ' + cleanLogLine(nextI);
            const combinedJ = cleanLogLine(lines[j]) + ' ' + cleanLogLine(nextJ);
            if (combinedI === combinedJ) {
              group.lines.push(lines[j]);
              group.count++;
              processed.add(j);
              if (j + 1 < lines.length) processed.add(j + 1);
            }
            continue;
          }
        }

        const elementIdI = extractElementIdFromError(lines[i]) || findElementIdInContext(lines, i);
        const elementIdJ = extractElementIdFromError(lines[j]) || findElementIdInContext(lines, j);

        if (elementIdI || elementIdJ) {
          // At least one line has an element ID - use element ID matching
          if (elementIdI && elementIdJ) {
            if (elementIdI === elementIdJ) {
              if (cleanedPatterns[i] === cleanedPatterns[j]) {
                group.lines.push(lines[j]);
                group.count++;
                processed.add(j);
              }
            }
          }
          continue;
        }

        if (cleanedPatterns[i] === cleanedPatterns[j]) {
          const lineDistance = Math.abs(j - i);
          if (lineDistance <= 5) {
            group.lines.push(lines[j]);
            group.count++;
            processed.add(j);
          }
        }
        continue;
      }

      if (isCritical || isJCritical) continue;

      if (cleanedPatterns[i] === cleanedPatterns[j]) {
        group.lines.push(lines[j]);
        group.count++;
        processed.add(j);
        continue;
      }

      const currentTokens = new Set(cleanedPatterns[i].toLowerCase().split(/\s+/));
      const targetTokens = new Set(cleanedPatterns[j].toLowerCase().split(/\s+/));

      const intersection = new Set(Array.from(currentTokens).filter(x => targetTokens.has(x)));
      const unionSize = currentTokens.size + targetTokens.size - intersection.size;
      const similarity = unionSize > 0 ? intersection.size / unionSize : 0;

      if (similarity >= threshold) {
        group.lines.push(lines[j]);
        group.count++;
        processed.add(j);
      }
    }

    groups.push(group);
    processed.add(i);
  }

  return groups;
}

function formatGroup(group: { lines: string[]; count: number; pattern: string }): string {
  if (group.count === 1) return group.lines[0];

  const first = group.lines[0];
  const last = group.lines[group.lines.length - 1];

  const timestampRegex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{3})/;
  const firstTs = first.match(timestampRegex)?.[1];
  const lastTs = last.match(timestampRegex)?.[1];

  const levelMatch = first.match(/\[([^\]]+)\]/);
  const level = levelMatch ? levelMatch[1] : '';

  const timeRange = firstTs && lastTs && firstTs !== lastTs
    ? `${firstTs} → ${lastTs.split(' ').slice(-1)[0]}`
    : firstTs || '';

  return `${timeRange ? timeRange + ' ' : ''}${level ? '[' + level + '] ' : ''}[REPEATED ${group.count}x] ${group.pattern}`;
}

export function filterAppiumLogs(logContent: string, threshold = 0.85): string | null {
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

  const processedMeaningful = meaningful.map(line => {
    const truncation = shouldTruncateResponse(line);
    if (truncation.truncate && truncation.truncated) {
      return truncation.truncated;
    }
    return line;
  });

  const groups = groupSimilarLines(processedMeaningful, threshold);

  const output = groups.map(g => formatGroup(g)).join('\n');

  return output.trim() || null;
}
