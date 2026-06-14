# WillowTab

一款支持多引擎搜索、本地壁纸、主题和本地优先设置的 Chromium 新标签页扩展。

A Chromium new tab extension with multi-engine search, local wallpapers, themes, and local-first settings.

## 功能 / Features

- **实时时钟与问候** — 大号数字时钟，根据时段自动问候
- **多引擎搜索** — Google / Baidu / Bing / DuckDuckGo，一键切换，实时联想
- **壁纸模式** — 本地图片/文件夹作为背景，支持批量管理、拖拽排序与自动轮播
- **自适应可读性** — 根据壁纸自动优化文字、控件和搜索框观感
- **浅色 / 深色主题** — 跟随系统或手动切换，暖色调护眼
- **字体切换** — 衬线体 / 系统默认 / 等宽体
- **可调圆角与阴影** — 胶囊 / 微圆 / 方正，阴影强度可调
- **标签页名称自定义** — 自定义浏览器标签页标题，留空使用默认
- **中英双语** — 根据浏览器语言自动切换
- **本地优先** — 个性化设置和壁纸数据保存在浏览器本地

> Live clock with greetings · Multi-engine search · Wallpaper gallery with batch management and rotation · Adaptive readability · Light/dark themes · Font switching · Adjustable radius & shadow · Custom tab title · i18n (zh-CN/en) · Local-first settings

## 安装 / Install

### Google Chrome

Google Chrome 用户建议直接从 Chrome Web Store 安装：

[从 Chrome Web Store 安装](https://chromewebstore.google.com/detail/willowtab/gfigaeaddejhmnlkeppgccklahgepapm)

> Google Chrome users should install WillowTab directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/willowtab/gfigaeaddejhmnlkeppgccklahgepapm).

### Microsoft Edge

Edge 用户建议直接从 Microsoft Edge 扩展商店安装：

[从 Microsoft Edge 扩展商店安装](https://microsoftedge.microsoft.com/addons/detail/willowtab/ljkgjcbecpanckomdgebinggfhpkmmph)

> Edge users should install WillowTab directly from [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/willowtab/ljkgjcbecpanckomdgebinggfhpkmmph).

### 其他 Chromium 浏览器 / Other Chromium Browsers

1. 下载 [最新版本](https://github.com/Un1quer23/WillowTab/releases/latest) 的 `WillowTab-v*.zip`
2. 解压到本地文件夹
3. 打开 `chrome://extensions`（Edge 为 `edge://extensions`），启用「开发者模式」
4. 点击「加载已解压的扩展」，选择解压后的文件夹

> Download the [latest release](https://github.com/Un1quer23/WillowTab/releases/latest), unzip, then load unpacked in `chrome://extensions` (or `edge://extensions`) with developer mode on.

## 项目结构 / Structure

```
WillowTab/
├── manifest.json          # 扩展配置
├── newtab.html            # 新标签页
├── privacy-policy.html    # 隐私政策
├── css/
│   └── style.css
├── js/
│   ├── i18n.js            # 国际化（中/英）
│   ├── search.js          # 搜索引擎与联想
│   ├── clock.js           # 时钟与问候
│   ├── settings.js        # 设置面板
│   └── theme.js           # 主题管理
└── icons/
```

## 隐私政策 / Privacy Policy

[隐私政策](https://un1quer23.github.io/WillowTab/privacy-policy.html) · [Privacy Policy](https://un1quer23.github.io/WillowTab/privacy-policy.html)

## 开源协议 / License

[GNU General Public License v3](LICENSE)

---

Think Different.
