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
