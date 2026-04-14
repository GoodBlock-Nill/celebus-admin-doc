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

// Convert all v2 documents
const base = __dirname;
const files = [
  ['[CEB-000] 공통 정책.md', 'confluence-html/[CEB-000] 공통 정책.html'],
  ['APP/[CEB-ART-101] 아티스트 메인.md', 'confluence-html/APP/[CEB-ART-101] 아티스트 메인.html'],
  ['APP/[CEB-FQ-101] Quest 메인.md', 'confluence-html/APP/[CEB-FQ-101] Quest 메인.html'],
  ['APP/[CEB-FQ-205] Quest 제출.md', 'confluence-html/APP/[CEB-FQ-205] Quest 제출.html'],
  ['APP/[CEB-FQ-201-MD] 반려 사유 모달.md', 'confluence-html/APP/[CEB-FQ-201-MD] 반려 사유 모달.html'],
  ['APP/[CEB-FQ-501] 일일 미션.md', 'confluence-html/APP/[CEB-FQ-501] 일일 미션.html'],
  ['APP/[CEB-DUK-201] 서포트 이벤트.md', 'confluence-html/APP/[CEB-DUK-201] 서포트 이벤트.html'],
  ['APP/[CEB-DUK-101] 덕력 랭킹.md', 'confluence-html/APP/[CEB-DUK-101] 덕력 랭킹.html'],
  ['APP/[CEB-EVT-201] 팬덤 레벨.md', 'confluence-html/APP/[CEB-EVT-201] 팬덤 레벨.html'],
  ['APP/[CEB-EVT-101] Raffle.md', 'confluence-html/APP/[CEB-EVT-101] Raffle.html'],
  ['APP/[CEB-COL-101] 컬렉션.md', 'confluence-html/APP/[CEB-COL-101] 컬렉션.html'],
  ['APP/[CEB-INF-101] 정보 피드.md', 'confluence-html/APP/[CEB-INF-101] 정보 피드.html'],
  ['APP/[CEB-MEM-101] 기억저장소.md', 'confluence-html/APP/[CEB-MEM-101] 기억저장소.html'],
];

for (const [md, html] of files) {
  convertFile(path.join(base, md), path.join(base, html));
}

console.log(`\n총 ${files.length}개 파일 변환 완료`);
