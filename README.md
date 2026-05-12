# UniTab

一个精致的浏览器新标签页扩展，带来简洁高效的启动与搜索体验。

A refined browser new tab extension for a clean and efficient browsing start.

## 功能 / Features

- **多引擎搜索** — Google / Baidu / Bing / DuckDuckGo，一键切换，实时联想
- **壁纸模式** — 本地图片文件夹作为背景，自适应文字与毛玻璃效果
- **浅色 / 深色主题** — 跟随系统或手动切换，暖色调护眼
- **字体切换** — 衬线体 / 系统默认 / 等宽体
- **可调圆角与阴影** — 胶囊 / 微圆 / 方正，阴影强度可调
- **零追踪** — 无账户、无服务器、无遥测，所有数据存储在本地

> Multi-engine search · Living wallpapers · Light & dark themes · Typography control · Adjustable radius & shadow · Zero tracking

## 安装 / Install

### Microsoft Edge
从 [Edge 加载项商店]() 安装

### Chrome / 其他 Chromium 浏览器
1. 下载 [最新版本](https://github.com/Un1quer23/UniTab/releases/latest) 的 `UniTab-v*.zip`
2. 解压到本地文件夹
3. 打开 `chrome://extensions`，启用「开发者模式」
4. 点击「加载已解压的扩展」，选择解压后的文件夹

> Download the [latest release](https://github.com/Un1quer23/UniTab/releases/latest), unzip, then load unpacked in `chrome://extensions` with developer mode on.

## 项目结构 / Structure

```
UniTab/
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

## 开源协议 / License

[GNU General Public License v3](LICENSE)

---

Think Different.
