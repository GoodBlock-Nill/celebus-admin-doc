const fs = require('fs');
const path = require('path');

const CSS = `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 960px;
  margin: 40px auto;
  padding: 0 20px;
  color: #172b4d;
  line-height: 1.6;
}
h1 { font-size: 24px; margin-top: 32px; }
h2 { font-size: 20px; margin-top: 28px; border-bottom: 1px solid #dfe1e6; padding-bottom: 8px; }
h3 { font-size: 16px; margin-top: 24px; }
h4 { font-size: 14px; margin-top: 20px; }
h5 { font-size: 13px; margin-top: 16px; font-weight: 600; }
h6 { font-size: 12px; margin-top: 14px; font-weight: 600; }
blockquote {
  border-left: 3px solid #dfe1e6;
  margin: 12px 0;
  padding: 8px 16px;
  color: #6b778c;
  background-color: #f9fafb;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}
th, td {
  border: 1px solid #dfe1e6;
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}
th {
  background-color: #f4f5f7;
  font-weight: 600;
}
pre {
  background-color: #f4f5f7;
  border: 1px solid #dfe1e6;
  border-radius: 3px;
  padding: 12px;
  overflow-x: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre;
}
code {
  background-color: #f4f5f7;
  border-radius: 3px;
  padding: 2px 4px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.9em;
}
hr {
  border: none;
  border-top: 1px solid #dfe1e6;
  margin: 24px 0;
}
ul, ol {
  padding-left: 24px;
  margin: 8px 0;
}
li {
  margin: 4px 0;
}
p {
  margin: 8px 0;
}`;

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function convertInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function convertMarkdown(md) {
  const lines = md.split('\n');
  let html = '';
  let inTable = false;
  let tableHeader = true;
  let inCode = false;
  let inBlockquote = false;
  let inList = false;
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code block
    if (line.match(/^```/)) {
      if (inCode) {
        html += '</code></pre>\n';
        inCode = false;
      } else {
        inCode = true;
        html += '<pre><code>';
      }
      continue;
    }
    if (inCode) {
      html += escapeHtml(line) + '\n';
      continue;
    }

    // Close list if not a list item
    if (inList && !line.match(/^[\s]*[-*]/) && !line.match(/^[\s]*\d+\./) && line.trim() !== '') {
      html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
      inList = false;
    }

    // Empty line
    if (line.trim() === '') {
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
      if (inTable) { html += '</table>\n'; inTable = false; tableHeader = true; }
      if (inList) { html += listType === 'ul' ? '</ul>\n' : '</ol>\n'; inList = false; }
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+\s*$/)) {
      if (inTable) { html += '</table>\n'; inTable = false; tableHeader = true; }
      if (inList) { html += listType === 'ul' ? '</ul>\n' : '</ol>\n'; inList = false; }
      html += '<hr>\n';
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      if (inTable) { html += '</table>\n'; inTable = false; tableHeader = true; }
      const level = headingMatch[1].length;
      html += `<h${level}>${convertInline(headingMatch[2])}</h${level}>\n`;
      continue;
    }

    // Blockquote
    if (line.match(/^>\s/)) {
      if (!inBlockquote) { html += '<blockquote>\n'; inBlockquote = true; }
      html += `<p>${convertInline(line.replace(/^>\s*/, ''))}</p>\n`;
      continue;
    }
    if (inBlockquote && !line.match(/^>/)) {
      html += '</blockquote>\n';
      inBlockquote = false;
    }

    // Table
    if (line.match(/^\|/)) {
      // Skip separator row
      if (line.match(/^\|\s*-+/)) { continue; }

      if (!inTable) {
        html += '<table>\n';
        inTable = true;
        tableHeader = true;
      }

      const cells = line.split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
      const tag = tableHeader ? 'th' : 'td';
      html += '<tr>' + cells.map(c => `<${tag}>${convertInline(c)}</${tag}>`).join('') + '</tr>\n';
      if (tableHeader) tableHeader = false;
      continue;
    }
    if (inTable && !line.match(/^\|/)) {
      html += '</table>\n';
      inTable = false;
      tableHeader = true;
    }

    // Unordered list
    if (line.match(/^[\s]*[-*]\s/)) {
      if (!inList || listType !== 'ul') {
        if (inList) html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
        html += '<ul>\n';
        inList = true;
        listType = 'ul';
      }
      html += `<li>${convertInline(line.replace(/^[\s]*[-*]\s/, ''))}</li>\n`;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^[\s]*(\d+)\.\s(.+)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) html += listType === 'ul' ? '</ul>\n' : '</ol>\n';
        html += '<ol>\n';
        inList = true;
        listType = 'ol';
      }
      html += `<li>${convertInline(olMatch[2])}</li>\n`;
      continue;
    }

    // Regular paragraph
    html += `<p>${convertInline(line)}</p>\n`;
  }

  if (inCode) html += '</code></pre>\n';
  if (inBlockquote) html += '</blockquote>\n';
  if (inTable) html += '</table>\n';
  if (inList) html += (listType === 'ul' ? '</ul>\n' : '</ol>\n');

  return html;
}

function convertFile(mdPath, htmlPath) {
  const md = fs.readFileSync(mdPath, 'utf-8');
  const titleMatch = md.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1] : path.basename(mdPath, '.md');

  const bodyHtml = convertMarkdown(md);

  const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    ${CSS}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, fullHtml, 'utf-8');
  console.log(`✅ ${path.basename(mdPath)} → ${path.basename(htmlPath)}`);
}

// ──────────────────────────────────────────────────────────────────
// Glob-based automatic mapping (Phase 2 — 회복탄력 인프라)
// hardcoded 매핑 제거. v2/{BO|APP}/*.md 와 v2/*.md 를 자동 발견.
//
// CLI:
//   (없음)             1회 변환
//   --watch            폴링 watch 모드 (의존성 추가 없이 fs.watch 사용)
//   --validate-only    Page Properties / changelog / 파일명 검증만
// ──────────────────────────────────────────────────────────────────

const base = __dirname;

// 1단계 파일만 (서브디렉토리 미포함)
function walkMdFlat(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isFile() && name.endsWith('.md')) out.push(full);
  }
  return out;
}

// 재귀 — 폴더 구조를 .md 경로 list 로 평탄화
function walkMdRecursive(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      out.push(...walkMdRecursive(full));
    } else if (stat.isFile() && name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function discoverFiles() {
  const mappings = [];
  // v2 루트 .md (1단계만 — APP/BO 디렉토리는 walkMdFlat 에서 자동 제외)
  for (const md of walkMdFlat(base)) {
    const name = path.basename(md);
    mappings.push([md, path.join(base, 'confluence-html', name.replace(/\.md$/, '.html'))]);
  }
  // v2/BO/ 재귀 — 영역별 폴더(USR/ART/BIVE/FQ/SYS/00-Common 등) 미러 출력
  const boDir = path.join(base, 'BO');
  for (const md of walkMdRecursive(boDir)) {
    const rel = path.relative(boDir, md); // 예: "FQ/[CEB-BO-FQ-101].md"
    const htmlRel = rel.replace(/\.md$/, '.html');
    mappings.push([md, path.join(base, 'confluence-html', 'BO', htmlRel)]);
  }
  // v2/APP/ 재귀 (현재는 평면이지만 미래 확장 대비)
  const appDir = path.join(base, 'APP');
  for (const md of walkMdRecursive(appDir)) {
    const rel = path.relative(appDir, md);
    const htmlRel = rel.replace(/\.md$/, '.html');
    mappings.push([md, path.join(base, 'confluence-html', 'APP', htmlRel)]);
  }
  return mappings;
}

function validatePageProperties(mdPath) {
  const text = fs.readFileSync(mdPath, 'utf8');
  const issues = [];
  if (!/##?\s*Page Properties/i.test(text)) issues.push('Page Properties 섹션 없음');
  if (!/(변경\s*이력|Changelog|## \d+\.\s*변경)/i.test(text)) issues.push('변경 이력(changelog) 섹션 없음');
  const fileName = path.basename(mdPath);
  if (!fileName.startsWith('[CEB-')) issues.push('파일명이 [CEB-...] 패턴이 아님');
  return issues;
}

function buildAll(opts) {
  opts = opts || {};
  const mappings = discoverFiles();
  let ok = 0, warn = 0;
  for (const [md, html] of mappings) {
    if (opts.validateOnly) {
      const issues = validatePageProperties(md);
      if (issues.length) {
        console.warn(`⚠️  ${path.basename(md)} — ${issues.join(', ')}`);
        warn++;
      } else { ok++; }
    } else {
      try { convertFile(md, html); ok++; }
      catch (e) { console.error(`❌ ${path.basename(md)} — ${e.message}`); warn++; }
    }
  }
  console.log(`\n총 ${mappings.length}개 — 성공 ${ok}, 경고/실패 ${warn}`);
  return { total: mappings.length, ok, warn };
}

function watchAll() {
  buildAll();
  console.log('\n👀 watch 모드 시작 (Ctrl+C로 종료) — recursive');
  // recursive: BO/APP/ 하위 영역 폴더(USR/ART/BIVE/FQ/SYS 등) 자동 감지 (macOS·Windows 지원)
  const watchedDirs = [
    { dir: base, mirrorRoot: path.join(base, 'confluence-html'), recursive: false },
    { dir: path.join(base, 'BO'), mirrorRoot: path.join(base, 'confluence-html', 'BO'), recursive: true },
    { dir: path.join(base, 'APP'), mirrorRoot: path.join(base, 'confluence-html', 'APP'), recursive: true },
  ];
  for (const { dir, mirrorRoot, recursive } of watchedDirs) {
    if (!fs.existsSync(dir)) continue;
    fs.watch(dir, { persistent: true, recursive }, (event, filename) => {
      if (!filename || !filename.endsWith('.md')) return;
      const mdPath = path.join(dir, filename);
      if (!fs.existsSync(mdPath)) return;
      // base 루트는 평면, BO/APP 는 폴더 구조 미러
      const htmlPath = path.join(mirrorRoot, filename.replace(/\.md$/, '.html'));
      try { convertFile(mdPath, htmlPath); }
      catch (e) { console.error(`❌ ${filename} — ${e.message}`); }
    });
  }
  setInterval(() => {}, 1000 * 60 * 60);
}

const args = process.argv.slice(2);
if (args.includes('--watch')) watchAll();
else if (args.includes('--validate-only')) {
  const r = buildAll({ validateOnly: true });
  process.exit(r.warn > 0 ? 1 : 0);
} else buildAll();
