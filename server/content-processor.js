/**
 * content-processor.js  (v7 — minimum word count enforcement)
 * ─────────────────────────────────────────────────────────────────────────────
 * Transfers content from source.docx → target.docx.
 *
 *  STEP 1 — SOURCE SCAN
 *    Collect every paragraph from source.docx whose font size is 12pt.
 *    Store plain text in an array (optionally reversed with --reverse).
 *
 *  STEP 2 — TARGET CLEAN + FILL  (with minimum word enforcement)
 *    Walk every paragraph in target.docx.
 *    PRESERVE (never replace):
 *      • Word-styled headings (Heading1–9, Title, Subtitle…)
 *      • Short paragraphs (≤ 80 chars) whose text matches a heading pattern
 *      • ALL paragraphs inside tables
 *      • Paragraphs with images, drawings, fields, SDTs
 *      • Visually empty paragraphs (blank lines)
 *    REPLACE body paragraphs with source text, enforcing:
 *      • MIN_WORDS_PER_SLOT  — each individual slot gets at least this many words
 *        (multiple source paragraphs are merged with a space until the minimum is met)
 *      • MIN_WORDS_PER_SECTION — before moving to the next section, if the total
 *        words written so far in the section fall below this, extra merged text is
 *        appended to the LAST slot of that section
 *
 * KEY NUMBERS (tune with --min-slot and --min-section flags):
 *   --min-slot    120   each body paragraph gets at least ~120 words  (≈5-6 lines)
 *   --min-section 400   each section gets at least ~400 words total
 *
 * INSTALL (once)
 *   npm install pizzip
 *
 * USAGE
 *   node content-processor.js \
 *     --source      source.docx \
 *     --target      target.docx \
 *     [--output     result.docx]
 *     [--min-slot   120]          min words per body paragraph slot
 *     [--min-section 400]         min total words per section
 *     [--reverse]                 reverse the source paragraph array
 *     [--debug]                   verbose logging
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DEFAULT_MIN_SLOT    = 100;  // ~5-6 lines of body text per paragraph slot
const DEFAULT_MIN_SECTION = 200;  // minimum total words across all slots in a section

// ─────────────────────────────────────────────────────────────────────────────
//  CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    debug: false,
    reverse: false,
    'min-slot':    DEFAULT_MIN_SLOT,
    'min-section': DEFAULT_MIN_SECTION,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--debug')   { args.debug   = true; continue; }
    if (a === '--reverse') { args.reverse = true; continue; }
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1];
      args[key] = isNaN(val) ? val : Number(val);
      i++;
    }
  }
  return args;
}

// ─────────────────────────────────────────────────────────────────────────────
//  DOCX ZIP
// ─────────────────────────────────────────────────────────────────────────────

function openDocx(filePath) {
  const PizZip = require('pizzip');
  const zip    = new PizZip(fs.readFileSync(filePath));
  const xml    = zip.file('word/document.xml').asText();
  return { zip, xml };
}

// ─────────────────────────────────────────────────────────────────────────────
//  XML UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function xmlEscape(s) {
  return s
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function paraText(pXml) {
  const chunks = [];
  const re     = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let   m;
  while ((m = re.exec(pXml)) !== null) chunks.push(m[1]);
  return chunks.join('').trim();
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasVisibleText(pXml) {
  return paraText(pXml).length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HEADING DETECTION
// ─────────────────────────────────────────────────────────────────────────────

const MAX_HEADING_LENGTH = 80;

const STANDALONE_HEADINGS = new Set([
  'abstract', 'acknowledgements', 'acknowledgments', 'references',
  'bibliography', 'appendix', 'contents', 'table of contents',
  'list of figures', 'list of tables', 'declaration', 'preface',
  'foreword', 'glossary', 'index',
]);

const HEADING_TEXT_PATTERNS = [
  /^chapter\s+[\divxlc]+[\s:\-–—]/i,
  /^chapter\s+[\divxlc]+$/i,
  /^\d+(\.\d+)+\s+\S/,
  /^\d+(\.\d+)+\.?$/,
  /^\d+\.$/,
];

function getPStyle(pXml) {
  const m = pXml.match(/<w:pStyle\s+w:val="([^"]+)"/);
  return m ? m[1] : '';
}

function isHeading(pXml) {
  const style = getPStyle(pXml).toLowerCase();
  if (
    style.startsWith('heading') ||
    style === 'title'           ||
    style === 'subtitle'        ||
    style.includes('toc')       ||
    pXml.includes('<w:outlineLvl')
  ) return true;

  const text = paraText(pXml);
  if (!text || text.length > MAX_HEADING_LENGTH) return false;
  if (STANDALONE_HEADINGS.has(text.toLowerCase())) return true;
  for (const pat of HEADING_TEXT_PATTERNS) {
    if (pat.test(text)) return true;
  }
  return false;
}

function hasEmbeddedObjects(pXml) {
  return (
    pXml.includes('<w:drawing')            ||
    pXml.includes('<mc:AlternateContent')  ||
    pXml.includes('<w:fldChar')            ||
    pXml.includes('<w:sdt')               ||
    pXml.includes('<w:object')            ||
    pXml.includes('<w:hyperlink')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FONT SIZE DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function getDominantFontSizeHalfPt(pXml) {
  const runSizes = [];
  const runRe    = /<w:rPr>[\s\S]*?<\/w:rPr>/g;
  let   rm;
  while ((rm = runRe.exec(pXml)) !== null) {
    const szM = rm[0].match(/<w:sz\s+w:val="(\d+)"/);
    if (szM) runSizes.push(parseInt(szM[1], 10));
  }
  if (runSizes.length > 0) {
    const freq = {};
    let maxF = 0, dominant = runSizes[0];
    for (const sz of runSizes) {
      freq[sz] = (freq[sz] || 0) + 1;
      if (freq[sz] > maxF) { maxF = freq[sz]; dominant = sz; }
    }
    return dominant;
  }
  const pPrM = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  if (pPrM) {
    const szM = pPrM[0].match(/<w:sz\s+w:val="(\d+)"/);
    if (szM) return parseInt(szM[1], 10);
  }
  return null;
}

function isBody12pt(pXml) {
  if (isHeading(pXml))          return false;
  if (hasEmbeddedObjects(pXml)) return false;
  if (!hasVisibleText(pXml))    return false;
  const sz = getDominantFontSizeHalfPt(pXml);
  return sz === null || sz === 24;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SOURCE PARAGRAPH POOL  (cyclic, merging-aware)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A cyclic cursor over the source paragraphs array.
 * nextChunk(minWords) keeps pulling and concatenating paragraphs until the
 * accumulated text meets minWords, then returns the combined string.
 * Wraps around to the start when exhausted.
 */
