// 카드뉴스 렌더러: data.js → HTML → 카드마다 PNG(1080×1350)
// 실행: content 폴더에서 npm install 후 `npm run cards`
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const sets = require('./data');
const BRAND = require('../brand');

const NM = path.resolve(__dirname, '../node_modules/@fontsource');
const font = f => 'file://' + path.join(NM, f);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>').replace(/\n/g, '<br>');

const css = `
@font-face{font-family:"DSans";font-weight:400;src:url(${font('noto-sans-kr/files/noto-sans-kr-korean-400-normal.woff2')})}
@font-face{font-family:"DSans";font-weight:700;src:url(${font('noto-sans-kr/files/noto-sans-kr-korean-700-normal.woff2')})}
@font-face{font-family:"DSans";font-weight:900;src:url(${font('noto-sans-kr/files/noto-sans-kr-korean-900-normal.woff2')})}
@font-face{font-family:"DLatin";font-weight:800;src:url(${font('montserrat/files/montserrat-latin-800-normal.woff2')})}
:root{--white:${BRAND.white};--aqua:${BRAND.aqua};--mint:${BRAND.mint};--deep:${BRAND.deep};--gold:${BRAND.gold};--ink:${BRAND.ink};--soft:${BRAND.aquaSoft};--muted:#5A7480}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#ccc}
.card{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--white);color:var(--ink);
  font-family:"DSans",sans-serif;padding:170px 96px 140px;display:flex;flex-direction:column;word-break:keep-all}
mark{background:linear-gradient(transparent 58%,var(--gold) 58%);color:inherit;padding:0 4px}
.bub{position:absolute;border-radius:50%;background:var(--aqua);pointer-events:none}
.spark{position:absolute;background:var(--gold);clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)}
.top{position:absolute;top:66px;left:96px;right:96px;display:flex;justify-content:space-between;align-items:center;font-size:26px;font-weight:700;color:var(--muted);z-index:2}
.top .brand{display:flex;gap:16px;align-items:center}
.top .brand b{font-family:"DLatin";font-weight:800;letter-spacing:.26em;color:var(--deep);font-size:24px}
.bottom{position:absolute;bottom:56px;left:96px;right:96px;display:flex;justify-content:space-between;font-size:24px;color:var(--muted);z-index:2}
.bottom .save{display:flex;align-items:center;gap:10px}
.bm{width:18px;height:24px;background:var(--deep);clip-path:polygon(0 0,100% 0,100% 100%,50% 75%,0 100%)}
.bottom .handle{font-weight:700;color:var(--deep)}
h2{font-weight:900;font-size:68px;line-height:1.3;letter-spacing:-.02em;margin-bottom:56px;position:relative;z-index:1}
p.body{font-size:42px;line-height:1.65;color:#2E4A57;position:relative;z-index:1}
.hl{margin-top:auto;background:var(--soft);border-radius:36px;padding:52px 56px;font-size:46px;line-height:1.55;font-weight:700;position:relative}
.hl .spark{width:44px;height:44px;top:-18px;right:48px}
.deco .bub{opacity:.25}
/* cover */
.cover{background:var(--soft);justify-content:center}
.cover .kicker{display:inline-block;align-self:flex-start;background:var(--deep);color:#fff;font-weight:700;font-size:34px;padding:14px 32px;border-radius:999px;margin-bottom:56px;position:relative;z-index:1}
.cover h1{font-weight:900;font-size:108px;line-height:1.24;letter-spacing:-.035em;position:relative;z-index:1}
.cover .sub{margin-top:56px;font-size:44px;color:#2E4A57;line-height:1.5;position:relative;z-index:1}
/* checklist */
ul.check{list-style:none;display:flex;flex-direction:column;gap:22px;position:relative;z-index:1}
ul.check li{display:flex;align-items:center;gap:30px;background:var(--white);border:3px solid var(--soft);border-radius:26px;padding:24px 34px;font-size:39px;line-height:1.35}
ul.check li i{flex:none;width:46px;height:46px;border:4px solid var(--deep);border-radius:14px}
/* result */
.tiers{display:flex;flex-direction:column;gap:26px}
.tier{display:flex;align-items:center;gap:36px;background:var(--soft);border-radius:30px;padding:40px 44px}
.tier .r{flex:none;width:210px;font-size:40px;font-weight:900;color:var(--deep)}
.tier .l{font-size:44px;font-weight:900;margin-bottom:8px}
.tier .d{font-size:34px;color:#3D5966;line-height:1.45}
.tier:nth-child(3){background:var(--deep);color:#fff}.tier:nth-child(3) .r,.tier:nth-child(3) .d{color:#fff}
.note{margin-top:auto;font-size:30px;color:var(--muted);line-height:1.55;padding-top:30px}
/* steps */
ol.steps{list-style:none;display:flex;flex-direction:column;gap:30px;position:relative;z-index:1}
ol.steps li{display:flex;gap:34px;align-items:flex-start}
ol.steps .n{flex:none;width:78px;height:78px;border-radius:50%;background:var(--deep);color:#fff;font-family:"DLatin";font-size:36px;font-weight:800;display:flex;align-items:center;justify-content:center}
ol.steps .t{font-size:44px;font-weight:700;line-height:1.35;padding-top:8px}
ol.steps .d{font-size:34px;color:#3D5966;line-height:1.5;margin-top:6px}
.time{display:inline-block;align-self:flex-start;background:var(--gold);color:var(--ink);font-weight:900;font-size:30px;padding:8px 26px;border-radius:999px;margin:-28px 0 44px}
.tips{margin-top:auto;background:var(--soft);border-radius:32px;padding:40px 48px}
.tips b{display:block;font-size:34px;color:var(--deep);margin-bottom:18px}
.tips div{font-size:36px;line-height:1.7}
/* table */
table{width:100%;border-collapse:separate;border-spacing:0;border-radius:28px;overflow:hidden;font-size:32px;border:3px solid var(--soft)}
th{background:var(--deep);color:#fff;font-weight:700;padding:26px 12px}
td{padding:30px 12px;text-align:center;border-top:3px solid var(--soft);color:#2E4A57}
/* dont */
.dont{display:flex;flex-direction:column;gap:24px}
.dont div{display:flex;align-items:center;gap:30px;font-size:42px;font-weight:700;background:var(--soft);border-radius:26px;padding:32px 36px}
.dont div i{flex:none;width:54px;height:54px;border-radius:50%;background:var(--ink);position:relative}
.dont div i::before,.dont div i::after{content:'';position:absolute;left:13px;top:24px;width:28px;height:6px;background:#fff;border-radius:3px;transform:rotate(45deg)}
.dont div i::after{transform:rotate(-45deg)}
.warn{margin-top:auto;border:4px solid var(--deep);border-radius:32px;padding:40px 48px;font-size:36px;line-height:1.6}
.warn b{color:var(--deep)}
/* cta */
.cta{background:var(--deep);color:#fff;justify-content:center;align-items:center;text-align:center}
.cta .bub{background:#fff}
.cta .bigbm{width:96px;height:128px;background:#fff;clip-path:polygon(0 0,100% 0,100% 100%,50% 75%,0 100%);margin-bottom:64px;position:relative;z-index:1}
.cta .line{font-weight:900;font-size:78px;line-height:1.38;letter-spacing:-.02em;position:relative;z-index:1}
.cta .ask{margin-top:92px;font-size:40px;opacity:.92;position:relative;z-index:1}
.cta .kw{margin-top:28px;background:var(--gold);color:var(--ink);font-size:56px;font-weight:900;padding:28px 60px;border-radius:999px;position:relative;z-index:1}
.cta .shop{position:absolute;bottom:72px;left:0;right:0;display:flex;flex-direction:column;gap:8px;align-items:center}
.cta .shop b{font-family:"DLatin";font-weight:800;letter-spacing:.3em;font-size:30px}
.cta .shop span{font-size:30px;font-weight:700;opacity:.92}
.cta .top,.cta .bottom{display:none}
`;

