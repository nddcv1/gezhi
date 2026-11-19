# 格致明理（Gezhi Mingli）设计规格

- 日期：2026-11-19
- 状态：设计已与用户逐节确认（2026-11-19 对话），待 spec 审阅
- 目标设备：荣耀 Magic8（MagicOS 10 / Android 16，arm64）

## 1. 背景与目标

用户需要一个「学习版 bilibili」安卓 App，可安装到荣耀 Magic8：

- 内容推送不含娱乐内容，全部为精选学术内容，覆盖数学、物理、计算机、经济学、哲学、人文六个学科；
- 同时具备：打开 App 的推荐信息流、每日系统通知、每日一题/一课卡片；
- 视觉风格简洁庄重；
- 内容双源：人工精选内置库 + bilibili 公开接口补充实时元数据，接口失效时静默回退；
- 用户可在 App 内增删内容；
- 通过 GitHub Actions 云端构建签名 APK，手机浏览器下载安装。

### 非目标（v1）

- 不在 App 内播放视频（一律跳转 bilibili 网页/官方 App）；
- 不做登录、账号同步、云同步；
- 不做服务端、远程推送（通知全部为本地定时通知）；
- 不做弹幕、评论、投币等社区功能；
- 不支持 iOS；
- 不使用 bilibili 商标、Logo 或名称作为 App 品牌。

## 2. 技术选型

| 项 | 选型 | 理由 |
|---|---|---|
| 前端 | Vite + React 18 + TypeScript | 页面/状态复杂度适中，迭代快 |
| 样式 | 手写 CSS + CSS 变量 | 视觉完全可控，不引入 UI 框架 |
| 安卓壳 | Capacitor 7 | 原生插件覆盖网络/通知/外跳需求，本机无需 Android SDK |
| HTTP | CapacitorHttp（Capacitor 内置，原生层代理） | 绕过 WebView CORS 限制调用 bilibili 接口 |
| 持久化 | @capacitor/preferences | 稳定的本机键值存储 |
| 通知 | @capacitor/local-notifications | 本地定时通知，无需服务器 |
| 浏览器外跳 | @capacitor/browser | Custom Tab 打开 bilibili 网页版 |
| 构建 | GitHub Actions（JDK 21 + Android SDK） | 本机无 SDK，云端构建签名 APK |
| 测试 | Vitest（node + jsdom） | 纯逻辑单测 + 组件冒烟测试 |

- 包名：`io.github.nddcv.gezhi`
- App 名：格致明理
- minSdk 24，targetSdk 35（Capacitor 7 默认），compileSdk 35
- webDir：`dist`；androidScheme：`https`
- 项目位置：`D:\gezhi`（独立 git 仓库，不混入 ProofMap）
- 远端仓库：GitHub `nddcv1/gezhi`（用户已批准新建）

## 3. 目录结构

```
D:\gezhi\
├─ .github/workflows/android.yml     # CI：测试 + 构建 APK + 发布 Release
├─ android/                          # Capacitor 生成的安卓工程（提交）
├─ docs/superpowers/specs/           # 本 spec
├─ public/fonts/                     # Noto Serif SC 子集 woff2
├─ scripts/
│  ├─ verify-content.mjs             # 校验 content.json 中的 BV 号真实存在
│  └─ gen-icons.mjs                  # 由 SVG 生成各尺寸 PNG 图标
├─ src/
│  ├─ main.tsx / App.tsx
│  ├─ pages/                         # Today / Subjects / SubjectDetail / ItemDetail / Mine / AddItem / Settings / Onboarding
│  ├─ components/                    # TabBar / VideoCard / DailyCard / SubjectSeal / Tag / EmptyState
│  ├─ data/
│  │  ├─ content.json                # 内置精选库（唯一内容事实来源）
│  │  ├─ daily.json                  # 30 道「今日一题」及参考答案
│  │  └─ subjects.ts                 # 学科定义（id、名称、印章字、排序）
│  ├─ lib/
│  │  ├─ store.ts                    # prefs 读写、默认值、迁移
│  │  ├─ merge.ts                    # 内置库 + 用户增删合并
│  │  ├─ rotation.ts                 # 每日轮换 / 信息流排序（确定性）
│  │  ├─ bvid.ts                     # BV 号解析
│  │  ├─ bilibili.ts                 # 元数据补充 + 24h 缓存
│  │  ├─ notify.ts                   # 通知权限、预排、测试通知
│  │  └─ format.ts                   # 播放量/时长/日期格式化
│  └─ styles/                        # tokens.css / base.css
├─ package.json / vite.config.ts / capacitor.config.ts / tsconfig.json
└─ THIRD_PARTY_NOTICES.md            # Noto Serif SC（OFL）等许可
```

