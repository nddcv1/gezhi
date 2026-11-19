# 格致明理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个只含精选学术内容的「学习版 bilibili」安卓 App，在荣耀 Magic8 上安装运行，具备每日信息流、系统通知、每日一题卡片与简洁庄重的视觉。

**Architecture:** Vite + React + TypeScript 单页应用（hash 路由、本地 JSON 内容库、Preferences 持久化），Capacitor 7 打包为安卓 APK；bilibili 公开接口仅在原生端做元数据补充，失败静默回退；GitHub Actions 构建签名 APK 并发布 Release。

**Tech Stack:** React 18、TypeScript、Vite 6、Vitest 2、Capacitor 7（core/android/preferences/local-notifications/browser/app）、sharp（图标生成）、fonttools（字体子集）。

**Spec:** `docs/superpowers/specs/2026-11-19-gezhi-mingli-design.md`

## Global Constraints

- 项目根目录 `D:\gezhi`（Windows Git Bash；命令使用 Unix 语法）。仓库已 `git init`（main 分支，已有 spec 提交）。
- 包名 `io.github.nddcv.gezhi`；App 名「格致明理」；minSdk 24、targetSdk 35、compileSdk 35。
- 本机 git 无 user 身份：所有 commit 使用
  `git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "..."`
  （不修改任何 git 配置文件）。
- 不引入 UI 框架、不加载外部图片、无登录、无遥测、无第三方统计。
- 唯一网络请求：`GET https://api.bilibili.com/x/web-interface/view?bvid=...`，仅原生端、24h 缓存、失败回退。
- 视觉 token：`--paper:#F7F4EE; --paper-2:#FBF9F4; --ink:#1F1B16; --ink-2:#5A5248; --ink-3:#8A8175; --line:#DED7C9; --cinnabar:#8C2F28; --ok:#3E5C46`。
- 六个学科 id 固定：`math | physics | cs | econ | philosophy | humanities`；难度固定：`入门 | 进阶 | 硬核`。
- 每个任务结束前必须 `npm test` 通过、`npm run build` 通过，再 commit。
- Node 版本 24（本机已装）；CI 使用 JDK 21 + Android SDK。

---

### Task 1: 项目脚手架与格式化工具

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`
- Create: `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`, `src/styles/tokens.css`, `src/styles/base.css`
- Create: `src/lib/format.ts`, `src/lib/format.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: npm 脚本 `dev/build/test/verify:content/icons/fonts`；`formatView(n?: number): string`、`formatDuration(sec?: number): string`、`formatDate(d: Date): string`

- [ ] **Step 1: 写入脚手架文件**

`package.json`：

```json
{
  "name": "gezhi",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify:content": "node scripts/verify-content.mjs",
    "icons": "node scripts/gen-icons.mjs",
    "fonts": ".venv-tools/Scripts/python.exe scripts/subset_fonts.py"
  },
  "dependencies": {
    "@capacitor/android": "^7.0.0",
    "@capacitor/app": "^7.0.0",
    "@capacitor/browser": "^7.0.0",
    "@capacitor/core": "^7.0.0",
    "@capacitor/local-notifications": "^7.0.0",
    "@capacitor/preferences": "^7.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.0.0",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "sharp": "^0.33.5",
    "typescript": "~5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "vite.config.ts"]
}
```

`vite.config.ts`：

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

`index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#F7F4EE" />
    <meta name="color-scheme" content="light" />
    <title>格致明理</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`.gitignore`：

```
node_modules/
dist/
.venv-tools/
.cache/
.keys/
android/.gradle/
android/local.properties
android/app/gezhi-release.keystore
*.log
```

`src/test/setup.ts`：

```ts
import '@testing-library/jest-dom/vitest'
```

`src/main.tsx`：

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/tokens.css'
import './styles/base.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx`（临时最小版，Task 5 替换）：

```tsx
export function App() {
  return <div className="app"><main className="app-main"><h1>格致明理</h1></main></div>
}
```

`src/styles/tokens.css`：

```css
:root {
  --paper: #F7F4EE;
  --paper-2: #FBF9F4;
  --ink: #1F1B16;
  --ink-2: #5A5248;
  --ink-3: #8A8175;
  --line: #DED7C9;
  --cinnabar: #8C2F28;
  --cinnabar-weak: #B55A4F;
  --ok: #3E5C46;
  --math: #EFE7DA;
  --physics: #E7EBE3;
  --cs: #E4E9EC;
  --econ: #EFE4DC;
  --philosophy: #E9E4EC;
  --humanities: #EAE7DF;
  --font-serif: 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
  --font-ui: system-ui, -apple-system, 'HarmonyOS Sans SC', 'PingFang SC', sans-serif;
  --radius: 2px;
  --page-pad: 20px;
}
```

`src/styles/base.css`：

```css
@font-face {
  font-family: 'Noto Serif SC';
  src: url('/fonts/NotoSerifSC-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Noto Serif SC';
  src: url('/fonts/NotoSerifSC-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-display: swap;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--font-serif); font-weight: 600; margin: 0; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; background: none; border: none; padding: 0; cursor: pointer; }
ul, ol { margin: 0; padding: 0; list-style: none; }
hr.rule { border: none; border-top: 1px solid var(--line); margin: 16px 0; }
.muted { color: var(--ink-3); }
.app { min-height: 100dvh; display: flex; flex-direction: column; }
.app-main { flex: 1; padding: 0 var(--page-pad) 88px; max-width: 560px; margin: 0 auto; width: 100%; }
.page-head { padding: 28px 0 12px; }
.page-title { font-size: 26px; letter-spacing: 0.06em; }
.page-sub { color: var(--ink-3); font-size: 12px; letter-spacing: 0.2em; margin-top: 4px; }
.seal {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: 1.5px solid var(--cinnabar);
  color: var(--cinnabar); font-family: var(--font-serif); font-weight: 600;
  font-size: 16px; border-radius: var(--radius); line-height: 1;
}
.btn-primary { display: block; width: 100%; background: var(--cinnabar); color: #FBF9F4; padding: 13px 16px; border-radius: var(--radius); font-size: 15px; letter-spacing: 0.12em; text-align: center; }
.btn-primary:disabled { opacity: 0.6; }
.btn-ghost { display: inline-block; border: 1px solid var(--line); padding: 9px 16px; border-radius: var(--radius); color: var(--ink-2); }
.text-btn { color: var(--cinnabar); font-size: 13px; }
.card { display: block; background: var(--paper-2); border: 1px solid var(--line); border-radius: var(--radius); margin-bottom: 16px; overflow: hidden; }
.cover { display: flex; flex-direction: column; justify-content: space-between; padding: 14px 16px; min-height: 108px; }
.cover-title { font-family: var(--font-serif); font-weight: 600; font-size: 17px; line-height: 1.5; margin-top: 12px; }
.cover-math { background: var(--math); }
.cover-physics { background: var(--physics); }
.cover-cs { background: var(--cs); }
.cover-econ { background: var(--econ); }
.cover-philosophy { background: var(--philosophy); }
.cover-humanities { background: var(--humanities); }
.card-body { padding: 12px 16px 14px; border-top: 1px solid var(--line); }
.card-title { font-size: 16px; line-height: 1.5; }
.card-meta { color: var(--ink-3); font-size: 12px; margin: 4px 0 0; }
.card-desc { color: var(--ink-2); font-size: 13px; margin: 6px 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tabbar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; background: var(--paper); border-top: 1px solid var(--line); padding: 6px 0 calc(6px + env(safe-area-inset-bottom)); z-index: 10; }
.tab { flex: 1; text-align: center; font-size: 13px; letter-spacing: 0.3em; padding: 8px 0; color: var(--ink-3); }
.tab.is-active { color: var(--cinnabar); }
.tag { display: inline-block; font-size: 11px; border: 1px solid var(--line); color: var(--ink-2); padding: 1px 6px; border-radius: var(--radius); margin-right: 6px; }
.backbar { display: flex; align-items: center; gap: 12px; padding: 20px 0 8px; }
.backbar-title { font-family: var(--font-serif); font-size: 15px; color: var(--ink-2); }
.empty { color: var(--ink-3); text-align: center; padding: 48px 0; font-size: 14px; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 24px 0 12px; }
.section-title { font-size: 17px; letter-spacing: 0.1em; }
.input, .select { width: 100%; background: var(--paper-2); border: 1px solid var(--line); border-radius: var(--radius); padding: 10px 12px; font: inherit; color: var(--ink); }
.label { display: block; font-size: 12px; letter-spacing: 0.2em; color: var(--ink-3); margin: 16px 0 6px; }
```

- [ ] **Step 2: 安装依赖**

Run: `npm install`
Expected: 成功生成 `package-lock.json`，无 ERESOLVE 错误。

- [ ] **Step 3: 写失败的格式化测试**

`src/lib/format.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { formatDate, formatDuration, formatView } from './format'

describe('formatView', () => {
  it('renders raw numbers below 10k', () => {
    expect(formatView(9999)).toBe('9999')
  })
  it('renders 万 with one decimal', () => {
    expect(formatView(25400)).toBe('2.5万')
    expect(formatView(20000)).toBe('2万')
  })
  it('renders 亿 with one decimal', () => {
    expect(formatView(130000000)).toBe('1.3亿')
  })
  it('renders empty for missing values', () => {
    expect(formatView(undefined)).toBe('')
  })
})

describe('formatDuration', () => {
  it('renders mm:ss', () => {
    expect(formatDuration(95)).toBe('1:35')
  })
  it('renders h:mm:ss', () => {
    expect(formatDuration(3725)).toBe('1:02:05')
  })
  it('renders empty for missing values', () => {
    expect(formatDuration(undefined)).toBe('')
  })
})

describe('formatDate', () => {
  it('formats chinese date with weekday', () => {
    expect(formatDate(new Date(2026, 10, 19))).toBe('2026年11月19日 星期四')
  })
})
```

- [ ] **Step 4: 运行测试确认失败**

Run: `npm test -- src/lib/format.test.ts`
Expected: FAIL（Cannot find module './format'）

- [ ] **Step 5: 实现 format.ts**

`src/lib/format.ts`：

```ts
export function formatView(n?: number): string {
  if (n == null || !Number.isFinite(n)) return ''
  if (n >= 1e8) return `${(n / 1e8).toFixed(1).replace(/\.0$/, '')}亿`
  if (n >= 1e4) return `${(n / 1e4).toFixed(1).replace(/\.0$/, '')}万`
  return String(n)
}

export function formatDuration(sec?: number): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return ''
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDate(d: Date): string {
  const week = '日一二三四五六'
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week[d.getDay()]}`
}
```

- [ ] **Step 6: 运行测试与构建**

Run: `npm test && npm run build`
Expected: 所有测试 PASS；`tsc --noEmit` 与 vite build 成功。

- [ ] **Step 7: 提交**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html .gitignore src
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: scaffold gezhi web app with formatting utilities"
```

---

### Task 2: 类型、偏好存储与内容合并

**Files:**
- Create: `src/lib/types.ts`, `src/data/subjects.ts`, `src/data/content.json`（初始为空库）
- Create: `src/lib/prefs.ts`, `src/lib/prefs.test.ts`, `src/lib/merge.ts`, `src/lib/merge.test.ts`
- Create: `src/test/fixtures.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `types.ts`：`SubjectId`、`Level`、`VideoItem`、`Question`、`Settings`、`WatchedEntry`、`MetaCacheEntry`、`Prefs`
  - `data/subjects.ts`：`SUBJECTS: SubjectDef[]`、`subjectName(id: SubjectId): string`
  - `lib/prefs.ts`：`PREFS_KEY`、`defaultPrefs(): Prefs`、`validatePrefs(raw: unknown): Prefs`、`loadPrefs(): Promise<Prefs>`、`savePrefs(p: Prefs): Promise<void>`
  - `lib/merge.ts`：`mergeItems(builtin: VideoItem[], prefs: Prefs): VideoItem[]`
  - `test/fixtures.ts`：`makeItem(partial)`、`makeItems()`、`sampleQuestions`

- [ ] **Step 1: 写类型与学科定义**

`src/lib/types.ts`：

```ts
export type SubjectId = 'math' | 'physics' | 'cs' | 'econ' | 'philosophy' | 'humanities'
export type Level = '入门' | '进阶' | '硬核'

export interface VideoItem {
  id: string
  bvid?: string
  url?: string
  title: string
  upName: string
  subject: SubjectId
  level: Level
  tags: string[]
  description: string
  curatedAt?: string
  addedAt?: number
  curated?: boolean
}

export interface Question {
  id: string
  subject: SubjectId
  question: string
  answer: string
}

export interface Settings {
  enrichEnabled: boolean
  notifyEnabled: boolean
  notifyTime: string
}

export interface WatchedEntry {
  id: string
  at: number
}

export interface MetaCacheEntry {
  fetchedAt: number
  title?: string
  view?: number
  duration?: number
}

export interface Prefs {
  version: 1
  addedItems: VideoItem[]
  removedIds: string[]
  bookmarks: string[]
  watched: WatchedEntry[]
  settings: Settings
  onboarded: boolean
  metaCache: Record<string, MetaCacheEntry>
}
```

`src/data/subjects.ts`：

```ts
import type { SubjectId } from '../lib/types'

export interface SubjectDef {
  id: SubjectId
  name: string
  seal: string
}

export const SUBJECTS: SubjectDef[] = [
  { id: 'math', name: '数学', seal: '數' },
  { id: 'physics', name: '物理', seal: '物' },
  { id: 'cs', name: '计算机', seal: '機' },
  { id: 'econ', name: '经济', seal: '經' },
  { id: 'philosophy', name: '哲学', seal: '哲' },
  { id: 'humanities', name: '人文', seal: '文' },
]

export function subjectName(id: SubjectId): string {
  return SUBJECTS.find(s => s.id === id)?.name ?? id
}
```

`src/data/content.json`（初始空库，Task 3 填充）：

```json
{
  "version": 1,
  "items": []
}
```

`src/test/fixtures.ts`：

```ts
import type { Question, VideoItem } from '../lib/types'

export function makeItem(partial: Partial<VideoItem> & Pick<VideoItem, 'id' | 'subject'>): VideoItem {
  return {
    title: `标题-${partial.id}`,
    upName: '测试UP',
    level: '入门',
    tags: [],
    description: '测试简介',
    ...partial,
  }
}

export function makeItems(): VideoItem[] {
  const items: VideoItem[] = []
  const subjects = ['math', 'physics', 'cs'] as const
  for (const subject of subjects) {
    for (let i = 0; i < 4; i++) {
      items.push(makeItem({ id: `${subject}-${i}`, subject }))
    }
  }
  return items
}