function makePool(sourceParas) {
  let idx = 0;

  function next() {
    const t = sourceParas[idx % sourceParas.length];
    idx++;
    return t;
  }

  /**
   * Pull and merge source paragraphs until combined word count >= minWords.
   * Returns a single string ready to be inserted into a paragraph slot.
   */
  function nextChunk(minWords) {
    let text = next();
    while (wordCount(text) < minWords) {
      text += ' ' + next();
    }
    return text.trim();
  }

  return { nextChunk, getIdx: () => idx };
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEXT REPLACEMENT
// ─────────────────────────────────────────────────────────────────────────────

function replaceParaContent(pXml, newText) {
  const pOpenTag = pXml.match(/^<w:p[^>]*>/)[0];
  const pPrMatch = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  const pPrBlock = pPrMatch ? pPrMatch[0] : '';
  const escaped   = xmlEscape(newText);
  const spaceAttr = /^\s|\s$/.test(newText) ? ' xml:space="preserve"' : '';
  return `${pOpenTag}${pPrBlock}<w:r><w:t${spaceAttr}>${escaped}</w:t></w:r></w:p>`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  TOKENISER  (fixed — only matches real <w:tbl> and <w:p> tags)
// ─────────────────────────────────────────────────────────────────────────────

function isTblOpen(xml, pos) {
  if (!xml.startsWith('<w:tbl', pos)) return false;
  const after = xml[pos + 6];
  return after === '>' || after === ' ' || after === '\n' || after === '\r' || after === '\t';
}

function isPOpen(xml, pos) {
  if (!xml.startsWith('<w:p', pos)) return false;
  const after = xml[pos + 4];
  return after === '>' || after === ' ' || after === '\n' || after === '\r' || after === '\t';
}

function findNextTbl(xml, startPos) {
  let pos = startPos;
  while (true) {
    const idx = xml.indexOf('<w:tbl', pos);
    if (idx === -1) return -1;
    if (isTblOpen(xml, idx)) return idx;
    pos = idx + 1;
  }
}

function findNextP(xml, startPos) {
  let pos = startPos;
  while (true) {
    const idx = xml.indexOf('<w:p', pos);
    if (idx === -1) return -1;
    if (isPOpen(xml, idx)) return idx;
    pos = idx + 1;
  }
}

function tokeniseDocBody(xml) {
  const tokens = [];
  let pos     = 0;
  let current = '';

  while (pos < xml.length) {
    const tblStart = findNextTbl(xml, pos);
    const pStart   = findNextP(xml,   pos);

    if (tblStart === -1 && pStart === -1) { current += xml.slice(pos); break; }

    const nextTag = (tblStart === -1) ? pStart
                  : (pStart   === -1) ? tblStart
                  : Math.min(tblStart, pStart);

    current += xml.slice(pos, nextTag);

    if (nextTag === tblStart) {
      if (current) { tokens.push({ type: 'other', content: current }); current = ''; }
      let depth = 0, i = tblStart;
      while (i < xml.length) {
        if (isTblOpen(xml, i))                { depth++; i += 6; }
        else if (xml.startsWith('</w:tbl>', i)) { depth--; i += 8; if (depth === 0) break; }
        else i++;
      }
      tokens.push({ type: 'table', content: xml.slice(tblStart, i) });
      pos = i;
    } else {
      if (current) { tokens.push({ type: 'other', content: current }); current = ''; }
      const pEnd = xml.indexOf('</w:p>', nextTag);
      if (pEnd === -1) { current += xml.slice(nextTag); pos = xml.length; }
      else { tokens.push({ type: 'para', content: xml.slice(nextTag, pEnd + 6) }); pos = pEnd + 6; }
    }
  }

  if (current) tokens.push({ type: 'other', content: current });
  return tokens;
}

// ─────────────────────────────────────────────────────────────────────────────
//  TWO-PASS PROCESSING
//
//  Pass 1 — DRY RUN
//    Walk all tokens, identify which para indices are replaceable and
//    group them by section. Build a map: sectionId → [tokenIndices].
//
//  Pass 2 — FILL
//    For each section, work out how many total words are needed
//    (max(slots * minSlot, minSection)).
//    Distribute that budget evenly across the slots in that section,
//    calling pool.nextChunk(wordsForThisSlot) for each.
//    Sections with 0 replaceable slots are skipped.
// ─────────────────────────────────────────────────────────────────────────────

async function processWord(sourcePath, targetPath, outputPath, opts) {
  const { debug, reverse, 'min-slot': minSlot, 'min-section': minSection } = opts;

  console.log('\n── Word Document Processing ──────────────────────────────────');
  console.log(`Source      : ${sourcePath}`);
  console.log(`Target      : ${targetPath}`);
  console.log(`Output      : ${outputPath}`);
  console.log(`Min/slot    : ${minSlot} words`);
  console.log(`Min/section : ${minSection} words\n`);

  const { xml: sourceXml }                 = openDocx(sourcePath);
  const { zip: targetZip, xml: targetXml } = openDocx(targetPath);

  // ── Collect source 12pt paragraphs ────────────────────────────────────────
  const sourceParas = [];
  const sRe = /<w:p[ >][\s\S]*?<\/w:p>/g;
  let sm;
  while ((sm = sRe.exec(sourceXml)) !== null) {
    if (isBody12pt(sm[0])) {
      const text = paraText(sm[0]);
      if (text) sourceParas.push(text);
    }
  }

  console.log(`Source 12pt paragraphs : ${sourceParas.length}`);
  if (sourceParas.length === 0) {
    console.warn('WARNING: No 12pt paragraphs found in source. Output will be a copy of target.');
    fs.writeFileSync(outputPath, fs.readFileSync(targetPath));
    return;
  }

  if (reverse) { sourceParas.reverse(); console.log('Source array reversed.'); }

  const pool = makePool(sourceParas);

  // ── Tokenise target ────────────────────────────────────────────────────────
  const tokens    = tokeniseDocBody(targetXml);
  const tblCount  = tokens.filter(t => t.type === 'table').length;
  const paraCount = tokens.filter(t => t.type === 'para').length;
  console.log(`Target tokens : ${paraCount} paragraphs, ${tblCount} tables`);

  // ── PASS 1: group replaceable token indices by section ────────────────────
  // sections = [ { headingText, slotIndices: [i, i, ...] }, ... ]
  const sections = [];
  let   curSection = { headingText: '(preamble)', slotIndices: [] };

  tokens.forEach((token, i) => {
    if (token.type !== 'para') return;
    if (isHeading(token.content)) {
      // Save current section (even if empty) and start a new one
      sections.push(curSection);
      curSection = { headingText: paraText(token.content), slotIndices: [] };
    } else if (!hasEmbeddedObjects(token.content) && hasVisibleText(token.content)) {
      curSection.slotIndices.push(i);
    }
  });
  sections.push(curSection);

  const totalSlots = sections.reduce((s, sec) => s + sec.slotIndices.length, 0);
  console.log(`Sections identified : ${sections.length}  (${totalSlots} replaceable slots)\n`);

  // ── PASS 2: compute per-slot text and build replacement map ───────────────
  // replacements[tokenIndex] = newText
  const replacements = {};

  for (const sec of sections) {
    const { headingText, slotIndices } = sec;
    if (slotIndices.length === 0) continue;

    const numSlots = slotIndices.length;

    // Total words budget for this section
    const budgetBySlot    = numSlots * minSlot;
    const budgetBySection = minSection;
    const totalBudget     = Math.max(budgetBySlot, budgetBySection);

    // Words per slot (distribute evenly, each gets at least minSlot)
    const wordsPerSlot = Math.max(minSlot, Math.ceil(totalBudget / numSlots));

    if (debug) {
      console.log(`[SECTION] "${headingText.slice(0, 60)}" — ${numSlots} slots, ${wordsPerSlot} words/slot`);
    }

    for (const tokenIdx of slotIndices) {
      const text = pool.nextChunk(wordsPerSlot);
      replacements[tokenIdx] = text;
      if (debug) console.log(`  [SLOT ${tokenIdx}] ${wordCount(text)} words: "${text.slice(0, 60)}…"`);
    }
  }

  // ── Rebuild XML applying replacements ─────────────────────────────────────
  let replaced  = 0;
  let preserved = 0;

  const parts = tokens.map((token, i) => {
    if (token.type === 'table') return token.content;
    if (token.type === 'other') return token.content;

    if (replacements[i] !== undefined) {
      replaced++;
      return replaceParaContent(token.content, replacements[i]);
    }

    preserved++;
    return token.content;
  });

  const modifiedXml = parts.join('');

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalWordsWritten = Object.values(replacements).reduce((s, t) => s + wordCount(t), 0);
  console.log(`Body paragraphs replaced  : ${replaced}`);
  console.log(`Paragraphs preserved      : ${preserved}`);
  console.log(`Total words written       : ${totalWordsWritten.toLocaleString()}`);
  console.log(`Source pool cycles used   : ${(pool.getIdx() / sourceParas.length).toFixed(2)}`);

  // ── Save ───────────────────────────────────────────────────────────────────
  targetZip.file('word/document.xml', modifiedXml);
  const buf = targetZip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outputPath, buf);
  console.log(`\n✓  Output saved → ${outputPath}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  if (!args.source || !args.target) {
    console.error(`
ERROR: --source and --target are required.

Usage:
  node content-processor.js \\
    --source      source.docx \\
    --target      target.docx \\
    [--output     result.docx] \\
    [--min-slot   120]          min words per body paragraph  (default: ${DEFAULT_MIN_SLOT}) \\
    [--min-section 400]         min total words per section   (default: ${DEFAULT_MIN_SECTION}) \\
    [--reverse] \\
    [--debug]
    `);
    process.exit(1);
  }

  const sourcePath = path.resolve(args.source);
  const targetPath = path.resolve(args.target);
  const outputPath = path.resolve(args.output || `processed_${path.basename(targetPath)}`);

  for (const [flag, p] of [['--source', sourcePath], ['--target', targetPath]]) {
    if (!fs.existsSync(p)) {
      console.error(`ERROR: File not found for ${flag}: ${p}`);
      process.exit(1);
    }
  }

  try {
    await processWord(sourcePath, targetPath, outputPath, {
      debug:         args.debug,
      reverse:       args.reverse,
      'min-slot':    args['min-slot'],
      'min-section': args['min-section'],
    });
  } catch (err) {
    console.error(`\nProcessing failed: ${err.message}`);
    if (args.debug) console.error(err.stack);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { processWord };
