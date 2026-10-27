# 디바스킨 콘텐츠 렌더러

카드뉴스와 릴스를 코드로 만들어요. 규칙은 `brand/CONTENT_GUIDE.md`, 브랜드 색은 `content/brand.js`를 따라요.

| 폴더 | 내용 | 결과물 |
|---|---|---|
| `cardnews/` | 카드뉴스 6종 (문구는 `data.js`) | `out/주제/01~06.png` (1080×1350), `preview/` |
| `reel/` | 붓기 15초 릴스 (`film.html`, 음악 `audio.js`) | `디바스킨_붓기_릴스.mp4` (1080×1920) |

## 다시 만들기
```bash
cd content
npm install
npm run cards                      # 카드뉴스 36장 + 미리보기
FFMPEG_PATH=/경로/ffmpeg npm run reel   # 릴스 (ffmpeg 필요)
```
문구를 고칠 때는 `cardnews/data.js`만 바꾸면 돼요. `[[글자]]`는 골드 형광펜 강조예요.
