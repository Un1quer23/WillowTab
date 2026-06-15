# WillowTab

**语言:** [English](README.md) | 简体中文

WillowTab 是一款简洁优雅的新标签页扩展，提供干净的搜索入口、多搜索引擎切换、浅色/深色主题和个性化外观设置，让每次打开新标签页都更专注、更舒适。

![WillowTab 主界面](https://raw.githubusercontent.com/Un1quer23/WillowTab/main/docs/screenshots/en-main-page.png)

## 主要特性

### 简洁搜索入口 / 多引擎切换

你可以使用页面中央的搜索框快速开始搜索。WillowTab 支持多搜索引擎切换，你可以根据自己的习惯选择 Google、百度、Bing 或 DuckDuckGo；也可以开启搜索联想，让输入关键词更顺手。

### 个性化背景

支持纯色背景、本地图片和文件夹导入。你可以管理多张壁纸，并按自己的偏好手动选择或自动切换；壁纸模式下也会优化文字、控件和搜索框的显示效果，尽量保持清晰易读。

### 浅色 / 深色主题

支持浅色、深色以及跟随系统主题，在不同时间和使用环境下都保持舒适观感。

### 外观自定义

支持调整字体、圆角、阴影强度、设置按钮位置和标签页标题，让界面更贴近你的使用习惯。

### 隐私友好

WillowTab 不收集、不追踪、不出售个人数据。

WillowTab 适合希望新标签页保持简洁、美观、高效，同时又不想被复杂信息打扰的用户。

## 安装

### Microsoft Edge

Edge 用户建议直接从 Microsoft Edge 扩展商店安装：

[从 Microsoft Edge 扩展商店安装](https://microsoftedge.microsoft.com/addons/detail/willowtab/ljkgjcbecpanckomdgebinggfhpkmmph)

### Google Chrome

Google Chrome 用户建议直接从 Chrome Web Store 安装：

[从 Chrome Web Store 安装](https://chromewebstore.google.com/detail/willowtab/gfigaeaddejhmnlkeppgccklahgepapm)

### 其他 Chromium 浏览器

其他 Chromium 系浏览器用户，请从 GitHub Releases 手动安装：

[GitHub Releases](https://github.com/Un1quer23/WillowTab/releases/latest)

下载 `WillowTab-v1.6.2.zip`，也就是适用于 Chromium 系浏览器的通用版。

手动安装步骤：

1. 下载 `WillowTab-v1.6.2.zip`。
2. 解压到本地文件夹。
3. 打开浏览器扩展管理页面，例如 `chrome://extensions`。
4. 启用“开发者模式”。
5. 点击“加载已解压的扩展”，选择解压后的文件夹。

### Chrome Web Store Package / Chrome 商店特供包

`WillowTab-for-Chrome-v1.6.2.zip` 是为满足 Google 合规要求提供的 Chrome Web Store 特供版，主要用于 Chrome Web Store 提交和审核。

### 发版校验

发版前请运行：

```bash
for file in js/*.js chrome-store/js/*.js pack-zip.js scripts/*.js; do node --check "$file"; done
node scripts/build-chrome-store.js
node pack-zip.js generic
node pack-zip.js chrome
node scripts/validate-release.js
```

校验脚本会检查版本一致性、打包文件是否存在、zip 是否包含当前文件内容，以及 `_locales/*/messages.json` 目录结构是否被正确保留。

## 项目结构

```text
WillowTab/
├── manifest.json
├── newtab.html
├── privacy-policy.html
├── css/
│   └── style.css
├── js/
│   ├── i18n.js
│   ├── search.js
│   ├── clock.js
│   ├── settings.js
│   └── theme.js
├── icons/
└── chrome-store/
```

Chrome Web Store 版本位于 `chrome-store/`。其中 `manifest.json`、`newtab.html`、`js/search.js`、`js/settings.js`、`js/i18n.js`、`privacy-policy.html`、`README.md` 是审核策略相关的覆盖文件。

## 隐私、安全与贡献

- [隐私政策](https://un1quer23.github.io/WillowTab/privacy-policy.html)
- [安全政策](SECURITY.md)
- [贡献指南](CONTRIBUTING.md)

## 开源协议

[GNU General Public License v3](LICENSE)

---

Think Different.