const COVER_DECO = `<i class="bub" style="width:640px;height:640px;right:-200px;bottom:-180px;opacity:.45"></i>
  <i class="bub" style="width:180px;height:180px;right:330px;bottom:400px;opacity:.55"></i>
  <i class="bub" style="width:70px;height:70px;right:170px;bottom:620px;opacity:.7"></i>
  <i class="bub" style="width:40px;height:40px;left:110px;top:230px;opacity:.6"></i>
  <i class="spark" style="width:64px;height:64px;right:150px;top:210px"></i>
  <i class="spark" style="width:34px;height:34px;right:280px;top:330px"></i>
  <i class="spark" style="width:42px;height:42px;left:620px;bottom:250px"></i>`;
const PAGE_DECO = `<div class="deco"><i class="bub" style="width:220px;height:220px;right:-70px;top:-60px"></i>
  <i class="bub" style="width:60px;height:60px;right:170px;top:110px"></i></div>`;
const CTA_DECO = `<i class="bub" style="width:520px;height:520px;left:-180px;top:-160px;opacity:.10"></i>
  <i class="bub" style="width:300px;height:300px;right:-90px;bottom:220px;opacity:.10"></i>
  <i class="bub" style="width:60px;height:60px;right:220px;top:240px;opacity:.25"></i>
  <i class="spark" style="width:60px;height:60px;left:170px;top:300px"></i>
  <i class="spark" style="width:36px;height:36px;right:170px;top:420px"></i>
  <i class="spark" style="width:44px;height:44px;right:260px;bottom:330px"></i>`;

