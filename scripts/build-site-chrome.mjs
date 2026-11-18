// Writes public/site-chrome.js from src/components/site/siteData.js, so the plain .html pages
// show exactly the same header, menus and footer as the Next.js pages.
// Run after changing the menus:  node scripts/build-site-chrome.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = join(mkdtempSync(join(tmpdir(), 'sc-')), 'siteData.mjs');
writeFileSync(tmp, readFileSync(join(root, 'src/components/site/siteData.js'), 'utf8'));
const d = await import(pathToFileURL(tmp).href);
const data = { MENU: d.MENU, QUICK: d.QUICK, AUTHORITIES: d.AUTHORITIES, FOOT_LINKS: d.FOOT_LINKS, SECTIONS: d.SECTIONS };
const tpl = readFileSync(join(root, 'scripts/site-chrome.template.js'), 'utf8');
writeFileSync(join(root, 'public/site-chrome.js'), tpl.replace('/*__DATA__*/null', JSON.stringify(data)));
console.log('public/site-chrome.js written');