export const sampleQuestions: Question[] = Array.from({ length: 30 }, (_, i) => ({
  id: `q${i}`,
  subject: 'math' as const,
  question: `问题${i}`,
  answer: `答案${i}`,
}))
```

- [ ] **Step 2: 写失败的 prefs 测试**

`src/lib/prefs.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { defaultPrefs, validatePrefs } from './prefs'

describe('validatePrefs', () => {
  it('returns defaults for garbage input', () => {
    expect(validatePrefs('not an object')).toEqual(defaultPrefs())
    expect(validatePrefs(null)).toEqual(defaultPrefs())
    expect(validatePrefs(42)).toEqual(defaultPrefs())
  })

  it('keeps valid fields and fills missing settings', () => {
    const prefs = validatePrefs({
      bookmarks: ['a', 3, 'b'],
      settings: { notifyTime: '07:30', enrichEnabled: false },
    })
    expect(prefs.bookmarks).toEqual(['a', 'b'])
    expect(prefs.settings.notifyTime).toBe('07:30')
    expect(prefs.settings.enrichEnabled).toBe(false)
    expect(prefs.settings.notifyEnabled).toBe(true)
  })

  it('drops invalid notifyTime', () => {
    expect(validatePrefs({ settings: { notifyTime: '25:99' } }).settings.notifyTime).toBe('20:00')
    expect(validatePrefs({ settings: { notifyTime: '' } }).settings.notifyTime).toBe('20:00')
  })

  it('limits watched to 100 newest entries and drops invalid ones', () => {
    const watched = Array.from({ length: 120 }, (_, i) => ({ id: `w${i}`, at: i }))
    const prefs = validatePrefs({ watched: [...watched, { id: 'bad' }, null] })
    expect(prefs.watched).toHaveLength(100)
    expect(prefs.watched[0].id).toBe('w0')
  })

  it('sanitizes metaCache entries', () => {
    const prefs = validatePrefs({
      metaCache: {
        BV1xx411c7mD: { fetchedAt: 1000, title: 't', view: 5, duration: 60 },
        broken: { title: 'no timestamp' },
        alsoBroken: 'x',
      },
    })
    expect(prefs.metaCache.BV1xx411c7mD).toEqual({ fetchedAt: 1000, title: 't', view: 5, duration: 60 })
    expect(prefs.metaCache.broken).toBeUndefined()
    expect(prefs.metaCache.alsoBroken).toBeUndefined()
  })

  it('drops malformed added items but keeps valid ones', () => {
    const prefs = validatePrefs({
      addedItems: [
        { id: 'x1', title: 't', upName: 'u', subject: 'math', level: '入门', tags: [], description: 'd', url: 'https://example.com' },
        { id: 'x2', title: 't', subject: 'nope', level: '入门' },
        { title: 'no id' },
      ],
    })
    expect(prefs.addedItems.map(i => i.id)).toEqual(['x1'])
  })
})
```

- [ ] **Step 3: 运行确认失败**

Run: `npm test -- src/lib/prefs.test.ts`
Expected: FAIL（Cannot find module './prefs'）

- [ ] **Step 4: 实现 prefs.ts**

`src/lib/prefs.ts`：

```ts
import { Preferences } from '@capacitor/preferences'
import type { Level, MetaCacheEntry, Prefs, SubjectId, VideoItem, WatchedEntry } from './types'

export const PREFS_KEY = 'gezhi.prefs.v1'

const SUBJECT_IDS: SubjectId[] = ['math', 'physics', 'cs', 'econ', 'philosophy', 'humanities']
const LEVELS: Level[] = ['入门', '进阶', '硬核']
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function defaultPrefs(): Prefs {
  return {
    version: 1,
    addedItems: [],
    removedIds: [],
    bookmarks: [],
    watched: [],
    settings: { enrichEnabled: true, notifyEnabled: true, notifyTime: '20:00' },
    onboarded: false,
    metaCache: {},
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isVideoItem(v: unknown): v is VideoItem {
  if (!isRecord(v)) return false
  return (
    typeof v.id === 'string' && v.id.length > 0 &&
    typeof v.title === 'string' && v.title.length > 0 &&
    typeof v.upName === 'string' &&
    SUBJECT_IDS.includes(v.subject as SubjectId) &&
    LEVELS.includes(v.level as Level) &&
    Array.isArray(v.tags) && v.tags.every(t => typeof t === 'string') &&
    typeof v.description === 'string' &&
    (typeof v.bvid === 'string' || typeof v.url === 'string') &&
    (v.bvid === undefined || /^BV[0-9A-Za-z]{10}$/.test(v.bvid as string))
  )
}

function isWatched(v: unknown): v is WatchedEntry {
  return isRecord(v) && typeof v.id === 'string' && typeof v.at === 'number'
}

function sanitizeMeta(raw: unknown): Record<string, MetaCacheEntry> {
  if (!isRecord(raw)) return {}
  const out: Record<string, MetaCacheEntry> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value) || typeof value.fetchedAt !== 'number') continue
    const entry: MetaCacheEntry = { fetchedAt: value.fetchedAt }
    if (typeof value.title === 'string') entry.title = value.title
    if (typeof value.view === 'number') entry.view = value.view
    if (typeof value.duration === 'number') entry.duration = value.duration
    out[key] = entry
  }
  return out
}

export function validatePrefs(raw: unknown): Prefs {
  const d = defaultPrefs()
  if (!isRecord(raw)) return d
  const settings = isRecord(raw.settings) ? raw.settings : {}
  return {
    version: 1,
    addedItems: Array.isArray(raw.addedItems) ? raw.addedItems.filter(isVideoItem) : [],
    removedIds: Array.isArray(raw.removedIds) ? raw.removedIds.filter((x): x is string => typeof x === 'string') : [],
    bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks.filter((x): x is string => typeof x === 'string') : [],
    watched: Array.isArray(raw.watched) ? raw.watched.filter(isWatched).slice(0, 100) : [],
    settings: {
      enrichEnabled: typeof settings.enrichEnabled === 'boolean' ? settings.enrichEnabled : d.settings.enrichEnabled,
      notifyEnabled: typeof settings.notifyEnabled === 'boolean' ? settings.notifyEnabled : d.settings.notifyEnabled,
      notifyTime: typeof settings.notifyTime === 'string' && TIME_RE.test(settings.notifyTime) ? settings.notifyTime : d.settings.notifyTime,
    },
    onboarded: raw.onboarded === true,
    metaCache: sanitizeMeta(raw.metaCache),
  }
}

export async function loadPrefs(): Promise<Prefs> {
  const { value } = await Preferences.get({ key: PREFS_KEY })
  if (!value) return defaultPrefs()
  try {
    return validatePrefs(JSON.parse(value))
  } catch {
    return defaultPrefs()
  }
}

export async function savePrefs(p: Prefs): Promise<void> {
  await Preferences.set({ key: PREFS_KEY, value: JSON.stringify(p) })
}
```

- [ ] **Step 5: 运行 prefs 测试**

Run: `npm test -- src/lib/prefs.test.ts`
Expected: PASS

- [ ] **Step 6: 写失败的 merge 测试并实现**

`src/lib/merge.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { mergeItems } from './merge'
import { defaultPrefs } from './prefs'
import { makeItem, makeItems } from '../test/fixtures'

describe('mergeItems', () => {
  it('returns builtin items by default', () => {
    const builtin = makeItems()
    expect(mergeItems(builtin, defaultPrefs())).toEqual(builtin)
  })

  it('filters removed builtin items', () => {
    const builtin = makeItems()
    const prefs = { ...defaultPrefs(), removedIds: ['math-0'] }
    const result = mergeItems(builtin, prefs)
    expect(result).toHaveLength(11)
    expect(result.find(i => i.id === 'math-0')).toBeUndefined()
  })

  it('appends user-added items', () => {
    const builtin = makeItems()
    const added = makeItem({ id: 'user-1', subject: 'math', title: '用户添加' })
    const prefs = { ...defaultPrefs(), addedItems: [added] }
    expect(mergeItems(builtin, prefs).at(-1)).toEqual(added)
  })

  it('prefers the user-added copy on id conflict', () => {
    const builtin = [makeItem({ id: 'dup', subject: 'math', title: '内置' })]
    const added = makeItem({ id: 'dup', subject: 'math', title: '用户' })
    const prefs = { ...defaultPrefs(), addedItems: [added] }
    const result = mergeItems(builtin, prefs)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('用户')
  })
})
```

`src/lib/merge.ts`：

```ts
import type { Prefs, VideoItem } from './types'

