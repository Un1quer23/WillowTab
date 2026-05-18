# WillowTab

一个特别的浏览器新标签页扩展，致力于为您带来简洁高效的浏览器启动与搜索体验。

A unique browser new tab extension for a clean and efficient browsing start.

## 功能 / Features

- **实时时钟与问候** — 大号数字时钟，根据时段自动问候
- **多引擎搜索** — Google / Baidu / Bing / DuckDuckGo，一键切换，实时联想
- **壁纸模式** — 本地图片文件夹作为背景，文字颜色自适应，毛玻璃效果
- **浅色 / 深色主题** — 跟随系统或手动切换，暖色调护眼
- **字体切换** — 衬线体 / 系统默认 / 等宽体
- **可调圆角与阴影** — 胶囊 / 微圆 / 方正，阴影强度可调
- **标签页名称自定义** — 自定义浏览器标签页标题，留空使用默认
- **中英双语** — 根据浏览器语言自动切换
- **零追踪** — 所有数据存储在本地，不上传任何服务器

> Live clock with greetings · Multi-engine search · Wallpaper gallery with frosted glass · Light/dark themes · Font switching · Adjustable radius & shadow · Custom tab title · i18n (zh-CN/en) · Zero tracking

## 安装 / Install

> **Microsoft Edge 商店**与 **Chrome Web Store** 均处于审核中，暂无法从商店安装。请从 GitHub 下载使用。

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