## 4. 数据模型

### 4.1 内置内容库 `src/data/content.json`

```jsonc
{
  "version": 1,
  "items": [
    {
      "id": "bv1xx411c7mD",          // 与 bvid 小写一致；非 BV 条目用 "custom-xxx"
      "bvid": "BV1xx411c7mD",        // 可选；无 BV 的条目（如外部链接）省略
      "url": "https://...",           // 可选；无 bvid 时必填
      "title": "数学分析 第一讲 实数系",
      "upName": "UP 主名",
      "subject": "math",              // math | physics | cs | econ | philosophy | humanities
      "level": "入门",                // 入门 | 进阶 | 硬核
      "tags": ["数学分析", "实数系"],
      "description": "人工撰写的 1-2 句推荐语",
      "curatedAt": "2026-11-19"
    }
  ]
}
```

- 收录标准：正式课程/系统讲解/经典公开课；单人娱乐向、切片、营销号一律不收。
- 目标规模：每学科 10–15 条，总数 60–90 条。
- 收录前必须用 `scripts/verify-content.mjs` 调 bilibili view 接口校验 BV 存在且未删除。
- 播放量、时长、最新标题等易变字段不写入内置库，由运行时补充。

### 4.2 今日一题 `src/data/daily.json`

```jsonc
{
  "version": 1,
  "questions": [
    {
      "id": "q001",
      "subject": "math",
      "question": "……（题干 Markdown 纯文本，单题不超过 120 字）",
      "answer": "……（简要答案与思路）"
    }
  ]
}
```

- 30 题：数学（分析/线代/概率）约 15、物理约 6、逻辑推理约 5、计算机约 4。
- 全部为自编题目，不复制教材/网络原文。
- 按日期种子轮换，答案默认折叠。

### 4.3 用户偏好（Preferences，key `gezhi.prefs.v1`）

```ts
interface Prefs {
  version: 1;
  addedItems: VideoItem[];        // 用户添加的内容
  removedIds: string[];           // 被隐藏的内置条目 id
  bookmarks: string[];            // 收藏的条目 id
  watched: { id: string; at: number }[];  // 最近 100 条学习记录
  settings: {
    enrichEnabled: boolean;       // 联网补充元数据，默认 true
    notifyEnabled: boolean;       // 默认 true
    notifyTime: string;           // "HH:mm"，默认 "20:00"
  };
  onboarded: boolean;
  metaCache: Record<string, { fetchedAt: number; title?: string; duration?: number; view?: number }>;  // 24h 缓存元数据
}
```

- 读取时做 schema 校验，损坏则回退默认值（不崩溃）。
- 所有写操作经 store.ts 单入口，合并本地缓存后整体写回。

### 4.4 合并规则

有效条目 = 内置库 − `removedIds` + `addedItems`，按 `id` 去重（用户添加优先）。
用户添加时若 id 与内置冲突，提示「已存在」。

## 5. 页面与交互

三标签底部导航：今日 / 学科 / 我的。hash 路由，无第三方路由库（页面少，手写 20 行路由即可）。

### 5.1 首次启动 Onboarding
- 一屏说明：格致明理是什么、内容来源、无娱乐内容；
- 请求通知权限（可跳过）并提示 MagicOS 电池白名单操作路径；
- 完成后写 `onboarded: true`。

### 5.2 今日
- 顶部：日期（公历 + 星期）+ 一句简短题记（静态文案轮换）；
- 每日卡：今日一课（当日轮换精选，排版式封面色块）+ 今日一题（点击展开答案）；
- 信息流：按 6 节算法排序的条目列表，显示学科印章、标题、UP 主、难度、时长/播放量（有缓存才显示）。

### 5.3 学科
- 学科列表（六科，每科一条：名称、印章、条目数）；
- 学科详情：该学科精选列表，按难度排序。

### 5.4 我的
- 收藏列表；学习记录（最近打开，最多 50 条展示）；
- 添加内容：粘贴 BV 号或视频链接 → 解析预览 → 选学科/难度 → 保存；
- 通知设置：开关、时间选择、测试通知按钮、权限状态提示；
- 关于：版本、内容说明、许可声明入口。

### 5.5 详情页
- 标题、UP 主、学科、难度、标签、人工简介、缓存元数据（标题/播放量/时长）；
- 主按钮「去 bilibili 学习」：`Browser.open({ url })` 打开 `https://www.bilibili.com/video/{bvid}`（无 bvid 用 `url`），页面内可转官方 App；
- 打开时写入 watched；
- 收藏/取消收藏按钮。

### 5.6 错误与空状态
- 联网失败：不提示错误，仅显示内置数据；设置页可看到「元数据更新时间」。
- 空列表（如无收藏）：一句话 + 返回今日入口。

