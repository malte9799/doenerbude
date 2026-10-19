// Turns the single-file build (dist-single/index.html) into the body-only page
// a claude.ai Artifact expects: strips <!doctype>/<html>/<head>/<body> and the
// document-level meta/title tags, keeps everything else byte for byte.
// Usage: node scripts/artifact.mjs [out.html]
// Careful: only exact tags are removed – shader code inside the bundle
// contains strings like "<metalnessmap_fragment>".
import { readFileSync, writeFileSync } from 'node:fs';

const out = process.argv[2] ?? 'dist-single/artifact.html';
const html = readFileSync('dist-single/index.html', 'utf8');

const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));

const cleanHead = head
  .replace('<meta charset="UTF-8" />', '')
  .replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />', '')
  .replace(/<title>[^<]*<\/title>/, '');

const page = `<title>DönerBude Studio</title>
<style>html,body{height:100%;background:#F6ECDD;color:#22201E}</style>
${cleanHead}${body}`;

// Sanity check: the bundle itself must survive untouched.
const script = html.slice(html.indexOf('<script'), html.lastIndexOf('</script>'));
if (!page.includes(script)) throw new Error('bundle was altered during conversion');
writeFileSync(out, page);
console.log(`wrote ${out} (${(page.length / 1024).toFixed(0)} kB)`);
