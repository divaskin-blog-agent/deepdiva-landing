// 15초 배경음 합성 (외부 음원 없음): 120BPM, Cmaj7–G–Am–F 패드 + 아르페지오 + 부드러운 킥 + 장면 전환 효과음
const fs = require('fs');
const SR = 44100, DUR = 15, N = SR * DUR, BEAT = 0.5;
const HITS = [2, 4, 6.5, 9, 11]; // film.html의 장면 시작 시각과 같아야 해요
const L = new Float32Array(N), R = new Float32Array(N);
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [[48, 52, 55, 59], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]];
const add = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan); R[i] += v * (1 + pan); } };

for (let bar = 0; bar < 8; bar++) {
  const ch = CHORDS[bar % 4], t0 = bar * 2;
  for (const m of ch) for (const det of [-0.08, 0.08]) {
    const f = hz(m + 12) * (1 + det / 100);
    for (let i = Math.floor(t0 * SR); i < Math.min(N, (t0 + 2.3) * SR); i++) {
      const t = i / SR - t0, env = Math.min(1, t / 0.4) * Math.min(1, Math.max(0, (2.3 - t) / 0.5));
      add(i, 0.018 * env * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)), det);
    }
  }
}
for (let k = 0; k < DUR / (BEAT / 2); k++) {
  const t0 = k * BEAT / 2, ch = CHORDS[Math.floor(t0 / 2) % 4];
  const f = hz(ch[[0, 2, 1, 3, 2, 1, 3, 2][k % 8]] + 24);
  for (let i = 0; i < SR * 0.6; i++) {
    const t = i / SR, env = Math.exp(-t * 7);
    add(Math.floor(t0 * SR) + i, 0.05 * env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 20)), k % 2 ? 0.3 : -0.3);
  }
}
for (let b = 4; b < 28; b++) {
  const t0 = b * BEAT;
  for (let i = 0; i < SR * 0.35; i++) {
    const t = i / SR, f = 50 + 70 * Math.exp(-t * 30);
    add(Math.floor(t0 * SR) + i, 0.22 * Math.exp(-t * 9) * Math.sin(2 * Math.PI * f * t));
  }
}
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
for (const hit of HITS) {
  let lp = 0;
  for (let i = Math.floor((hit - 0.45) * SR); i < (hit + 0.15) * SR; i++) {
    const t = i / SR - (hit - 0.45), env = t < 0.45 ? Math.pow(t / 0.45, 2) : Math.exp(-(t - 0.45) * 25);
    lp += (rnd() - lp) * (0.05 + 0.3 * Math.min(1, t / 0.45));
    add(i, 0.12 * env * lp);
  }
}
// 반짝임 효과음 (CTA 키워드 등장)
for (const [t0, f] of [[12.9, 2093], [13.0, 2637], [13.1, 3136]]) {
  for (let i = 0; i < SR * 0.5; i++) { const t = i / SR; add(Math.floor(t0 * SR) + i, 0.04 * Math.exp(-t * 8) * Math.sin(2 * Math.PI * f * t), 0.2); }
}
let peak = 0;
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / (SR * 0.05)) * Math.min(1, (N - i) / (SR * 1.2));
  L[i] *= g; R[i] *= g; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(L[i] / peak * 0.89 * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] / peak * 0.89 * 32767), 46 + i * 4);
}
fs.writeFileSync(__dirname + '/audio.wav', buf);
console.log('audio.wav written');