export function mergeItems(builtin: VideoItem[], prefs: Prefs): VideoItem[] {
  const removed = new Set(prefs.removedIds)
  const addedIds = new Set(prefs.addedItems.map(i => i.id))
  const base = builtin.filter(i => !removed.has(i.id) && !addedIds.has(i.id))
  return [...base, ...prefs.addedItems]
}
```

- [ ] **Step 7: 运行全部测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS，构建成功。

- [ ] **Step 8: 提交**

```bash
git add src/lib/types.ts src/lib/prefs.ts src/lib/prefs.test.ts src/lib/merge.ts src/lib/merge.test.ts src/data/subjects.ts src/data/content.json src/test/fixtures.ts
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: add content types, prefs validation and item merging"
```

---

### Task 3: 内容调研、精选库与 BV 校验

**Files:**
- Create: `scripts/bili-search.mjs`, `scripts/verify-content.mjs`
- Modify: `src/data/content.json`（填充 60–90 条）
- Create: `src/data/content.test.ts`

**Interfaces:**
- Consumes: `data/content.json` 结构（Task 2）
- Produces: 校验通过的 `content.json`（6 学科各 ≥10 条）；`npm run verify:content`；`bili-search.mjs` 命令行工具

- [ ] **Step 1: 写 BV 校验脚本**

`scripts/verify-content.mjs`：

```js
import { readFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const file = new URL('../src/data/content.json', import.meta.url)
const data = JSON.parse(readFileSync(file, 'utf8'))
const sleep = ms => new Promise(r => setTimeout(r, ms))

let errors = 0
for (const item of data.items) {
  if (!item.bvid) {
    console.log(`SKIP  ${item.id}  (no bvid)`)
    continue
  }
  if (!/^BV[0-9A-Za-z]{10}$/.test(item.bvid)) {
    console.log(`BAD   ${item.id}  invalid bvid format: ${item.bvid}`)
    errors++
    continue
  }
  if (item.id !== item.bvid.toLowerCase()) {
    console.log(`BAD   ${item.id}  id must equal bvid.toLowerCase()`)
    errors++
  }
  try {
    const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${item.bvid}`, {
      headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
    })
    const json = await res.json()
    if (json.code !== 0) {
      console.log(`DEAD  ${item.bvid}  code=${json.code}  ${item.title}`)
      errors++
    } else {
      console.log(`OK    ${item.bvid}  ${json.data.title}`)
    }
  } catch (err) {
    console.log(`ERR   ${item.bvid}  ${err.message}`)
    errors++
  }
  await sleep(1200)
}

console.log(`\n${data.items.length} items, ${errors} error(s)`)
process.exit(errors > 0 ? 1 : 0)
```

- [ ] **Step 2: 写 bilibili 搜索脚本（wbi 签名）**

`scripts/bili-search.mjs`：

```js
import crypto from 'node:crypto'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const MIXIN = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]
let cookie = ''

async function nav() {
  const res = await fetch('https://api.bilibili.com/x/web-interface/nav', { headers: { 'User-Agent': UA } })
  const setCookies = res.headers.getSetCookie?.() ?? []
  cookie = setCookies.map(c => c.split(';')[0]).join('; ')
  const json = await res.json()
  const img = json.data?.wbi_img?.img_url?.split('/').pop()?.split('.')[0] ?? ''
  const sub = json.data?.wbi_img?.sub_url?.split('/').pop()?.split('.')[0] ?? ''
  if (!img || !sub) throw new Error('wbi keys not found')
  return { img, sub }
}

function sign(params, imgKey, subKey) {
  const key = MIXIN.map(i => (imgKey + subKey)[i]).slice(0, 32).join('')
  const query = Object.keys(params).sort().map(k => {
    const v = String(params[k]).replace(/[!'()*]/g, '')
    return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
  }).join('&')
  const w_rid = crypto.createHash('md5').update(query + key).digest('hex')
  return `${query}&w_rid=${w_rid}`
}

async function search(keyword) {
  const { img, sub } = await nav()
  const params = { search_type: 'video', keyword, page: 1, page_size: 20 }
  const query = sign({ ...params, wts: Math.floor(Date.now() / 1000) }, img, sub)
  const res = await fetch(`https://api.bilibili.com/x/web-interface/wbi/search/type?${query}`, {
    headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/', Cookie: cookie },
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(`search failed: code=${json.code} ${json.message ?? ''}`)
  return (json.data?.result ?? []).map(v => ({
    bvid: v.bvid,
    title: String(v.title).replace(/<[^>]+>/g, ''),
    author: v.author,
    duration: v.duration,
    play: v.play,
  }))
}

const keyword = process.argv.slice(2).join(' ')
if (!keyword) {
  console.error('usage: node scripts/bili-search.mjs 关键词')
  process.exit(1)
}
const results = await search(keyword)
for (const r of results) console.log(`${r.bvid}\t${r.author}\t${r.play}\t${r.title}`)
```

- [ ] **Step 3: 运行搜索，收集候选**

对每个学科运行 2–3 个查询，每次间隔 ≥ 2 秒（`sleep 2`）：

```bash
node scripts/bili-search.mjs 数学分析 课程
sleep 2
node scripts/bili-search.mjs 高等数学 系统课程
sleep 2
node scripts/bili-search.mjs 线性代数 完整课程
node scripts/bili-search.mjs 概率论 公开课
node scripts/bili-search.mjs 大学物理 课程
node scripts/bili-search.mjs 量子力学 公开课
node scripts/bili-search.mjs 理论力学 课程
node scripts/bili-search.mjs 数据结构 课程
node scripts/bili-search.mjs 操作系统 课程
node scripts/bili-search.mjs 计算机网络 课程
node scripts/bili-search.mjs 编译原理 课程
node scripts/bili-search.mjs 经济学原理 课程
node scripts/bili-search.mjs 宏观经济学 公开课
node scripts/bili-search.mjs 博弈论 公开课
node scripts/bili-search.mjs 哲学导论 课程
node scripts/bili-search.mjs 西方哲学史 课程
node scripts/bili-search.mjs 逻辑学 课程
node scripts/bili-search.mjs 中国通史 课程
node scripts/bili-search.mjs 世界史 公开课
node scripts/bili-search.mjs 文学理论 课程
```

若搜索接口返回 412 或 code 非 0（风控），改用 WebSearch 检索「bilibili 数学分析 课程」等，直接收集结果中的 `bilibili.com/video/BV...` 链接；BV 全部以 `verify-content.mjs` 为准。

- [ ] **Step 4: 人工筛选并写入 content.json**

筛选标准（每条都必须满足）：
- 系统课程 / 完整公开课 / 名校课堂 / 严肃科普讲座；
- 排除：切片、reaction、影视解说、营销号、娱乐杂谈、单条短视频；
- 优先选中播放量高、合集完整的课程；同一 UP 主每科最多 3 条。

每个学科写 10–15 条，总数 60–90。字段要求：

```jsonc
{
  "id": "bv1xx411c7md",                 // bvid 的小写形式
  "bvid": "BV1xx411c7mD",
  "title": "（B 站实际视频标题，去掉 <em> 等标签；可做轻微精简）",
  "upName": "UP 主名",
  "subject": "math",
  "level": "入门",
  "tags": ["数学分析", "系统课"],
  "description": "（自写 1–2 句推荐语，说明讲什么、适合谁，不复制简介）",
  "curatedAt": "2026-11-19"
}
```

`level` 判断：入门=零基础/教材同步；进阶=需要先修基础；硬核=理论深入/证明密集。

- [ ] **Step 5: 校验 BV 全部有效**

Run: `npm run verify:content`
Expected: 最后输出 `x items, 0 error(s)`；有 DEAD/BAD/ERR 时替换条目后重跑，直至 0。

- [ ] **Step 6: 写内容库结构测试**

`src/data/content.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import content from './content.json'

const items = content.items as Array<{
  id: string
  bvid?: string
  url?: string
  title: string
  upName: string
  subject: string
  level: string
  tags: string[]
  description: string
}>

const SUBJECTS = ['math', 'physics', 'cs', 'econ', 'philosophy', 'humanities']
const LEVELS = ['入门', '进阶', '硬核']

describe('content library', () => {
  it('has at least 60 items', () => {
    expect(items.length).toBeGreaterThanOrEqual(60)
  })

  it('covers every subject with at least 10 items', () => {
    for (const subject of SUBJECTS) {
      expect(items.filter(i => i.subject === subject).length).toBeGreaterThanOrEqual(10)
    }
  })

  it('uses unique ids and valid levels', () => {
    expect(new Set(items.map(i => i.id)).size).toBe(items.length)
    for (const item of items) {
      expect(LEVELS).toContain(item.level)
      expect(item.title.length).toBeGreaterThan(0)
      expect(item.upName.length).toBeGreaterThan(0)
      expect(item.description.length).toBeGreaterThan(0)
      expect(item.tags.length).toBeGreaterThan(0)
      expect(item.bvid || item.url).toBeTruthy()
      if (item.bvid) {
        expect(item.id).toBe(item.bvid.toLowerCase())
      }
    }
  })
})
```

- [ ] **Step 7: 运行测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS。

- [ ] **Step 8: 提交**

```bash
git add scripts/bili-search.mjs scripts/verify-content.mjs src/data/content.json src/data/content.test.ts
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: curate verified academic content library for six subjects"
```

---

### Task 4: 每日一题、每日轮换与信息流排序

**Files:**
- Create: `src/data/daily.json`, `src/data/index.ts`, `src/data/daily.test.ts`
- Create: `src/lib/rotation.ts`, `src/lib/rotation.test.ts`

**Interfaces:**
- Consumes: `VideoItem`、`Question`、`Prefs`（Task 2）
- Produces:
  - `data/index.ts`：`builtinItems: readonly VideoItem[]`、`questions: readonly Question[]`
  - `lib/rotation.ts`：`daySeed(date: Date): number`、`mulberry32(seed: number): () => number`、`seededShuffle<T>(items, rng): T[]`、`noTriples<T>(items, key): T[]`、`preferredSubjects(items, prefs): Set<SubjectId>`、`dailyFeed(items, prefs, date): VideoItem[]`、`dailyCourse(items, prefs, date): VideoItem | null`、`dailyQuestion(questions, date): Question`

- [ ] **Step 1: 写 30 道自编题目**

`src/data/daily.json` 格式：

```json
{
  "version": 1,
  "questions": [
    {
      "id": "q001",
      "subject": "math",
      "question": "用 ε-δ 语言写出「函数 f 在 x₀ 处连续」的定义。",
      "answer": "对任意 ε>0，存在 δ>0，使得当 |x−x₀|<δ 时，|f(x)−f(x₀)|<ε。"
    },
    {
      "id": "q002",
      "subject": "math",
      "question": "数列 {1/n} 有界吗？收敛吗？极限是多少？",
      "answer": "有界（0<1/n≤1），单调递减，收敛于 0。"
    },
    {
      "id": "q003",
      "subject": "cs",
      "question": "哈希表在什么情况下查找会从 O(1) 退化？常用什么方法缓解？",
      "answer": "大量冲突时退化为 O(n)；通过扩容、改进哈希函数、开放寻址/链地址优化来缓解。"
    }
  ]
}
```

按下列配额补齐到恰好 30 题（全部自编，不复制教材或网络原文；题干 ≤120 字；答案给出结果+一句思路）：
- `math` 15 题（数学分析/线性代数/概率各 5 左右）
- `physics` 6 题（估算、守恒律、基本概念）
- `philosophy` 5 题（逻辑推理、论证分析）
- `cs` 4 题（复杂度、数据结构、算法思想）

- [ ] **Step 2: 写数据索引与题目结构测试**

`src/data/index.ts`：

```ts
import type { Question, VideoItem } from '../lib/types'
import rawContent from './content.json'
import rawDaily from './daily.json'

export const builtinItems: readonly VideoItem[] = (rawContent as unknown as { items: VideoItem[] }).items
export const questions: readonly Question[] = (rawDaily as unknown as { questions: Question[] }).questions
```

`src/data/daily.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { questions } from './index'

describe('daily questions', () => {
  it('has exactly 30 questions', () => {
    expect(questions).toHaveLength(30)
  })

  it('has unique ids and non-empty text', () => {
    expect(new Set(questions.map(q => q.id)).size).toBe(30)
    for (const q of questions) {
      expect(q.question.trim().length).toBeGreaterThan(0)
      expect(q.question.length).toBeLessThanOrEqual(120)
      expect(q.answer.trim().length).toBeGreaterThan(0)
    }
  })

  it('meets subject quotas', () => {
    const count = (s: string) => questions.filter(q => q.subject === s).length
    expect(count('math')).toBe(15)
    expect(count('physics')).toBe(6)
    expect(count('philosophy')).toBe(5)
    expect(count('cs')).toBe(4)
  })
})
```

- [ ] **Step 3: 写失败的 rotation 测试**

`src/lib/rotation.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import {
  dailyCourse, dailyFeed, dailyQuestion, daySeed, mulberry32, noTriples, preferredSubjects, seededShuffle,
} from './rotation'
import { defaultPrefs } from './prefs'
import { makeItem, makeItems, sampleQuestions } from '../test/fixtures'

const dateA = new Date(2026, 10, 19)
const dateB = new Date(2026, 10, 20)

describe('daySeed', () => {
  it('is 0 on the epoch day and increments daily', () => {
    expect(daySeed(new Date(2026, 0, 1))).toBe(0)
    expect(daySeed(new Date(2026, 0, 2))).toBe(1)
  })
})

describe('mulberry32 / seededShuffle', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('shuffles deterministically while keeping all elements', () => {
    const items = makeItems().map(i => i.id)
    const r1 = seededShuffle(items, mulberry32(7))
    const r2 = seededShuffle(items, mulberry32(7))
    expect(r1).toEqual(r2)
    expect([...r1].sort()).toEqual([...items].sort())
  })
})

describe('noTriples', () => {
  it('never leaves three equal keys in a row', () => {
    const items = ['a', 'a', 'a', 'b', 'b', 'b', 'c']
    const out = noTriples(items, x => x)
    expect(out.sort()).toEqual([...items].sort())
    for (let i = 2; i < out.length; i++) {
      const triple = out[i] === out[i - 1] && out[i] === out[i - 2]
      expect(triple).toBe(false)
    }
  })
})

describe('preferredSubjects', () => {
  it('collects subjects of bookmarked and watched items', () => {
    const items = makeItems()
    const prefs = {
      ...defaultPrefs(),
      bookmarks: ['math-0'],
      watched: [{ id: 'physics-1', at: 1 }],
    }
    const set = preferredSubjects(items, prefs)
    expect(set.has('math')).toBe(true)
    expect(set.has('physics')).toBe(true)
    expect(set.has('cs')).toBe(false)
  })
})

describe('dailyFeed', () => {
  const items = makeItems()

  it('is deterministic for the same date and prefs', () => {
    expect(dailyFeed(items, defaultPrefs(), dateA).map(i => i.id))
      .toEqual(dailyFeed(items, defaultPrefs(), dateA).map(i => i.id))
  })

  it('changes with the date', () => {
    expect(dailyFeed(items, defaultPrefs(), dateA).map(i => i.id))
      .not.toEqual(dailyFeed(items, defaultPrefs(), dateB).map(i => i.id))
  })

  it('keeps at most two consecutive items from one subject', () => {
    const feed = dailyFeed(items, defaultPrefs(), dateA)
    for (let i = 2; i < feed.length; i++) {
      const triple = feed[i].subject === feed[i - 1].subject && feed[i].subject === feed[i - 2].subject
      expect(triple).toBe(false)
    }
  })

  it('promotes preferred subjects into the first half', () => {
    const prefs = { ...defaultPrefs(), bookmarks: ['math-0'] }
    const feed = dailyFeed(items, prefs, dateA)
    const half = Math.ceil(feed.length / 2)
    const mathPositions = feed
      .map((item, idx) => (item.subject === 'math' ? idx : -1))
      .filter(idx => idx >= 0)
    expect(mathPositions.every(idx => idx < half)).toBe(true)
  })

  it('dailyCourse returns the first feed item', () => {
    const feed = dailyFeed(items, defaultPrefs(), dateA)
    expect(dailyCourse(items, defaultPrefs(), dateA)?.id).toBe(feed[0].id)
  })
})

describe('dailyQuestion', () => {
  it('covers all 30 questions over 30 consecutive days', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 30; i++) {
      ids.add(dailyQuestion(sampleQuestions, new Date(2026, 10, 19 + i)).id)
    }
    expect(ids.size).toBe(30)
  })

  it('is deterministic for the same day', () => {
    expect(dailyQuestion(sampleQuestions, dateA).id).toBe(dailyQuestion(sampleQuestions, dateA).id)
  })
})
```

- [ ] **Step 4: 运行确认失败**

Run: `npm test -- src/lib/rotation.test.ts`
Expected: FAIL（Cannot find module './rotation'）

- [ ] **Step 5: 实现 rotation.ts**

`src/lib/rotation.ts`：

```ts
import type { Prefs, Question, SubjectId, VideoItem } from './types'

export const EPOCH_UTC = Date.UTC(2026, 0, 1)
const DAY_MS = 86_400_000

export function daySeed(date: Date): number {
  const localMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((localMidnight - EPOCH_UTC) / DAY_MS)
}

export function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function noTriples<T>(items: readonly T[], key: (t: T) => string): T[] {
  const remaining = [...items]
  const out: T[] = []
  while (remaining.length > 0) {
    let pick = 0
    const n = out.length
    if (n >= 2 && key(out[n - 1]) === key(out[n - 2])) {
      const k = remaining.findIndex(t => key(t) !== key(out[n - 1]))
      if (k >= 0) pick = k
    }
    out.push(remaining.splice(pick, 1)[0])
  }
  return out
}

export function preferredSubjects(items: readonly VideoItem[], prefs: Prefs): Set<SubjectId> {
  const marked = new Set<string>([...prefs.bookmarks, ...prefs.watched.map(w => w.id)])
  return new Set(items.filter(i => marked.has(i.id)).map(i => i.subject))
}

export function dailyFeed(items: readonly VideoItem[], prefs: Prefs, date: Date): VideoItem[] {
  const shuffled = seededShuffle(items, mulberry32(daySeed(date)))
  const preferred = preferredSubjects(items, prefs)
  const promoted: VideoItem[] = []
  const others: VideoItem[] = []
  for (const item of shuffled) {
    if (preferred.has(item.subject)) promoted.push(item)
    else others.push(item)
  }
  const half = Math.ceil(shuffled.length / 2)
  const result: VideoItem[] = []
  let p = 0
  let o = 0
  for (let idx = 0; idx < shuffled.length; idx++) {
    if (idx < half && p < promoted.length) result.push(promoted[p++])
    else if (o < others.length) result.push(others[o++])
    else result.push(promoted[p++])
  }
  return noTriples(result, i => i.subject)
}

export function dailyCourse(items: readonly VideoItem[], prefs: Prefs, date: Date): VideoItem | null {
  return dailyFeed(items, prefs, date)[0] ?? null
}

export function dailyQuestion(questions: readonly Question[], date: Date): Question {
  const seed = daySeed(date)
  const idx = ((seed % questions.length) + questions.length) % questions.length
  return questions[idx]
}
```

- [ ] **Step 6: 运行全部测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS（含 Task 2–4 的所有测试）。

- [ ] **Step 7: 提交**

```bash
git add src/data/daily.json src/data/index.ts src/data/daily.test.ts src/lib/rotation.ts src/lib/rotation.test.ts
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: add daily questions and deterministic feed rotation"
```

---

### Task 5: 应用壳、路由与全局状态

**Files:**
- Create: `src/lib/router.ts`, `src/lib/router.test.ts`, `src/lib/store.tsx`
- Create: `src/components/TabBar.tsx`, `src/components/BackBar.tsx`
- Create: `src/pages/TodayPage.tsx`, `SubjectsPage.tsx`, `SubjectPage.tsx`, `ItemDetailPage.tsx`, `MinePage.tsx`, `AddItemPage.tsx`, `SettingsPage.tsx`（均为可运行的初始版本，后续任务增强）
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `builtinItems`、`questions`（Task 4）；`mergeItems`、`defaultPrefs/loadPrefs/savePrefs`
- Produces:
  - `router.ts`：`Route`、`parseRoute(hash: string): Route`、`routeHash(route: Route): string`
  - `store.tsx`：`StoreProvider`、`useStore()`，actions：`toggleBookmark(id)`、`recordWatched(id)`、`addItem(item)`、`removeItem(id)`、`restoreAll()`、`updateSettings(partial)`、`setMeta(bvid, entry)`、`completeOnboarding()`
  - `TabBar`、`BackBar` 组件

- [ ] **Step 1: 写失败的路由测试**

`src/lib/router.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { parseRoute, routeHash } from './router'