function inner(c, set) {
  switch (c.type) {
    case 'cover': return `${COVER_DECO}<span class="kicker">${esc(c.kicker)}</span><h1>${esc(c.title)}</h1><div class="sub">${esc(c.sub)}</div>`;
    case 'text': return `${PAGE_DECO}<h2>${esc(c.heading)}</h2><p class="body">${esc(c.body)}</p><div class="hl"><i class="spark"></i>${esc(c.highlight)}</div>`;
    case 'checklist':
    case 'tipsCard': return `${PAGE_DECO}<h2>${esc(c.heading)}</h2><ul class="check">${c.items.map(i => `<li><i></i>${esc(i)}</li>`).join('')}</ul>`;
    case 'result': return `${PAGE_DECO}<h2>${esc(c.heading)}</h2><div class="tiers">${c.tiers.map(t =>
      `<div class="tier"><div class="r">${esc(t.range)}</div><div><div class="l">${esc(t.label)}</div><div class="d">${esc(t.desc)}</div></div></div>`).join('')}</div>
      <div class="note">※ ${esc(c.note)}</div>`;
    case 'steps': return `${PAGE_DECO}<h2>${esc(c.heading)}</h2>${c.time ? `<span class="time">${esc(c.time)}</span>` : ''}
      <ol class="steps">${c.steps.map((s, i) => `<li><span class="n">${i + 1}</span><div><div class="t">${esc(s.t)}</div>${s.d ? `<div class="d">${esc(s.d)}</div>` : ''}</div></li>`).join('')}</ol>
      ${c.note ? `<div class="note">※ ${esc(c.note)}</div>` : ''}
      ${c.tips ? `<div class="tips"><b>생활 팁</b>${c.tips.map(t => `<div>· ${esc(t)}</div>`).join('')}</div>` : ''}`;
    case 'table': return `${PAGE_DECO}<h2>${esc(c.heading)}</h2><table><tr>${c.cols.map(h => `<th>${esc(h)}</th>`).join('')}</tr>
      ${c.rows.map(r => `<tr>${r.map(d => `<td>${esc(d)}</td>`).join('')}</tr>`).join('')}</table>
      <div class="hl" style="font-size:38px"><i class="spark"></i>${esc(c.note)}</div>`;
    case 'dont': return `${PAGE_DECO}<h2>${esc(c.heading)}</h2><div class="dont">${c.items.map(i => `<div><i></i>${esc(i)}</div>`).join('')}</div>
      <div class="warn"><b>이런 경우엔</b><br>${esc(c.warn)}</div>`;
    case 'cta': return `${CTA_DECO}<div class="bigbm"></div><div class="line">${esc(c.line)}</div>
      <div class="ask">${esc(c.ask)} 댓글에</div><div class="kw">'${esc(set.keyword)}' 남겨주세요</div>
      <div class="shop"><b>DIVASKIN</b><span>${BRAND.handle}</span></div>`;
  }
}

(async () => {
  const outDir = path.join(__dirname, 'out');
  fs.rmSync(outDir, { recursive: true, force: true });
  let html = `<html><head><meta charset="utf-8"><style>${css}</style></head><body>`;
  for (const set of sets) {
    const total = String(set.cards.length).padStart(2, '0');
    set.cards.forEach((c, i) => {
      const no = String(i + 1).padStart(2, '0');
      const cls = c.type === 'cover' ? 'cover' : c.type === 'cta' ? 'cta' : '';
      html += `<section class="card ${cls}" data-id="${set.slug}/${no}">
        <div class="top"><span class="brand"><b>DIVASKIN</b>피부노트 · ${esc(set.tag)}</span><span>${no} / ${total}</span></div>
        ${inner(c, set)}
        <div class="bottom"><span class="save"><span class="bm"></span>저장해두고 다시 보기</span><span class="handle">${BRAND.handle}</span></div></section>`;
    });
  }
  html += '</body></html>';
  fs.writeFileSync(path.join(__dirname, 'cards.html'), html);

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(__dirname, 'cards.html'));
  await page.evaluate(() => document.fonts.ready);
  // 본문이 하단 푸터 영역(아래 120px)을 침범하는지 검사
  const issues = await page.$$eval('.card:not(.cta)', els => els.map(e => {
    const lim = e.getBoundingClientRect().bottom - 120, bad = [];
    e.querySelectorAll('h1,h2,p,li,.hl,.tier,.note,.tips,table,.warn,.dont div,.sub').forEach(k => {
      if (k.getBoundingClientRect().bottom > lim) bad.push(k.className || k.tagName);
    });
    return bad.length ? e.dataset.id + ': ' + [...new Set(bad)].join(',') : null;
  }).filter(Boolean));
  console.log('overflow:', issues.length ? issues : 'none');
  const cards = await page.$$('.card');
  for (const c of cards) {
    const f = path.join(outDir, (await c.getAttribute('data-id')) + '.png');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    await c.screenshot({ path: f });
  }
  await browser.close();
  fs.rmSync(path.join(__dirname, 'cards.html'));
  console.log('rendered', cards.length);
})();
