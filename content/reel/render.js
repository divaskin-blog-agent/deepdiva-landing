// 릴스 렌더러: film.html의 seek(t)를 프레임마다 호출해 캡처 → ffmpeg로 영상+음악 합성
// 실행: `node reel/audio.js && node reel/render.js full`  (미리보기: `node reel/render.js probe 1.6 5.9 14`)
// ffmpeg가 PATH에 없으면 FFMPEG_PATH 환경변수로 경로를 지정해요.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');
const FPS = 30, DUR = 15, FF = process.env.FFMPEG_PATH || 'ffmpeg';
const mode = process.argv[2] || 'full';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'film.html'));
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(__dirname, mode === 'probe' ? 'probe' : 'frames');
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
  const times = mode === 'probe' ? process.argv.slice(3).map(Number) : [...Array(FPS * DUR).keys()].map(f => f / FPS);
  for (let i = 0; i < times.length; i++) {
    await page.evaluate(t => seek(t), times[i]);
    await page.screenshot({ path: path.join(out, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 93 });
  }
  await browser.close();
  if (mode === 'probe') return console.log('probe frames:', times.join(', '));
  const mp4 = path.join(__dirname, '디바스킨_붓기_릴스.mp4');
  execFileSync(FF, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(out, '%04d.jpg'), '-i', path.join(__dirname, 'audio.wav'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', mp4]);
  fs.rmSync(out, { recursive: true, force: true });
  console.log('wrote', mp4);
})();