describe('parseRoute', () => {
  it('defaults to today', () => {
    expect(parseRoute('')).toEqual({ name: 'today' })
    expect(parseRoute('#/unknown')).toEqual({ name: 'today' })
  })
  it('parses static routes', () => {
    expect(parseRoute('#/subjects')).toEqual({ name: 'subjects' })
    expect(parseRoute('#/mine')).toEqual({ name: 'mine' })
    expect(parseRoute('#/add')).toEqual({ name: 'add' })
    expect(parseRoute('#/settings')).toEqual({ name: 'settings' })
  })
  it('parses subject routes and rejects invalid subjects', () => {
    expect(parseRoute('#/subject/math')).toEqual({ name: 'subject', id: 'math' })
    expect(parseRoute('#/subject/nope')).toEqual({ name: 'subjects' })
  })
  it('parses item routes with decoding', () => {
    expect(parseRoute('#/item/BV1xx411c7mD')).toEqual({ name: 'item', id: 'BV1xx411c7mD' })
    expect(parseRoute('#/item/a%20b')).toEqual({ name: 'item', id: 'a b' })
  })
  it('round-trips through routeHash', () => {
    const routes = [
      { name: 'today' as const },
      { name: 'subjects' as const },
      { name: 'subject' as const, id: 'cs' as const },
      { name: 'item' as const, id: 'user-1' },
      { name: 'mine' as const },
    ]
    for (const route of routes) {
      expect(parseRoute(routeHash(route))).toEqual(route)
    }
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- src/lib/router.test.ts`
Expected: FAIL（Cannot find module './router'）

- [ ] **Step 3: 实现 router.ts**

`src/lib/router.ts`：

```ts
import { SUBJECTS } from '../data/subjects'
import type { SubjectId } from './types'

export type Route =
  | { name: 'today' }
  | { name: 'subjects' }
  | { name: 'subject'; id: SubjectId }
  | { name: 'item'; id: string }
  | { name: 'mine' }
  | { name: 'add' }
  | { name: 'settings' }

function isSubjectId(v: string): v is SubjectId {
  return SUBJECTS.some(s => s.id === v)
}

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [seg, ...rest] = raw.split('/')
  const id = rest.join('/')
  switch (seg) {
    case 'subjects':
      return { name: 'subjects' }
    case 'subject':
      return isSubjectId(id) ? { name: 'subject', id } : { name: 'subjects' }
    case 'item': {
      if (!id) return { name: 'today' }
      try {
        return { name: 'item', id: decodeURIComponent(id) }
      } catch {
        return { name: 'today' }
      }
    }
    case 'mine':
      return { name: 'mine' }
    case 'add':
      return { name: 'add' }
    case 'settings':
      return { name: 'settings' }
    default:
      return { name: 'today' }
  }
}

export function routeHash(route: Route): string {
  switch (route.name) {
    case 'today':
      return '#/today'
    case 'subjects':
      return '#/subjects'
    case 'subject':
      return `#/subject/${route.id}`
    case 'item':
      return `#/item/${encodeURIComponent(route.id)}`
    case 'mine':
      return '#/mine'
    case 'add':
      return '#/add'
    case 'settings':
      return '#/settings'
  }
}

export function navigate(route: Route): void {
  location.hash = routeHash(route)
}
```

- [ ] **Step 4: 实现 store.tsx**

`src/lib/store.tsx`：

```tsx
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { defaultPrefs, loadPrefs, savePrefs } from './prefs'
import type { MetaCacheEntry, Prefs, VideoItem } from './types'

interface StoreValue {
  prefs: Prefs
  ready: boolean
  toggleBookmark(id: string): void
  recordWatched(id: string): void
  addItem(item: VideoItem): void
  removeItem(id: string): void
  restoreAll(): void
  updateSettings(partial: Partial<Prefs['settings']>): void
  setMeta(bvid: string, entry: MetaCacheEntry): void
  completeOnboarding(): void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children, initialPrefs }: { children: ReactNode; initialPrefs?: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs ?? defaultPrefs())
  const [ready, setReady] = useState(Boolean(initialPrefs))
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || initialPrefs) return
    loaded.current = true
    loadPrefs()
      .then(p => {
        setPrefs(p)
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [initialPrefs])

  useEffect(() => {
    if (!ready) return
    void savePrefs(prefs).catch(() => undefined)
  }, [prefs, ready])

  const update = useCallback((fn: (p: Prefs) => Prefs) => setPrefs(fn), [])

  const value: StoreValue = {
    prefs,
    ready,
    toggleBookmark: useCallback((id: string) => update(p => ({
      ...p,
      bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter(b => b !== id) : [id, ...p.bookmarks],
    })), [update]),
    recordWatched: useCallback((id: string) => update(p => ({
      ...p,
      watched: [{ id, at: Date.now() }, ...p.watched.filter(w => w.id !== id)].slice(0, 100),
    })), [update]),
    addItem: useCallback((item: VideoItem) => update(p => ({
      ...p,
      addedItems: [item, ...p.addedItems.filter(i => i.id !== item.id)],
      removedIds: p.removedIds.filter(id => id !== item.id),
    })), [update]),
    removeItem: useCallback((id: string) => update(p => {
      const isAdded = p.addedItems.some(i => i.id === id)
      if (isAdded) return { ...p, addedItems: p.addedItems.filter(i => i.id !== id) }
      return { ...p, removedIds: p.removedIds.includes(id) ? p.removedIds : [...p.removedIds, id] }
    }), [update]),
    restoreAll: useCallback(() => update(p => ({ ...p, removedIds: [] })), [update]),
    updateSettings: useCallback((partial: Partial<Prefs['settings']>) => update(p => ({
      ...p,
      settings: { ...p.settings, ...partial },
    })), [update]),
    setMeta: useCallback((bvid: string, entry: MetaCacheEntry) => update(p => ({
      ...p,
      metaCache: { ...p.metaCache, [bvid]: entry },
    })), [update]),
    completeOnboarding: useCallback(() => update(p => ({ ...p, onboarded: true })), [update]),
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export { builtinItems, questions } from '../data'
```

- [ ] **Step 5: 实现 TabBar 与 BackBar**

`src/components/TabBar.tsx`：

```tsx
const TABS = [
  { id: 'today', label: '今日', href: '#/today' },
  { id: 'subjects', label: '学科', href: '#/subjects' },
  { id: 'mine', label: '我的', href: '#/mine' },
] as const

export function TabBar({ active }: { active: 'today' | 'subjects' | 'mine' }) {
  return (
    <nav className="tabbar">
      {TABS.map(tab => (
        <a key={tab.id} className={`tab${active === tab.id ? ' is-active' : ''}`} href={tab.href}>
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
```

`src/components/BackBar.tsx`：

```tsx
export function BackBar({ title }: { title: string }) {
  return (
    <header className="backbar">
      <button
        className="text-btn"
        onClick={() => {
          if (history.length > 1) history.back()
          else location.hash = '#/today'
        }}
      >
        ← 返回
      </button>
      <span className="backbar-title">{title}</span>
    </header>
  )
}
```

- [ ] **Step 6: 写页面初始版本**

`src/pages/TodayPage.tsx`：

```tsx
export function TodayPage() {
  return <div><header className="page-head"><h1 className="page-title">今日</h1></header></div>
}
```

`src/pages/SubjectsPage.tsx`：

```tsx
export function SubjectsPage() {
  return <div><header className="page-head"><h1 className="page-title">学科</h1></header></div>
}
```

`src/pages/SubjectPage.tsx`：

```tsx
import type { SubjectId } from '../lib/types'

export function SubjectPage({ id }: { id: SubjectId }) {
  return <div><header className="page-head"><h1 className="page-title">{id}</h1></header></div>
}
```

`src/pages/ItemDetailPage.tsx`：

```tsx
export function ItemDetailPage({ id }: { id: string }) {
  return <div><header className="page-head"><h1 className="page-title">{id}</h1></header></div>
}
```

`src/pages/MinePage.tsx`：

```tsx
export function MinePage() {
  return <div><header className="page-head"><h1 className="page-title">我的</h1></header></div>
}
```

`src/pages/AddItemPage.tsx`：

```tsx
export function AddItemPage() {
  return <div><header className="page-head"><h1 className="page-title">添加内容</h1></header></div>
}
```

`src/pages/SettingsPage.tsx`：

```tsx
export function SettingsPage() {
  return <div><header className="page-head"><h1 className="page-title">设置</h1></header></div>
}
```

- [ ] **Step 7: 完成 App 壳**

`src/App.tsx`：

```tsx
import { useEffect, useState, type ReactNode } from 'react'
import { StoreProvider } from './lib/store'
import { parseRoute, type Route } from './lib/router'
import { TabBar } from './components/TabBar'
import { TodayPage } from './pages/TodayPage'
import { SubjectsPage } from './pages/SubjectsPage'
import { SubjectPage } from './pages/SubjectPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { MinePage } from './pages/MinePage'
import { AddItemPage } from './pages/AddItemPage'
import { SettingsPage } from './pages/SettingsPage'

function Shell() {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash))

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  let page: ReactNode
  switch (route.name) {
    case 'today': page = <TodayPage />; break
    case 'subjects': page = <SubjectsPage />; break
    case 'subject': page = <SubjectPage id={route.id} />; break
    case 'item': page = <ItemDetailPage id={route.id} />; break
    case 'mine': page = <MinePage />; break
    case 'add': page = <AddItemPage />; break
    case 'settings': page = <SettingsPage />; break
  }

  const active =
    route.name === 'today' ? 'today'
    : route.name === 'subjects' || route.name === 'subject' ? 'subjects'
    : route.name === 'mine' ? 'mine'
    : null

  return (
    <div className="app">
      <main className="app-main">{page}</main>
      {active && <TabBar active={active} />}
    </div>
  )
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
```

- [ ] **Step 8: 运行测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS；构建成功。

- [ ] **Step 9: 提交**

```bash
git add src/lib/router.ts src/lib/router.test.ts src/lib/store.tsx src/components src/pages src/App.tsx
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: add app shell, hash router and global store"
```

---

### Task 6: 今日页（每日卡 + 信息流）

**Files:**
- Create: `src/components/VideoCard.tsx`, `src/components/DailyCard.tsx`
- Modify: `src/pages/TodayPage.tsx`
- Create: `src/styles/today.css`, `src/pages/TodayPage.test.tsx`

**Interfaces:**
- Consumes: `useStore`、`builtinItems`、`questions`、`mergeItems`、`dailyFeed/dailyCourse/dailyQuestion`、`formatDate/formatView/formatDuration`、`SUBJECTS`
- Produces: `VideoCard({ item, meta? })`、`DailyCard({ course, question })`

- [ ] **Step 1: 实现 VideoCard**

`src/components/VideoCard.tsx`：

```tsx
import type { MetaCacheEntry, VideoItem } from '../lib/types'
import { SUBJECTS } from '../data/subjects'
import { formatDuration, formatView } from '../lib/format'

export function VideoCard({ item, meta }: { item: VideoItem; meta?: MetaCacheEntry }) {
  const subject = SUBJECTS.find(s => s.id === item.subject)
  return (
    <a className="card" href={`#/item/${encodeURIComponent(item.id)}`}>
      <div className={`cover cover-${item.subject}`}>
        <span className="seal">{subject?.seal}</span>
        <span className="cover-title">{item.title.slice(0, 24)}</span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{item.title}</h3>
        <p className="card-meta">
          {item.upName} · {item.level}
          {meta?.duration ? ` · ${formatDuration(meta.duration)}` : ''}
          {meta?.view ? ` · ${formatView(meta.view)}播放` : ''}
        </p>
        <p className="card-desc">{item.description}</p>
      </div>
    </a>
  )
}
```

- [ ] **Step 2: 实现 DailyCard**

`src/components/DailyCard.tsx`：

```tsx
import { useState } from 'react'
import type { Question, VideoItem } from '../lib/types'

export function DailyCard({ course, question }: { course: VideoItem | null; question: Question }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="daily">
      <div>
        <span className="daily-label">今日一课</span>
        {course ? (
          <a className="daily-course-title" href={`#/item/${encodeURIComponent(course.id)}`}>{course.title}</a>
        ) : (
          <p className="muted">暂无内容</p>
        )}
      </div>
      <hr className="rule" />
      <div>
        <span className="daily-label">今日一题</span>
        <p className="question">{question.question}</p>
        <button className="text-btn" onClick={() => setOpen(v => !v)}>
          {open ? '收起答案' : '展开答案'}
        </button>
        {open && <p className="answer">{question.answer}</p>}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: 实现 TodayPage**

`src/pages/TodayPage.tsx`：

```tsx
import { useMemo } from 'react'
import { builtinItems, questions, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import { dailyCourse, dailyFeed, dailyQuestion } from '../lib/rotation'
import { DailyCard } from '../components/DailyCard'
import { VideoCard } from '../components/VideoCard'
import { formatDate } from '../lib/format'
import '../styles/today.css'

export function TodayPage() {
  const { prefs } = useStore()
  const now = new Date()
  const items = useMemo(() => mergeItems([...builtinItems], prefs), [prefs])
  const feed = useMemo(() => dailyFeed(items, prefs, now).slice(0, 20), [items, prefs])
  const course = dailyCourse(items, prefs, now)
  const question = dailyQuestion(questions, now)

  return (
    <div>
      <header className="page-head">
        <h1 className="page-title">今日</h1>
        <p className="page-sub">{formatDate(now)}</p>
      </header>
      <DailyCard course={course} question={question} />
      <div className="section-head">
        <h2 className="section-title">今日荐读</h2>
        <span className="muted">{feed.length} 条</span>
      </div>
      {feed.map(item => (
        <VideoCard key={item.id} item={item} meta={item.bvid ? prefs.metaCache[item.bvid] : undefined} />
      ))}
      {feed.length === 0 && <p className="empty">内容库为空，请先在「我的 → 添加内容」添加。</p>}
      <p className="feed-hint"><a className="text-btn" href="#/subjects">按学科浏览全部内容 →</a></p>
    </div>
  )
}
```

- [ ] **Step 4: 写 today.css**

`src/styles/today.css`：

```css
.daily { border: 1px solid var(--line); background: var(--paper-2); padding: 18px; margin-top: 16px; }
.daily-label { display: block; font-size: 11px; letter-spacing: 0.3em; color: var(--cinnabar); }
.daily-course-title { display: block; font-family: var(--font-serif); font-size: 18px; font-weight: 600; margin-top: 6px; line-height: 1.5; }
.question { font-family: var(--font-serif); font-size: 15px; margin: 8px 0; }
.answer { background: var(--paper); border-left: 2px solid var(--cinnabar); padding: 10px 12px; font-size: 13px; color: var(--ink-2); margin-top: 8px; }
.feed-hint { text-align: center; margin: 24px 0 8px; }
```

- [ ] **Step 5: 写页面测试**

`src/pages/TodayPage.test.tsx`：

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { StoreProvider, questions } from '../lib/store'
import { defaultPrefs } from '../lib/prefs'
import { dailyQuestion } from '../lib/rotation'
import { TodayPage } from './TodayPage'

function renderPage() {
  return render(
    <StoreProvider initialPrefs={defaultPrefs()}>
      <TodayPage />
    </StoreProvider>,
  )
}

describe('TodayPage', () => {
  it('renders the daily course and question card', () => {
    renderPage()
    expect(screen.getByText('今日一课')).toBeInTheDocument()
    expect(screen.getByText('今日一题')).toBeInTheDocument()
  })

  it('renders a non-empty feed of video links', () => {
    renderPage()
    const links = screen.getAllByRole('link').filter(a => a.getAttribute('href')?.startsWith('#/item/'))
    expect(links.length).toBeGreaterThan(0)
  })

  it('reveals the answer when asked', async () => {
    const user = userEvent.setup()
    renderPage()
    const expected = dailyQuestion(questions, new Date()).answer
    await user.click(screen.getByRole('button', { name: '展开答案' }))
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: 运行测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS。

- [ ] **Step 7: 提交**

```bash
git add src/components/VideoCard.tsx src/components/DailyCard.tsx src/pages/TodayPage.tsx src/pages/TodayPage.test.tsx src/styles/today.css
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: build today feed with daily card and typographic video cards"
```

---

### Task 7: 学科列表与学科详情

**Files:**
- Modify: `src/pages/SubjectsPage.tsx`, `src/pages/SubjectPage.tsx`
- Create: `src/styles/subjects.css`

**Interfaces:**
- Consumes: `SUBJECTS`、`subjectName`、`mergeItems`、`useStore`、`VideoCard`
- Produces: 完成版学科页；学科排序规则 `LEVEL_RANK`

- [ ] **Step 1: 实现 SubjectsPage**

`src/pages/SubjectsPage.tsx`：

```tsx
import { SUBJECTS } from '../data/subjects'
import { builtinItems, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import '../styles/subjects.css'

export function SubjectsPage() {
  const { prefs } = useStore()
  const items = mergeItems([...builtinItems], prefs)

  return (
    <div>
      <header className="page-head">
        <h1 className="page-title">学科</h1>
        <p className="page-sub">格物致知</p>
      </header>
      <ul className="subject-list">
        {SUBJECTS.map(subject => {
          const count = items.filter(i => i.subject === subject.id).length
          return (
            <li key={subject.id}>
              <a className={`subject-row subject-row-${subject.id}`} href={`#/subject/${subject.id}`}>
                <span className="seal">{subject.seal}</span>
                <span className="subject-name">{subject.name}</span>
                <span className="subject-count">{count} 条</span>
                <span className="subject-arrow">→</span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: 实现 SubjectPage**

`src/pages/SubjectPage.tsx`：

```tsx
import { SUBJECTS } from '../data/subjects'
import { builtinItems, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import { VideoCard } from '../components/VideoCard'
import { BackBar } from '../components/BackBar'
import type { Level, SubjectId } from '../lib/types'

const LEVEL_RANK: Record<Level, number> = { 入门: 0, 进阶: 1, 硬核: 2 }

export function SubjectPage({ id }: { id: SubjectId }) {
  const { prefs } = useStore()
  const subject = SUBJECTS.find(s => s.id === id)
  const items = mergeItems([...builtinItems], prefs)
    .filter(i => i.subject === id)
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.title.localeCompare(b.title, 'zh'))

  return (
    <div>
      <BackBar title="学科" />
      <header className="page-head">
        <h1 className="page-title">{subject?.name}</h1>
        <p className="page-sub">{items.length} 条精选 · 依难度排序</p>
      </header>
      {items.map(item => (
        <VideoCard key={item.id} item={item} meta={item.bvid ? prefs.metaCache[item.bvid] : undefined} />
      ))}
      {items.length === 0 && <p className="empty">该学科暂无内容。</p>}
    </div>
  )
}
```

- [ ] **Step 3: 写 subjects.css**

`src/styles/subjects.css`：

```css
.subject-list { border-top: 1px solid var(--line); }
.subject-row { display: flex; align-items: center; gap: 14px; padding: 16px 4px; border-bottom: 1px solid var(--line); }
.subject-name { font-family: var(--font-serif); font-size: 17px; font-weight: 600; flex: 1; }
.subject-count { color: var(--ink-3); font-size: 12px; }
.subject-arrow { color: var(--ink-3); }
.subject-row-math { background: linear-gradient(90deg, var(--math) 0%, transparent 60%); }
.subject-row-physics { background: linear-gradient(90deg, var(--physics) 0%, transparent 60%); }
.subject-row-cs { background: linear-gradient(90deg, var(--cs) 0%, transparent 60%); }
.subject-row-econ { background: linear-gradient(90deg, var(--econ) 0%, transparent 60%); }
.subject-row-philosophy { background: linear-gradient(90deg, var(--philosophy) 0%, transparent 60%); }
.subject-row-humanities { background: linear-gradient(90deg, var(--humanities) 0%, transparent 60%); }
```

- [ ] **Step 4: 运行测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/pages/SubjectsPage.tsx src/pages/SubjectPage.tsx src/styles/subjects.css
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: add subject index and subject detail pages"
```

---

### Task 8: BV 解析、bilibili 元数据补充与详情页

**Files:**
- Create: `src/lib/bvid.ts`, `src/lib/bvid.test.ts`
- Create: `src/lib/bilibili.ts`, `src/lib/bilibili.test.ts`
- Modify: `src/pages/ItemDetailPage.tsx`
- Create: `src/styles/detail.css`

**Interfaces:**
- Consumes: `useStore`、`mergeItems`、`Capacitor`、`CapacitorHttp`
- Produces:
  - `parseBvid(input: string): string | null`
  - `META_TTL_MS`、`isFresh(entry, now)`、`parseViewResponse(data, now)`、`enrichItem(bvid, deps)`、`nativeFetcher()`、`canEnrich(prefs)`、`serialOnce(fn, gapMs?)`
  - 完成版 `ItemDetailPage({ id })`

- [ ] **Step 1: 写失败的 bvid 测试**

`src/lib/bvid.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { parseBvid } from './bvid'

describe('parseBvid', () => {
  it('parses a bare BV id', () => {
    expect(parseBvid('BV1xx411c7mD')).toBe('BV1xx411c7mD')
  })
  it('parses a full video URL with query params', () => {
    expect(parseBvid('https://www.bilibili.com/video/BV1xx411c7mD/?p=2&t=3')).toBe('BV1xx411c7mD')
    expect(parseBvid('m.bilibili.com/video/BV1xx411c7mD')).toBe('BV1xx411c7mD')
  })
  it('rejects invalid input', () => {
    expect(parseBvid('')).toBeNull()
    expect(parseBvid('https://example.com/abc')).toBeNull()
    expect(parseBvid('BV123')).toBeNull()
  })
})
```

- [ ] **Step 2: 实现 bvid.ts 并跑测试**

`src/lib/bvid.ts`：

```ts
const BVID_RE = /BV[0-9A-Za-z]{10}/

export function parseBvid(input: string): string | null {
  const match = input.match(BVID_RE)
  return match ? match[0] : null
}
```

Run: `npm test -- src/lib/bvid.test.ts`
Expected: PASS

- [ ] **Step 3: 写失败的 bilibili 测试**

`src/lib/bilibili.test.ts`：

```ts
import { describe, expect, it, vi } from 'vitest'
import { enrichItem, isFresh, META_TTL_MS, parseViewResponse, serialOnce, type MetaFetcher } from './bilibili'

const now = 1_700_000_000_000

const validPayload = {
  code: 0,
  data: { title: '  数学分析 第一讲  ', duration: 3600, stat: { view: 123456 } },
}

describe('isFresh', () => {
  it('is fresh within 24h and stale after', () => {
    expect(isFresh({ fetchedAt: now - META_TTL_MS + 1 }, now)).toBe(true)
    expect(isFresh({ fetchedAt: now - META_TTL_MS }, now)).toBe(false)
    expect(isFresh(undefined, now)).toBe(false)
  })
})

describe('parseViewResponse', () => {
  it('extracts title, view and duration', () => {
    expect(parseViewResponse(validPayload, now)).toEqual({
      fetchedAt: now,
      title: '数学分析 第一讲',
      view: 123456,
      duration: 3600,
    })
  })
  it('returns null for error responses', () => {
    expect(parseViewResponse({ code: -404, message: '啥都木有' }, now)).toBeNull()
    expect(parseViewResponse({ code: 0, data: {} }, now)).toBeNull()
    expect(parseViewResponse('nope', now)).toBeNull()
  })
})

describe('enrichItem', () => {
  it('returns parsed metadata on success', async () => {
    const fetcher: MetaFetcher = vi.fn(async () => ({ status: 200, data: validPayload }))
    const entry = await enrichItem('BV1xx411c7mD', { fetcher, now: () => now })
    expect(entry?.title).toBe('数学分析 第一讲')
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it('returns null on HTTP failure or thrown errors', async () => {
    const failing: MetaFetcher = vi.fn(async () => ({ status: 500, data: null }))
    expect(await enrichItem('BV1xx411c7mD', { fetcher: failing, now: () => now })).toBeNull()
    const throwing: MetaFetcher = vi.fn(async () => { throw new Error('network') })
    expect(await enrichItem('BV1xx411c7mD', { fetcher: throwing, now: () => now })).toBeNull()
  })
})

describe('serialOnce', () => {
  it('keeps calls in order', async () => {
    const order: number[] = []
    const tasks = [0, 1, 2].map(n =>
      serialOnce(async () => {
        order.push(n)
        return n
      }, 0),
    )
    await Promise.all(tasks)
    expect(order).toEqual([0, 1, 2])
  })
})
```

- [ ] **Step 4: 运行确认失败**

Run: `npm test -- src/lib/bilibili.test.ts`
Expected: FAIL（Cannot find module './bilibili'）

- [ ] **Step 5: 实现 bilibili.ts**

`src/lib/bilibili.ts`：

```ts
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import type { MetaCacheEntry, Prefs } from './types'

export const META_TTL_MS = 24 * 60 * 60 * 1000

const UA =
  'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'

export interface MetaRequest {
  url: string
  headers: Record<string, string>
}

export type MetaFetcher = (req: MetaRequest) => Promise<{ status: number; data: unknown }>

export interface EnrichDeps {
  fetcher: MetaFetcher
  now: () => number
}

export function isFresh(entry: MetaCacheEntry | undefined, now: number): boolean {
  return !!entry && now - entry.fetchedAt < META_TTL_MS
}

export function parseViewResponse(data: unknown, now: number): MetaCacheEntry | null {
  if (typeof data !== 'object' || data === null) return null
  const payload = data as { code?: unknown; data?: { title?: unknown; duration?: unknown; stat?: { view?: unknown } } }
  if (payload.code !== 0 || typeof payload.data !== 'object' || payload.data === null) return null
  const title = typeof payload.data.title === 'string' && payload.data.title.trim() ? payload.data.title.trim() : undefined
  const duration = typeof payload.data.duration === 'number' && payload.data.duration > 0 ? payload.data.duration : undefined
  const view = typeof payload.data.stat?.view === 'number' ? payload.data.stat.view : undefined
  if (title === undefined && duration === undefined && view === undefined) return null
  const entry: MetaCacheEntry = { fetchedAt: now }
  if (title !== undefined) entry.title = title
  if (view !== undefined) entry.view = view
  if (duration !== undefined) entry.duration = duration
  return entry
}

export async function enrichItem(bvid: string, deps: EnrichDeps): Promise<MetaCacheEntry | null> {
  try {
    const res = await deps.fetcher({
      url: `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
      headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
    })
    if (res.status !== 200) return null
    return parseViewResponse(res.data, deps.now())
  } catch {
    return null
  }
}

export function nativeFetcher(): MetaFetcher {
  return async ({ url, headers }) => {
    const res = await CapacitorHttp.get({ url, headers, connectTimeout: 8000, readTimeout: 8000 })
    return { status: res.status, data: res.data }
  }
}

export function canEnrich(prefs: Prefs): boolean {
  return prefs.settings.enrichEnabled && Capacitor.isNativePlatform()
}

let chain: Promise<void> = Promise.resolve()
let lastAt = 0

export function serialOnce<T>(fn: () => Promise<T>, gapMs = 1000): Promise<T> {
  const run = chain.then(async () => {
    const wait = Math.max(0, lastAt + gapMs - Date.now())
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait))
    try {
      return await fn()
    } finally {
      lastAt = Date.now()
    }
  })
  chain = run.then(() => undefined, () => undefined)
  return run
}
```

- [ ] **Step 6: 运行 bilibili 测试**

Run: `npm test -- src/lib/bilibili.test.ts`
Expected: PASS

- [ ] **Step 7: 实现详情页**

`src/pages/ItemDetailPage.tsx`：

```tsx
import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { builtinItems, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import { canEnrich, enrichItem, isFresh, nativeFetcher, serialOnce } from '../lib/bilibili'
import { BackBar } from '../components/BackBar'
import { SUBJECTS } from '../data/subjects'
import { formatDuration, formatView } from '../lib/format'
import '../styles/detail.css'

export function ItemDetailPage({ id }: { id: string }) {
  const { prefs, toggleBookmark, recordWatched, removeItem, setMeta } = useStore()
  const items = mergeItems([...builtinItems], prefs)
  const item = items.find(i => i.id === id)
  const meta = item?.bvid ? prefs.metaCache[item.bvid] : undefined
  const recorded = useRef(false)

  useEffect(() => {
    if (item && !recorded.current) {
      recorded.current = true
      recordWatched(item.id)
    }
  }, [item, recordWatched])

  useEffect(() => {
    const bvid = item?.bvid
    if (!bvid || !canEnrich(prefs)) return
    if (isFresh(prefs.metaCache[bvid], Date.now())) return
    let cancelled = false
    serialOnce(() => enrichItem(bvid, { fetcher: nativeFetcher(), now: () => Date.now() }))
      .then(entry => {
        if (entry && !cancelled) setMeta(bvid, entry)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.bvid, prefs.settings.enrichEnabled])

  if (!item) {
    return (
      <div>
        <BackBar title="内容" />
        <p className="empty">内容不存在或已被移除。</p>
      </div>
    )
  }

  const bookmarked = prefs.bookmarks.includes(item.id)
  const isCurated = item.curated !== false
  const subject = SUBJECTS.find(s => s.id === item.subject)

  async function openVideo() {
    const url = item.bvid ? `https://www.bilibili.com/video/${item.bvid}` : item.url
    if (!url) return
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url }).catch(() => undefined)
    } else {
      window.open(url, '_blank', 'noopener')
    }
  }

  function hideOrDelete() {
    if (!window.confirm(isCurated ? '从列表中隐藏这条内容？' : '删除这条内容？')) return
    removeItem(item.id)
    location.hash = '#/mine'
  }

  return (
    <div>
      <BackBar title="内容" />
      <header className="detail-head">
        <span className={`seal detail-seal cover-${item.subject}`}>{subject?.seal}</span>
        <h1 className="detail-title">{item.title}</h1>
        <p className="detail-meta">
          {item.upName} · {subject?.name} · {item.level}
          {meta?.duration ? ` · ${formatDuration(meta.duration)}` : ''}
          {meta?.view ? ` · ${formatView(meta.view)}播放` : ''}
        </p>
        {meta?.title && meta.title !== item.title && <p className="detail-meta">B 站标题：{meta.title}</p>}
      </header>
      <p className="detail-desc">{item.description}</p>
      {item.tags.length > 0 && (
        <p className="detail-tags">{item.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}</p>
      )}
      <div className="detail-actions">
        <button className="btn-primary" onClick={openVideo}>去 bilibili 学习</button>
        <div className="detail-subactions">
          <button className="btn-ghost" onClick={() => toggleBookmark(item.id)}>{bookmarked ? '已收藏' : '收藏'}</button>
          <button className="text-btn hide-btn" onClick={hideOrDelete}>{isCurated ? '从列表隐藏' : '删除'}</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: 写 detail.css**

`src/styles/detail.css`：

```css
.detail-head { padding: 8px 0 16px; border-bottom: 1px solid var(--line); }
.detail-seal { margin-bottom: 12px; }
.detail-title { font-size: 22px; line-height: 1.5; }
.detail-meta { color: var(--ink-3); font-size: 12px; margin: 6px 0 0; }
.detail-desc { color: var(--ink-2); font-size: 14px; margin: 16px 0; }
.detail-tags { margin: 12px 0; }
.detail-actions { margin-top: 20px; }
.detail-subactions { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.hide-btn { color: var(--ink-3); }
```

- [ ] **Step 9: 运行测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS。

- [ ] **Step 10: 提交**

```bash
git add src/lib/bvid.ts src/lib/bvid.test.ts src/lib/bilibili.ts src/lib/bilibili.test.ts src/pages/ItemDetailPage.tsx src/styles/detail.css
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: add item detail page with bilibili metadata enrichment"
```

---

### Task 9: 添加内容页

**Files:**
- Modify: `src/pages/AddItemPage.tsx`
- Create: `src/pages/AddItemPage.test.tsx`, `src/styles/add.css`

**Interfaces:**
- Consumes: `parseBvid`、`useStore.addItem`、`SUBJECTS`、`BackBar`
- Produces: 完成版 `AddItemPage`

- [ ] **Step 1: 实现 AddItemPage**

`src/pages/AddItemPage.tsx`：

```tsx
import { useState, type FormEvent } from 'react'
import { BackBar } from '../components/BackBar'
import { SUBJECTS } from '../data/subjects'
import { builtinItems, useStore } from '../lib/store'
import { parseBvid } from '../lib/bvid'
import type { Level, SubjectId, VideoItem } from '../lib/types'
import '../styles/add.css'

const LEVELS: Level[] = ['入门', '进阶', '硬核']

export function AddItemPage() {
  const { addItem, prefs } = useStore()
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [upName, setUpName] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState<SubjectId>('math')
  const [level, setLevel] = useState<Level>('入门')
  const [message, setMessage] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    const trimmed = input.trim()
    if (!trimmed) {
      setMessage('请粘贴 BV 号或视频链接。')
      return
    }
    const bvid = parseBvid(trimmed)
    if (!bvid && !/^https?:\/\//.test(trimmed)) {
      setMessage('无法识别 BV 号，请输入完整的 bilibili 视频链接。')
      return
    }
    const finalTitle = title.trim() || bvid || ''
    if (!finalTitle) {
      setMessage('请填写标题。')
      return
    }
    const id = bvid ? bvid.toLowerCase() : `user-${Date.now().toString(36)}`
    const exists = builtinItems.some(i => i.id === id) || prefs.addedItems.some(i => i.id === id)
    if (exists) {
      setMessage('这条内容已经存在。')
      return
    }
    const item: VideoItem = {
      id,
      ...(bvid ? { bvid } : { url: trimmed }),
      title: finalTitle,
      upName: upName.trim() || '待补充',
      subject,
      level,
      tags: [],
      description: description.trim() || '用户添加的内容。',
      addedAt: Date.now(),
      curated: false,
    }
    addItem(item)
    setMessage('已添加，可在「我的」中查看。')
    setInput('')
    setTitle('')
  }

  return (
    <div>
      <BackBar title="添加内容" />
      <header className="page-head">
        <h1 className="page-title">添加内容</h1>
        <p className="page-sub">粘贴 BV 号或视频链接</p>
      </header>
      <form onSubmit={submit} className="add-form">
        <label className="label" htmlFor="add-input">BV 号 / 视频链接</label>
        <input id="add-input" className="input" value={input} onChange={e => setInput(e.target.value)} placeholder="BV1xx411c7mD 或 https://www.bilibili.com/video/..." />
        <label className="label" htmlFor="add-title">标题（可选）</label>
        <input id="add-title" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="课程名称" />
        <label className="label" htmlFor="add-up">UP 主（可选）</label>
        <input id="add-up" className="input" value={upName} onChange={e => setUpName(e.target.value)} placeholder="UP 主名" />
        <label className="label" htmlFor="add-subject">学科</label>
        <select id="add-subject" className="select" value={subject} onChange={e => setSubject(e.target.value as SubjectId)}>
          {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="label" htmlFor="add-level">难度</label>
        <select id="add-level" className="select" value={level} onChange={e => setLevel(e.target.value as Level)}>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <label className="label" htmlFor="add-desc">推荐语（可选）</label>
        <input id="add-desc" className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="一句话说明讲什么" />
        {message && <p className="form-message" role="status">{message}</p>}
        <button type="submit" className="btn-primary add-submit">添加</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: 写 add.css 与页面测试**

`src/styles/add.css`：

```css
.add-form { padding-bottom: 24px; }
.add-submit { margin-top: 24px; }
.form-message { color: var(--cinnabar); font-size: 13px; margin: 16px 0 0; }
```

`src/pages/AddItemPage.test.tsx`：

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { StoreProvider } from '../lib/store'
import { defaultPrefs } from '../lib/prefs'
import { AddItemPage } from './AddItemPage'

function renderPage() {
  return render(
    <StoreProvider initialPrefs={defaultPrefs()}>
      <AddItemPage />
    </StoreProvider>,
  )
}

describe('AddItemPage', () => {
  it('shows an error for empty input', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: '添加' }))
    expect(screen.getByRole('status')).toHaveTextContent('请粘贴 BV 号或视频链接')
  })

  it('adds a bilibili link and confirms', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('BV 号 / 视频链接'), 'https://www.bilibili.com/video/BV1AA411c7mD/?p=1')
    await user.click(screen.getByRole('button', { name: '添加' }))
    expect(screen.getByRole('status')).toHaveTextContent('已添加')
  })
})
```

- [ ] **Step 3: 运行测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS。

- [ ] **Step 4: 提交**

```bash
git add src/pages/AddItemPage.tsx src/pages/AddItemPage.test.tsx src/styles/add.css
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: add content page with BV parsing and validation"
```

---

### Task 10: 通知模块、设置页与我的页

**Files:**
- Create: `src/lib/notify.ts`, `src/lib/notify.test.ts`
- Modify: `src/pages/SettingsPage.tsx`, `src/pages/MinePage.tsx`
- Create: `src/styles/mine.css`, `src/styles/settings.css`

**Interfaces:**
- Consumes: `LocalNotifications`、`useStore`、`mergeItems`、`formatDate`
- Produces:
  - `notify.ts`：`next30Days(time: string, from: Date): Date[]`、`notificationId(d: Date): number`、`ensurePermission(): Promise<boolean>`、`cancelDaily(): Promise<void>`、`rescheduleDaily(settings: Settings, now?: Date): Promise<void>`、`sendTestNotification(): Promise<void>`、`ensureExactAlarm(): Promise<void>`
  - 完成版 `SettingsPage`、`MinePage`

- [ ] **Step 1: 写失败的 notify 测试**

`src/lib/notify.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { next30Days, notificationId } from './notify'

describe('next30Days', () => {
  it('starts today when the time has not passed yet', () => {
    const dates = next30Days('20:00', new Date(2026, 10, 19, 10, 0))
    expect(dates).toHaveLength(30)
    expect(dates[0]).toEqual(new Date(2026, 10, 19, 20, 0))
    expect(dates[29]).toEqual(new Date(2026, 11, 18, 20, 0))
  })

  it('starts tomorrow when the time already passed', () => {
    const dates = next30Days('09:00', new Date(2026, 10, 19, 10, 0))
    expect(dates[0]).toEqual(new Date(2026, 10, 20, 9, 0))
  })

  it('keeps every entry at the exact hour and minute', () => {
    for (const d of next30Days('07:05', new Date(2026, 10, 19, 6, 0))) {
      expect(d.getHours()).toBe(7)
      expect(d.getMinutes()).toBe(5)
    }
  })
})

describe('notificationId', () => {
  it('is stable per day and unique across days', () => {
    const a = notificationId(new Date(2026, 10, 19))
    const b = notificationId(new Date(2026, 10, 20))
    expect(a).toBe(20261119)
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- src/lib/notify.test.ts`
Expected: FAIL（Cannot find module './notify'）

- [ ] **Step 3: 实现 notify.ts**

`src/lib/notify.ts`：

```ts
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Settings } from './types'

const DAY_MS = 86_400_000

export function next30Days(time: string, from: Date): Date[] {
  const [hour, minute] = time.split(':').map(Number)
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate(), hour, minute, 0, 0)
  const first = today.getTime() <= from.getTime() ? new Date(today.getTime() + DAY_MS) : today
  return Array.from({ length: 30 }, (_, i) =>
    new Date(first.getFullYear(), first.getMonth(), first.getDate() + i, hour, minute, 0, 0),
  )
}

export function notificationId(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export async function ensurePermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const current = await LocalNotifications.checkPermissions()
  if (current.display === 'granted') return true
  const requested = await LocalNotifications.requestPermissions()
  return requested.display === 'granted'
}

export async function cancelDaily(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) })
  }
}

export async function rescheduleDaily(settings: Settings, now = new Date()): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await cancelDaily()
  if (!settings.notifyEnabled) return
  const dates = next30Days(settings.notifyTime, now)
  await LocalNotifications.schedule({
    notifications: dates.map(date => ({
      id: notificationId(date),
      title: '格致明理 · 今日学习',
      body: '今日一题已备好，静下心来想三分钟。',
      schedule: { at: date, allowWhileIdle: true },
      smallIcon: 'ic_stat_gezhi',
    })),
  })
}

export async function sendTestNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: '格致明理',
        body: '测试通知：通知通道正常。',
        schedule: { at: new Date(Date.now() + 3000) },
        smallIcon: 'ic_stat_gezhi',
      },
    ],
  })
}

export async function ensureExactAlarm(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const status = await LocalNotifications.checkExactNotificationSetting()
    if (status.exact_alarm !== 'granted') {
      await LocalNotifications.changeExactNotificationSetting()
    }
  } catch {
    // 设备不支持精确闹钟设置时忽略，通知仍按普通闹钟调度
  }
}
```

- [ ] **Step 4: 运行测试**

Run: `npm test -- src/lib/notify.test.ts`
Expected: PASS

- [ ] **Step 5: 实现 SettingsPage**

`src/pages/SettingsPage.tsx`：

```tsx
import { useState } from 'react'
import { BackBar } from '../components/BackBar'
import { useStore } from '../lib/store'
import { ensureExactAlarm, ensurePermission, rescheduleDaily, sendTestNotification } from '../lib/notify'
import '../styles/settings.css'

export function SettingsPage() {
  const { prefs, updateSettings, restoreAll } = useStore()
  const [message, setMessage] = useState('')
  const { settings } = prefs

  async function toggleNotify(enabled: boolean) {
    setMessage('')
    if (enabled) {
      const granted = await ensurePermission()
      if (!granted) {
        setMessage('通知权限未授予，请在系统设置中允许通知。')
        return
      }
      await ensureExactAlarm()
    }
    updateSettings({ notifyEnabled: enabled })
    const next = { ...settings, notifyEnabled: enabled }
    await rescheduleDaily(next).catch(() => undefined)
    setMessage(enabled ? '已开启每日提醒。' : '已关闭每日提醒。')
  }

  async function changeTime(value: string) {
    if (!value) return
    updateSettings({ notifyTime: value })
    if (settings.notifyEnabled) {
      await rescheduleDaily({ ...settings, notifyTime: value }).catch(() => undefined)
    }
    setMessage(`提醒时间改为 ${value}。`)
  }

  async function test() {
    setMessage('')
    const granted = await ensurePermission()
    if (!granted) {
      setMessage('通知权限未授予，无法发送测试通知。')
      return
    }
    await sendTestNotification().catch(() => undefined)
    setMessage('测试通知将在 3 秒后到达（仅安卓端生效）。')
  }

  return (
    <div>
      <BackBar title="通知设置" />
      <header className="page-head">
        <h1 className="page-title">通知</h1>
        <p className="page-sub">每日一题提醒</p>
      </header>
      <div className="field-row">
        <span>每日提醒</span>
        <input type="checkbox" className="switch" checked={settings.notifyEnabled} onChange={e => void toggleNotify(e.target.checked)} />
      </div>
      <label className="label" htmlFor="notify-time">提醒时间</label>
      <input id="notify-time" type="time" className="input" value={settings.notifyTime} onChange={e => void changeTime(e.target.value)} />
      <button className="btn-ghost test-btn" onClick={() => void test()}>发送测试通知</button>
      {message && <p className="form-message" role="status">{message}</p>}
      <hr className="rule" />
      <div className="field-row">
        <span>联网补充元数据</span>
        <input type="checkbox" className="switch" checked={settings.enrichEnabled} onChange={e => updateSettings({ enrichEnabled: e.target.checked })} />
      </div>
      <p className="settings-hint">关闭后应用完全不发起网络请求，只显示内置内容。</p>
      {prefs.removedIds.length > 0 && (
        <button className="btn-ghost restore-btn" onClick={() => { restoreAll(); setMessage('已恢复全部隐藏内容。') }}>
          恢复已隐藏内容（{prefs.removedIds.length}）
        </button>
      )}
      <hr className="rule" />
      <p className="settings-hint">
        荣耀 MagicOS 对后台限制较严。若提醒不按时到达，请在「设置 → 电池 → 应用启动管理」中允许本应用自动启动，并允许「精确闹钟」权限。
      </p>
    </div>
  )
}
```

- [ ] **Step 6: 实现 MinePage**

`src/pages/MinePage.tsx`：

```tsx
import { builtinItems, useStore } from '../lib/store'
import { mergeItems } from '../lib/merge'
import { SUBJECTS } from '../data/subjects'
import { formatDate } from '../lib/format'
import type { VideoItem } from '../lib/types'
import '../styles/mine.css'

export function MinePage() {
  const { prefs } = useStore()
  const items = mergeItems([...builtinItems], prefs)
  const bookmarks = items.filter(i => prefs.bookmarks.includes(i.id))
  const watched = prefs.watched
    .map(w => items.find(i => i.id === w.id))
    .filter((i): i is VideoItem => Boolean(i))
    .slice(0, 20)

  const sealOf = (subjectId: string) => SUBJECTS.find(s => s.id === subjectId)?.seal

  return (
    <div>
      <header className="page-head">
        <h1 className="page-title">我的</h1>
        <p className="page-sub">学而时习之</p>
      </header>
      <nav className="mine-nav">
        <a href="#/add">添加内容</a>
        <a href="#/settings">通知设置</a>
      </nav>
      <div className="section-head"><h2 className="section-title">收藏</h2><span className="muted">{bookmarks.length} 条</span></div>
      {bookmarks.length === 0 && <p className="empty">还没有收藏。在内容详情页点「收藏」。</p>}
      <ul className="mine-list">
        {bookmarks.map(item => (
          <li key={item.id}>
            <a className="mine-row" href={`#/item/${encodeURIComponent(item.id)}`}>
              <span className="seal small-seal">{sealOf(item.subject)}</span>
              <span className="mine-row-title">{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="section-head"><h2 className="section-title">学习记录</h2><span className="muted">最近</span></div>
      {watched.length === 0 && <p className="empty">还没有学习记录。</p>}
      <ul className="mine-list">
        {watched.map(item => (
          <li key={item.id}>
            <a className="mine-row" href={`#/item/${encodeURIComponent(item.id)}`}>
              <span className="mine-row-title">{item.title}</span>
              <span className="mine-row-date">{formatDate(new Date(prefs.watched.find(w => w.id === item.id)?.at ?? Date.now()))}</span>
            </a>
          </li>
        ))}
      </ul>
      <hr className="rule" />
      <p className="about">
        格致明理 0.1.0 · 只收学术内容的学习端<br />
        内容版权归原作者所有，播放跳转 bilibili 官方页面。<br />
        所有数据仅保存在本机。
      </p>
    </div>
  )
}
```

- [ ] **Step 7: 写 mine.css 与 settings.css**

`src/styles/mine.css`：

```css
.mine-nav { display: flex; gap: 12px; margin: 8px 0 4px; }
.mine-nav a { border: 1px solid var(--line); padding: 10px 18px; border-radius: var(--radius); font-size: 14px; color: var(--ink-2); }
.mine-list { border-top: 1px solid var(--line); }
.mine-row { display: flex; align-items: center; gap: 12px; padding: 13px 4px; border-bottom: 1px solid var(--line); }
.mine-row-title { flex: 1; font-size: 14px; line-height: 1.45; }
.mine-row-date { color: var(--ink-3); font-size: 11px; white-space: nowrap; }
.small-seal { width: 24px; height: 24px; font-size: 13px; flex: none; }
.about { color: var(--ink-3); font-size: 12px; line-height: 1.9; }
```

`src/styles/settings.css`：

```css
.field-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--line); }
.switch { width: 20px; height: 20px; accent-color: var(--cinnabar); }
.test-btn, .restore-btn { margin-top: 16px; }
.settings-hint { color: var(--ink-3); font-size: 12px; line-height: 1.8; margin: 12px 0; }
```

- [ ] **Step 8: 运行测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS。

- [ ] **Step 9: 提交**

```bash
git add src/lib/notify.ts src/lib/notify.test.ts src/pages/SettingsPage.tsx src/pages/MinePage.tsx src/styles/mine.css src/styles/settings.css
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: add notification scheduling, settings and mine pages"
```

---

### Task 11: 首次启动引导与通知接线

**Files:**
- Create: `src/components/Onboarding.tsx`, `src/styles/onboarding.css`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useStore.completeOnboarding/updateSettings/prefs`、`ensurePermission/rescheduleDaily`、`LocalNotifications` 监听
- Produces: 首次启动引导覆盖层；App 级通知补排与点击跳转

- [ ] **Step 1: 实现 Onboarding**

`src/components/Onboarding.tsx`：

```tsx
import { useState } from 'react'
import { useStore } from '../lib/store'
import { ensureExactAlarm, ensurePermission, rescheduleDaily } from '../lib/notify'
import '../styles/onboarding.css'

export function Onboarding() {
  const { prefs, updateSettings, completeOnboarding } = useStore()
  const [busy, setBusy] = useState(false)

  async function enable() {
    setBusy(true)
    const granted = await ensurePermission()
    if (granted) {
      await ensureExactAlarm()
      updateSettings({ notifyEnabled: true })
      await rescheduleDaily({ ...prefs.settings, notifyEnabled: true }).catch(() => undefined)
    }
    setBusy(false)
    completeOnboarding()
  }

  function skip() {
    updateSettings({ notifyEnabled: false })
    completeOnboarding()
  }

  return (
    <div className="onboarding">
      <div className="onboarding-inner">
        <div className="onboarding-seal">格致</div>
        <h1 className="onboarding-title">格致明理</h1>
        <p className="onboarding-lead">一个只装学术内容的 bilibili 学习端。</p>
        <ul className="onboarding-points">
          <li>六学科精选 · 不含娱乐内容</li>
          <li>每日一题 · 每日通知提醒</li>
          <li>数据只留本机 · 无账号无追踪</li>
        </ul>
        <button className="btn-primary" onClick={() => void enable()} disabled={busy}>
          {busy ? '正在申请权限…' : '启用每日提醒'}
        </button>
        <button className="text-btn onboarding-skip" onClick={skip}>暂不提醒，先浏览</button>
        <p className="onboarding-hint">
          荣耀手机请在「设置 → 电池 → 应用启动管理」中允许本应用自动启动，否则定时提醒可能被系统拦截。
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 写 onboarding.css**

`src/styles/onboarding.css`：

```css
.onboarding { position: fixed; inset: 0; background: var(--paper); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 32px; }
.onboarding-inner { max-width: 420px; width: 100%; text-align: center; }
.onboarding-seal { width: 72px; height: 72px; margin: 0 auto; border: 2px solid var(--cinnabar); color: var(--cinnabar); font-family: var(--font-serif); font-weight: 600; font-size: 22px; line-height: 1.3; display: flex; align-items: center; justify-content: center; }
.onboarding-title { font-size: 30px; letter-spacing: 0.2em; margin-top: 24px; }
.onboarding-lead { color: var(--ink-2); margin-top: 8px; }
.onboarding-points { margin: 28px 0; color: var(--ink-2); font-size: 14px; line-height: 2.2; }
.onboarding-skip { margin-top: 16px; }
.onboarding-hint { margin-top: 28px; color: var(--ink-3); font-size: 12px; line-height: 1.8; }
```

- [ ] **Step 3: 接入 App（引导 + 通知监听 + 补排）**

修改 `src/App.tsx`：

```tsx
import { useEffect, useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { StoreProvider, useStore } from './lib/store'
import { parseRoute, navigate, type Route } from './lib/router'
import { rescheduleDaily } from './lib/notify'
import { TabBar } from './components/TabBar'
import { Onboarding } from './components/Onboarding'
import { TodayPage } from './pages/TodayPage'
import { SubjectsPage } from './pages/SubjectsPage'
import { SubjectPage } from './pages/SubjectPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { MinePage } from './pages/MinePage'
import { AddItemPage } from './pages/AddItemPage'
import { SettingsPage } from './pages/SettingsPage'

function Shell() {
  const { prefs, ready } = useStore()
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash))

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!ready || !Capacitor.isNativePlatform()) return
    if (prefs.onboarded && prefs.settings.notifyEnabled) {
      void rescheduleDaily(prefs.settings).catch(() => undefined)
    }
    const listener = LocalNotifications.addListener('localNotificationActionPerformed', () => {
      navigate({ name: 'today' })
    })
    return () => {
      void listener.then(h => h.remove())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  let page: ReactNode
  switch (route.name) {
    case 'today': page = <TodayPage />; break
    case 'subjects': page = <SubjectsPage />; break
    case 'subject': page = <SubjectPage id={route.id} />; break
    case 'item': page = <ItemDetailPage id={route.id} />; break
    case 'mine': page = <MinePage />; break
    case 'add': page = <AddItemPage />; break
    case 'settings': page = <SettingsPage />; break
  }

  const active =
    route.name === 'today' ? 'today'
    : route.name === 'subjects' || route.name === 'subject' ? 'subjects'
    : route.name === 'mine' ? 'mine'
    : null

  return (
    <div className="app">
      <main className="app-main">{page}</main>
      {active && <TabBar active={active} />}
      {ready && !prefs.onboarded && <Onboarding />}
    </div>
  )
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
```

- [ ] **Step 4: 运行测试与构建**

Run: `npm test && npm run build`
Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/Onboarding.tsx src/styles/onboarding.css src/App.tsx
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: add onboarding and notification wiring"
```

---

### Task 12: Capacitor 安卓工程、权限与签名配置

**Files:**
- Create: `capacitor.config.ts`
- Create（generated）: `android/` 整个目录
- Modify: `android/app/src/main/AndroidManifest.xml`, `android/app/build.gradle`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `dist/` 构建产物、`package.json` 中的 Cap 依赖
- Produces: 可被 CI 构建的安卓工程；release 签名读取环境变量 `GEZHI_KEYSTORE_PATH/GEZHI_KEYSTORE_PASSWORD/GEZHI_KEY_ALIAS/GEZHI_KEY_PASSWORD/GEZHI_VERSION_CODE`

- [ ] **Step 1: 写 capacitor.config.ts**

`capacitor.config.ts`：

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.nddcv.gezhi',
  appName: '格致明理',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    LocalNotifications: { smallIcon: 'ic_stat_gezhi', iconColor: '#8C2F28' },
  },
}

export default config
```

- [ ] **Step 2: 生成安卓工程**

Run: `npm run build && npx cap add android && npx cap sync android`
Expected: 生成 `android/` 目录，无错误。

- [ ] **Step 3: 添加权限**

在 `android/app/src/main/AndroidManifest.xml` 的 `<application` 之前插入：

```xml
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

保留模板已有的 `INTERNET` 权限。

- [ ] **Step 4: 配置 release 签名与版本号**

修改 `android/app/build.gradle`。在文件顶部（`android {` 之前）加入：

```gradle
def gezhiKeystorePath = System.getenv("GEZHI_KEYSTORE_PATH")
def gezhiHasKeystore = gezhiKeystorePath != null && file(gezhiKeystorePath).exists()
def gezhiVersionCodeEnv = System.getenv("GEZHI_VERSION_CODE")
```

在 `android {}` 块内加入 signingConfigs（若模板已有 `signingConfigs`，合并）：

```gradle
    signingConfigs {
        release {
            if (gezhiHasKeystore) {
                storeFile file(gezhiKeystorePath)
                storePassword System.getenv("GEZHI_KEYSTORE_PASSWORD")
                keyAlias System.getenv("GEZHI_KEY_ALIAS")
                keyPassword System.getenv("GEZHI_KEY_PASSWORD")
            }
        }
    }
```

将 `defaultConfig` 中的 `versionCode` 与 `versionName` 替换为：

```gradle
        versionCode gezhiVersionCodeEnv != null && gezhiVersionCodeEnv.isInteger() ? (gezhiVersionCodeEnv.toInteger() + 100) : 1
        versionName "0.1.0"
```

将 `buildTypes.release` 补充签名回退：

```gradle
        release {
            signingConfig gezhiHasKeystore ? signingConfigs.release : signingConfigs.debug
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
```

- [ ] **Step 5: 确认 App 名称与包名**

检查 `android/app/src/main/res/values/strings.xml` 中 `app_name` 为 `格致明理`；检查 `android/app/build.gradle` 的 `namespace`/`applicationId` 为 `io.github.nddcv.gezhi`（Capacitor 生成时应已正确，若有偏差以 config 为准重新 `cap sync`）。

- [ ] **Step 6: 补全 .gitignore**

在根 `.gitignore` 末尾追加：

```
android/.idea/
android/build/
android/app/build/
android/capacitor-cordova-android-plugins/build/
```

- [ ] **Step 7: 验证 web 构建与 sync**

Run: `npm test && npm run build && npx cap sync android`
Expected: 全部成功（本机无 SDK，无法本地 assemble，交由 CI 验证）。

- [ ] **Step 8: 提交**

```bash
git add capacitor.config.ts android .gitignore
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: add capacitor android project with notifications and release signing"
```

---

### Task 13: 字体子集与应用图标

**Files:**
- Create: `scripts/subset_fonts.py`, `public/fonts/*.woff2`
- Create: `scripts/gen-icons.mjs`, `public/favicon.svg`
- Modify: `index.html`（favicon）
- Modify: `android/app/src/main/res/values/ic_launcher_background.xml`、mipmap PNG、`drawable-*/ic_stat_gezhi.png`

**Interfaces:**
- Consumes: 字体源文件（在线下载）、sharp
- Produces: 离线衬线字体；全套安卓图标

- [ ] **Step 1: 安装 fonttools**

```bash
python -m venv .venv-tools
.venv-tools/Scripts/pip install fonttools brotli
```

- [ ] **Step 2: 写字体子集脚本并运行**

`scripts/subset_fonts.py`：

```python
import os
import urllib.request
from fontTools import subset

SRC_DIR = '.cache/fonts'
OUT_DIR = 'public/fonts'
SOURCES = {
    'Regular': 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/OTF/SimplifiedChinese/NotoSerifCJKsc-Regular.otf',
    'SemiBold': 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/OTF/SimplifiedChinese/NotoSerifCJKsc-SemiBold.otf',
}


def gb2312_chars():
    chars = set()
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode('gb2312'))
            except UnicodeDecodeError:
                pass
    chars.update('，。；：？！、“”‘’（）《》〈〉【】—…·「」『』％＃＠＆＊＋－／＝＜＞±×÷≈≠≤≥∞√∫∑∏∂∆∈∉⊂⊃∪∩→←↔⇒⇔∀∃∠⊥∥°′″')
    return chars


def main():
    os.makedirs(SRC_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    unicodes = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100))
    unicodes |= set(range(0x2000, 0x2070)) | set(range(0x2200, 0x2300))
    unicodes |= set(range(0x3000, 0x3040)) | set(range(0xFF00, 0xFFF0))
    unicodes |= {ord(c) for c in gb2312_chars()}
    unicode_arg = ','.join(f'U+{u:04X}' for u in sorted(unicodes))
    for name, url in SOURCES.items():
        src = os.path.join(SRC_DIR, f'NotoSerifCJKsc-{name}.otf')
        if not os.path.exists(src):
            print(f'downloading {url}')
            urllib.request.urlretrieve(url, src)
        out = os.path.join(OUT_DIR, f'NotoSerifSC-{name}.woff2')
        subset.main([
            src,
            f'--unicodes={unicode_arg}',
            '--flavor=woff2',
            '--layout-features=*',
            f'--output-file={out}',
        ])
        print(out, os.path.getsize(out), 'bytes')


if __name__ == '__main__':
    main()
```

Run: `npm run fonts`
Expected: `public/fonts/` 下生成两个 woff2，各约 3–6 MB。若 Windows 上 npm 调用 venv 路径失败，可直接在 Git Bash 运行 `.venv-tools/Scripts/python.exe scripts/subset_fonts.py`。若下载失败，手动从 `https://github.com/notofonts/noto-cjk/tree/main/Serif/OTF/SimplifiedChinese` 下载同名文件放入 `.cache/fonts/` 后重跑。

- [ ] **Step 3: 写图标生成脚本**

`scripts/gen-icons.mjs`：

```js
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PAPER = '#F7F4EE'
const CINNABAR = '#8C2F28'
const RES = 'android/app/src/main/res'

const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }
const NOTIFY = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 }

function sealSvg(size, background = true) {
  const pad = Math.round(size * 0.2)
  const inner = size - pad * 2
  const stroke = Math.max(2, Math.round(size * 0.02))
  const fontSize = Math.round(inner * 0.33)
  const common = `text-anchor="middle" font-family="SimSun, serif" font-weight="bold" font-size="${fontSize}" fill="${CINNABAR}"`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  ${background ? `<rect width="${size}" height="${size}" fill="${PAPER}"/>` : ''}
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" fill="none" stroke="${CINNABAR}" stroke-width="${stroke}"/>
  <text x="50%" y="${pad + inner * 0.42}" ${common}>格</text>
  <text x="50%" y="${pad + inner * 0.87}" ${common}>致</text>
</svg>`
}

function notifySvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}" fill="none" stroke="#FFFFFF" stroke-width="${Math.max(1, size * 0.08)}"/>
  <text x="50%" y="58%" text-anchor="middle" font-family="SimSun, serif" font-weight="bold" font-size="${size * 0.6}" fill="#FFFFFF">格</text>
</svg>`
}

mkdirSync('public', { recursive: true })

for (const [density, size] of Object.entries(LEGACY)) {
  const dir = join(RES, `mipmap-${density}`)
  mkdirSync(dir, { recursive: true })
  const svg = Buffer.from(sealSvg(size))
  await sharp(svg).png().toFile(join(dir, 'ic_launcher.png'))
  await sharp(svg).png().toFile(join(dir, 'ic_launcher_round.png'))
}

for (const [density, size] of Object.entries(FOREGROUND)) {
  const dir = join(RES, `mipmap-${density}`)
  mkdirSync(dir, { recursive: true })
  await sharp(Buffer.from(sealSvg(size, false))).png().toFile(join(dir, 'ic_launcher_foreground.png'))
}

for (const [density, size] of Object.entries(NOTIFY)) {
  const dir = join(RES, `drawable-${density}`)
  mkdirSync(dir, { recursive: true })
  await sharp(Buffer.from(notifySvg(size))).png().toFile(join(dir, 'ic_stat_gezhi.png'))
}

writeFileSync(
  join(RES, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${PAPER}</color>\n</resources>\n`,
)

await sharp(Buffer.from(sealSvg(512))).png().toFile('public/favicon-512.png')
const favicon = sealSvg(64)
writeFileSync('public/favicon.svg', favicon)
console.log('icons generated')
```

Run: `npm run icons`
Expected: 输出 `icons generated`；各 mipmap/drawable 目录出现 PNG。

- [ ] **Step 4: 配置 favicon**

在 `index.html` 的 `<head>` 中加入：

```html
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 5: 验证文件生成**

Run: `ls public/fonts && ls android/app/src/main/res/mipmap-xxxhdpi && ls android/app/src/main/res/drawable-xxhdpi`
Expected: 字体 woff2 ×2；`ic_launcher.png / ic_launcher_round.png / ic_launcher_foreground.png`；`ic_stat_gezhi.png`。

再用 Read 工具查看 `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`，确认朱砂方印与「格致」二字渲染正常；若文字为空白（环境缺字体），改为在脚本中用简单几何笔画绘制印章字形（白色/朱砂色的横竖线段组合），重新生成并肉眼确认。

Run: `npm test && npm run build && npx cap sync android`
Expected: 成功。

- [ ] **Step 6: 提交**

```bash
git add scripts/subset_fonts.py scripts/gen-icons.mjs public/fonts public/favicon.svg public/favicon-512.png index.html android/app/src/main/res
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "feat: bundle serif font subset and generate app icons"
```

---

### Task 14: CI 构建、README 与许可声明

**Files:**
- Create: `.github/workflows/android.yml`
- Create: `README.md`, `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Consumes: 全部代码与安卓工程
- Produces: push/tag 自动构建；Release APK；项目说明

- [ ] **Step 1: 写 CI workflow**

`.github/workflows/android.yml`：

```yaml
name: android

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
  workflow_dispatch:

jobs:
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build

  android:
    needs: web
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: android-actions/setup-android@v3
      - run: yes | sdkmanager --licenses > /dev/null 2>&1 || true
      - run: sdkmanager "platforms;android-35" "build-tools;35.0.0"
      - run: npm ci
      - run: npm run build
      - run: npx cap sync android
      - name: Decode keystore
        env:
          KS_B64: ${{ secrets.GEZHI_KEYSTORE_BASE64 }}
        run: |
          if [ -n "$KS_B64" ]; then
            printf '%s' "$KS_B64" | base64 -d > android/app/gezhi-release.keystore
            echo "keystore ready"
          else
            echo "no keystore secret, falling back to debug signing"
          fi
      - name: Build APK
        working-directory: android
        env:
          GEZHI_KEYSTORE_PATH: ${{ github.workspace }}/android/app/gezhi-release.keystore
          GEZHI_KEYSTORE_PASSWORD: ${{ secrets.GEZHI_KEYSTORE_PASSWORD }}
          GEZHI_KEY_ALIAS: ${{ secrets.GEZHI_KEY_ALIAS }}
          GEZHI_KEY_PASSWORD: ${{ secrets.GEZHI_KEY_PASSWORD }}
          GEZHI_VERSION_CODE: ${{ github.run_number }}
        run: |
          chmod +x gradlew
          ./gradlew assembleRelease
      - uses: actions/upload-artifact@v4
        with:
          name: gezhi-apk
          path: android/app/build/outputs/apk/**/*.apk
      - name: Publish release
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v2
        with:
          files: android/app/build/outputs/apk/**/*.apk
```

- [ ] **Step 2: 写 README**

`README.md`：

```markdown
# 格致明理

一个只装学术内容的 bilibili 学习端（安卓）。六学科精选、每日一课、每日一题、每日提醒，宣纸墨色的简洁庄重界面。

- 内容全部为人工精选的系统课程/公开课；无娱乐内容。
- 播放跳转 bilibili 官方页面；不下载、不登录、不追踪。
- 所有个人数据（收藏、学习记录、添加内容）只保存在本机。

## 开发

```bash
npm install
npm run dev        # 浏览器开发
npm test           # 单元测试
npm run build      # 生产构建
npx cap sync android
```

## 内容库

- 精选库：`src/data/content.json`（字段与收录标准见设计文档）
- 每日一题：`src/data/daily.json`
- 校验所有 BV 号：`npm run verify:content`（需联网）
- 搜索候选内容：`node scripts/bili-search.mjs 关键词`

## 构建 APK

CI 在 push 到 main 时构建 artifact，打 tag（如 `v0.1.0`）时发布 GitHub Release。

Release 签名需要仓库 Secrets：`GEZHI_KEYSTORE_BASE64`、`GEZHI_KEYSTORE_PASSWORD`、`GEZHI_KEY_ALIAS`、`GEZHI_KEY_PASSWORD`。未配置时回退 debug 签名（可安装，但升级安装需要先卸载）。

本机 keystore 若丢失，将无法覆盖安装旧版本，请妥善备份 `.keys/` 目录。

## 安装（荣耀 Magic8）

1. 手机浏览器打开 Release 页面下载 `.apk`；
2. 允许「安装未知应用」后安装；
3. 首次启动按引导授予通知权限，并在「设置 → 电池 → 应用启动管理」允许本应用自动启动。

## 字体与许可

标题字体为 Noto Serif SC 子集（SIL OFL 1.1），见 `THIRD_PARTY_NOTICES.md`。
```

- [ ] **Step 3: 写 THIRD_PARTY_NOTICES**

`THIRD_PARTY_NOTICES.md`：

```markdown
# 第三方声明

本项目在运行时与构建时使用以下开源组件，版权归各自作者所有：

- React / React DOM — MIT — https://github.com/facebook/react
- Capacitor (core/android/cli, preferences, local-notifications, browser, app) — MIT — https://github.com/ionic-team/capacitor
- Noto Serif SC — SIL Open Font License 1.1 — https://github.com/notofonts/noto-cjk
- Vite — MIT — https://github.com/vitejs/vite
- Vitest / Testing Library — MIT — https://github.com/vitest-dev/vitest
- sharp — Apache-2.0 — https://github.com/lovell/sharp

所有视频内容的版权归 bilibili 及其创作者所有；本应用仅展示标题与人工撰写的推荐语，播放一律跳转官方页面。
```

- [ ] **Step 4: 检查 workflow 语法**

Run: `node -e "const fs=require('fs');console.log(fs.readFileSync('.github/workflows/android.yml','utf8').length)"`
Expected: 输出文件长度（大写数字），无报错。

- [ ] **Step 5: 运行测试与构建并提交**

Run: `npm test && npm run build`
Expected: 全部 PASS。

```bash
git add .github/workflows/android.yml README.md THIRD_PARTY_NOTICES.md
git -c user.name="nddcv1" -c user.email="nddcv1@users.noreply.github.com" commit -m "ci: build signed APK and publish releases; add project docs"
```

---

### Task 15: 发布仓库、配置签名与获取 APK

**Files:**
- 无代码改动（仓库配置与发布）

**Interfaces:**
- Consumes: 所有已提交代码、gh CLI（已登录 nddcv1）
- Produces: GitHub 仓库 `nddcv1/gezhi`、Secrets、Release APK

- [ ] **Step 1: 生成签名 keystore 与密码（本地，gitignored）**

```bash
mkdir -p .keys
node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))" > .keys/gezhi-storepass.txt
PASS=$(cat .keys/gezhi-storepass.txt)
keytool -genkeypair -v -keystore android/app/gezhi-release.keystore -alias gezhi -keyalg RSA -keysize 2048 -validity 10000 -storetype PKCS12 -dname "CN=Gezhi Mingli,O=nddcv1,C=CN" -storepass "$PASS" -keypass "$PASS"
base64 -w0 android/app/gezhi-release.keystore > .keys/keystore.b64
```

Expected: `android/app/gezhi-release.keystore` 生成；`.keys/` 内有密码与 base64。**提醒用户备份 `.keys/` 与 keystore 文件**（丢失将无法覆盖升级）。

- [ ] **Step 2: 创建 GitHub 仓库并推送**

```bash
gh repo create nddcv1/gezhi --public --source=. --remote=origin
git push -u origin main
```

Expected: 仓库创建、main 推送成功；CI 的 `web`/`android` job 开始运行。

- [ ] **Step 3: 写入签名 Secrets 并打 tag**

```bash
gh secret set GEZHI_KEYSTORE_BASE64 < .keys/keystore.b64
gh secret set GEZHI_KEYSTORE_PASSWORD < .keys/gezhi-storepass.txt
gh secret set GEZHI_KEY_PASSWORD < .keys/gezhi-storepass.txt
gh secret set GEZHI_KEY_ALIAS --body "gezhi"
git tag v0.1.0
git push origin v0.1.0
```

- [ ] **Step 4: 监控构建并确认 Release**

```bash
gh run list --limit 5
gh run watch <run-id>   # 使用上一条输出中的 run id
gh release view v0.1.0
```

Expected: `android` job 成功；Release `v0.1.0` 附带 APK（如 `app-release.apk`）。若失败：读取 `gh run view <run-id> --log-failed`，修复后提交并重新打 tag（`git tag -d v0.1.0 && git push origin :v0.1.0 && git tag v0.1.0 && git push origin v0.1.0`）。

- [ ] **Step 5: 交付安装与真机验收**

把 Release 页面链接发给用户，请用户在荣耀 Magic8 上：

1. 下载 APK → 允许安装未知应用 → 安装；
2. 首次启动走 Onboarding，授予通知权限并完成电池白名单设置；
3. 逐项验收：
   - 三标签、六学科、详情页正常；排版卡片与印章风格符合预期；
   - 「去 bilibili 学习」可打开对应视频页面；
   - 设置页「发送测试通知」3 秒内到达；修改时间后按新时间提醒；
   - 收藏、添加内容、隐藏条目，杀进程重开仍保留；
   - 飞行模式打开：内置内容完整、无报错；
   - 联网时详情页显示播放量/时长（接口可用时）。

- [ ] **Step 6: 收尾**

用户验收通过后，在 `README.md` 的「安装」一节补上 Release 链接（提交一次），并按 `superpowers:finishing-a-development-branch` 流程收尾。

---

## Self-Review

（写完后的自审记录）

1. **Spec 覆盖**：
   - 三标签、每日卡、信息流 → Task 5/6/7
   - 每日一题 30 道 → Task 4
   - 六学科精选 60+ → Task 3
   - 收藏/学习记录/添加/隐藏恢复 → Task 5/8/9/10
   - 联网元数据 + 24h 缓存 + 回退 → Task 8
   - 本地通知 + 权限 + MagicOS 引导 + 测试按钮 → Task 10/11
   - 排版式封面、印章、字体、图标 → Task 6/7/13
   - Capacitor、权限、签名、CI、Release → Task 12/14/15
   - 测试策略（单测 + 组件冒烟 + 真机清单）→ 各任务 + Task 15
2. **占位符**：无 TBD/TODO；所有代码步骤均给出完整实现；内容与题目为明确规格的创作型交付。
3. **类型一致性**：`VideoItem.id` 与 `bvid` 约定、`metaCache` 以 bvid 为键、`StoreValue` 方法名在 Task 5 定义并在 Task 8/9/10/11 使用；`notify.ts` 名称在 Task 10 定义、Task 11 使用；`parseRoute/routeHash` 在 Task 5 定义、Task 11 使用 `navigate`（Task 5 已含）。