## 6. 视觉规范

**气质**：宣纸上的讲义。静、克制、可长读。

### 6.1 Design tokens

```css
--paper: #F7F4EE;        /* 背景 */
--paper-2: #FBF9F4;      /* 卡片 */
--ink: #1F1B16;          /* 主文字 */
--ink-2: #5A5248;        /* 次文字 */
--ink-3: #8A8175;        /* 弱文字 */
--line: #DED7C9;         /* 分割线 1px */
--cinnabar: #8C2F28;     /* 朱砂：主按钮/印章/强调 */
--cinnabar-weak: #B55A4F;
--ok: #3E5C46;           /* 收藏态 */
```

- 圆角仅 2px；无阴影（用 1px 线与色块层次）；无渐变。
- 间距基准 8px；页边距 20px；卡片留白充足。
- 学科印章：方形朱砂描边 + 篆意单字，用 CSS 绘制（边框 + 衬线字），不依赖图片。各科用字：数学「數」、物理「物」、计算机「機」、经济「經」、哲学「哲」、人文「文」。

### 6.2 字体

- 标题/条目名：Noto Serif SC（OFL），构建前用 fonttools 子集化为 GB2312 + ASCII + 常用符号，Regular 与 SemiBold 两档，woff2 存 `public/fonts/`（预估合计 < 6 MB）；
- 正文/UI：系统字体栈 `system-ui, -apple-system, "HarmonyOS Sans SC", sans-serif`；
- 缺字自动回退系统字体，不阻断渲染。

### 6.3 排版式封面（不用视频封面图）

VideoCard 的「封面」为色块排版卡：学科印章 + 标题前 20 字 + UP 主，背景为按学科区分的低饱和纸色（六科各一色，均落在宣纸色系内）。原因：

1. bilibili 图片有防盗链（需 Referer），WebView 内加载不可靠；
2. 统一排版比杂乱封面更符合「庄重」；
3. 彻底移除图片加载失败态。

### 6.4 图标
- App 图标：宣纸底 + 朱砂方印「格致」，`scripts/gen-icons.mjs` 从 SVG 渲染各密度 PNG，配置 adaptive icon；
- 通知小图标：单色印章剪影（Android small icon 必须单色）。

## 7. bilibili 元数据补充

### 7.1 接口

- `GET https://api.bilibili.com/x/web-interface/view?bvid={bvid}`
- 只取：`title`、`duration`（秒）、`stat.view`、`owner.name`、`pic`（不展示，不用封面）；
- 无登录、无 Cookie；请求 UA 使用 App 默认 UA。

### 7.2 策略

- 触发时机：详情页打开时；信息流不批量请求。
- 频率：同一 bvid 24h 内只请求一次（`metaCache` 判定）；请求间隔 ≥ 1s（全局串行队列）。
- 失败（412/网络错/接口变更）：静默使用内置数据；`enrichEnabled=false` 时完全不联网。
- 只在原生环境启用（`Capacitor.isNativePlatform()`）；浏览器 dev 模式直接跳过。

### 7.3 边界

- 仅元数据读取，不下载视频、不绕过任何付费/登录限制；
- App 内不出现 bilibili 商标品牌元素；
- 接口为非官方公开接口，若日后失效，App 功能降级为纯内置库，不视为缺陷。

## 8. 通知

- 本地定时通知，默认每日 20:00（设置可改）。
- 预排未来 30 天，每条文案「今日一题已备好 · 静下心来想三分钟」；点击打开 App 今日页。
- 权限：
  - Android 13+ `POST_NOTIFICATIONS`（插件 `requestPermissions` 请求）；
  - Android 12+ `SCHEDULE_EXACT_ALARM`（`allowWhileIdle: true`，首次引导提示开启精确闹钟）；
  - 重启后不自动恢复：每次打开 App 时检查并补排未来 30 天（已知限制写入设置页说明）。
- 设置页：开关、时间选择、`测试通知`（3 秒后发一条）、权限与白名单引导文案（荣耀 MagicOS：设置 → 电池 → 应用启动管理 → 允许自启动/手动管理）。
- 通知发送内容不依赖网络。

## 9. 推荐信息流算法（确定性、纯本地）

1. `seed = 自 2026-01-01 起的天数（本地时区）`；
2. mulberry32(seed) 生成种子随机序列；
3. 对合并后的条目做种子洗牌；
4. 稳定重排保证同科目连续不超过 2 条；
5. 收藏过 / 有学习记录的学科，其条目整体前移到列表前半区（保持相对次序），实现轻量偏好加权。

约束：同一天、同一偏好状态下列表恒定（可测试）；不做隐式追踪，偏好只来自收藏和学习记录，全部留在本机。
每日一课取当日列表第 1 条；今日一题取 `seed % 30`。

