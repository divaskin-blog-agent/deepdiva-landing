// 주제별 미리보기 한 장(3×2)을 preview/에 만든다
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');

(async () => {
  const out = path.join(__dirname, 'out'), prev = path.join(__dirname, 'preview');
  fs.mkdirSync(prev, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1980, height: 900 } });
  const tmp = path.join(__dirname, 'sheet.html');
  for (const d of fs.readdirSync(out).sort()) {
    const imgs = fs.readdirSync(path.join(out, d)).sort().map(f => `<img src="out/${encodeURIComponent(d)}/${f}">`).join('');
    fs.writeFileSync(tmp, `<body style="margin:0;background:#dde7eb;display:grid;grid-template-columns:repeat(3,640px);gap:20px;padding:20px;width:1980px">${imgs}<style>img{width:640px}</style></body>`);
    await page.goto('file://' + tmp);
    await page.waitForLoadState('load');
    await page.screenshot({ path: path.join(prev, d + '.jpg'), type: 'jpeg', quality: 85, fullPage: true });
  }
  fs.rmSync(tmp);
  await browser.close();
  console.log('preview done');
})();