## 10. 构建与发布

### 10.1 本地开发

- `npm run dev`：浏览器开发（联网补充自动停用，其余功能可用）；
- `npm test`：Vitest；
- `npm run build`：tsc + vite build。

### 10.2 GitHub Actions（`.github/workflows/android.yml`）

触发：push 到 main（构建 artifact）与 tag `v*`（发布 Release）。

步骤：
1. setup-node 24 → `npm ci` → `npm test` → `npm run build`；
2. setup JDK 21 → setup Android SDK（`android-actions/setup-android`）；
3. `npx cap sync android`；
4. 若存在 Secrets 则解码签名 keystore 到 `android/app/gezhi-release.keystore`（gitignored），`gradlew assembleRelease`；否则回退 `assembleDebug`；
5. 上传 APK artifact；tag 触发时创建 GitHub Release 附 APK。

签名（一次性配置，用户侧已完成 secret 写入后生效）：
- `GEZHI_KEYSTORE_BASE64`、`GEZHI_KEYSTORE_PASSWORD`、`GEZHI_KEY_ALIAS`、`GEZHI_KEY_PASSWORD`；
- `android/app/build.gradle` 增加 release signingConfig（环境变量缺省时回退 debug 签名）；
- `versionCode` 使用 `github.run_number + 100`，`versionName` 同步 package.json。

### 10.3 安装

- 手机浏览器打开 Release 下载 APK → 允许「安装未知应用」→ 安装；
- 覆盖升级依赖同一签名，故必须使用持久 keystore（见上）。

## 11. 测试策略

### 11.1 单元测试（Vitest）

1. merge：内置 + 添加 − 移除；冲突去重；
2. bvid 解析：裸 BV、完整 URL（含参数）、非法输入；
3. rotation：同日同偏好结果恒定；不同日不同序；同科目连续 ≤2；收藏学科前移；
4. 每日一课/一题：确定性；题目轮换均匀（seed 连续 30 天覆盖全 30 题）；
5. store：损坏 JSON 回退默认值；写后读一致；
6. bilibili 缓存：24h TTL（fake timers）、失败回退；
7. format：播放量与时长格式化（万/小时）。

### 11.2 组件冒烟

- 今日页渲染每日卡与列表；收藏切换更新状态；添加内容表单校验。

### 11.3 CI 校验

- 每次 push：测试 + web 构建 + Android assemble 成功（不发布）；
- tag：Release 附 APK。

### 11.4 真机验收清单（用户在 Magic8 执行并反馈）

1. 安装成功、图标为印章、启动进入 Onboarding；
2. 三标签、六个学科、详情页正常；
3. 「去 bilibili 学习」可在浏览器/官方 App 中打开视频；
4. 通知权限授予后，测试通知 3 秒内到达；修改时间后按新时间发送；
5. 收藏、添加内容（BV 解析）、移除内置条目，杀掉 App 重开仍保留；
6. 飞行模式下打开 App：内置内容完整可用，无报错；
7. 联网时详情页能看到播放量/时长补充（若接口可用）。

## 12. 风险与缓解

| 风险 | 缓解 |
|---|---|
| bilibili 非官方接口限流/失效 | 低频 + 24h 缓存 + 静默回退 + 可关闭；不视为缺陷 |
| MagicOS 杀后台导致通知不来 | 首次引导 + 精确闹钟权限 + 电池白名单文案 + 测试通知 + 打开 App 补排 |
| CI 签名配置出错导致无法覆盖安装 | 持久 keystore 入 Secrets；CI 无 Secrets 时回退 debug；README 写明配置步骤 |
| 选中内容失效/下架 | `verify-content.mjs` 定期校验；详情页打开失败由浏览器兜底提示 |
| 字体子集缺字 | 系统字体回退；子集覆盖 GB2312 常用字 |
| Capacitor 升级破坏兼容 | 锁定主版本，v1 不升级 |

## 13. 验收标准

- CI 绿：测试通过、web 构建、Android 打包成功；
- Release APK 在荣耀 Magic8 安装并满足 11.4 全部 7 项；
- 内容：六学科各 ≥10 条精选，全部通过 BV 校验；30 道今日一题含答案；
- 视觉：无娱乐元素、无第三方图片依赖、离线可完整浏览；
- 代码：无登录凭证、无遥测、无第三方统计。

## 14. 后续（v0.2+，不在本 spec 范围）

- 学习计划/番茄钟、笔记联动（对接本地 math-kb）；
- 学科内更多内容与「今日一题」扩展；
- 若 Capacitor 生态支持，评估应用内 WebView 播放；
- 深色模式（水墨夜间主题）。
