# AGENTS.md

## 语言和项目

请始终使用中文回复。

WillowTab 是一个浏览器新标签页扩展，支持切换搜索引擎、壁纸和纯色背景，以及深色和浅色主题。

如果当前工作树根目录存在 `AGENTS.local.md`，开工前一并读取。本机的绝对路径、运行时位置和代理设置放在该文件中。新建工作树后，可以将本机说明复制到该工作树的根目录。

## Codex 与 Antigravity 协作

共用同一个 Git 仓库。用 GitHub Issue 记录任务和分工，用 PR 交接和评审，由仓库维护者决定合并和发版。

### 分工和工作目录

- 单个任务默认一方实现、另一方评审。实现方在任务分支提交，评审方按 Issue 验收并在 PR 留下结果，由实现方修复问题。轮流工作时可以共用工作目录，提交后再交接。
- 并行开发两项独立任务时，从同一个 `main` 提交分别创建任务分支。在仓库旁用 `git worktree` 检出各自的工作目录，例如 `UniTab-codex` 和 `UniTab-antigravity`。第一条 PR 合并后，第二条同步最新的 `main` 再复测。
- 并行任务会改到同一处代码时，例如 `js/settings.js` 或 `newtab.html` 的同一区域，先在 Issue 指定一方负责该处改动，另一方在该提交上评审或接着做。
- 大功能由 Antigravity 先在主 Issue 写明交互、边界情况和验收步骤。维护者确认后，由 Codex 实现，Antigravity 验收。拆成多条 PR 时，在主 Issue 记录依赖顺序，后续任务从前置 PR 合并后的 `main` 开工。

### Issue 和 PR

- 沿用现有 Issue 模板。开工前记录目标、实现方、评审方、预计改动的文件、前置依赖和可执行的验收步骤。涉及另一方负责的文件时，先在 Issue 协调。
- PR 关联 Issue，说明改动、执行过的验证命令及结果。界面变更附截图。同步 `main` 时如遇合并冲突，由该 PR 的实现方解决并重新提交评审。

## 验证

- 修改协作规则时，在两个新工作目录中核对 `AGENTS.md` 的版本和内容，并用 `git check-ignore -v -- AGENTS.local.md` 确认本机说明被忽略。
- 功能变更运行 `node scripts/validate-runtime.js`。涉及配色或主题时加跑 `node scripts/validate-colors.js`。
- 界面变更用实际 Chromium 验证 Issue 中的操作。设置变更还应检查重新打开新标签页后的状态。根据改动检查控制台、DOM 和网络请求，例如搜索建议是否按开关状态发送请求。
- 内置 Browser 无法打开 `file://` 或本地端口受限时，用 Python 启动本地静态服务器，再用 Node 和 Playwright 启动系统 Chrome 或 Edge 的无界面实例，访问 `http://127.0.0.1:<port>/newtab.html`。如果 `python` 指向 Windows Store 占位符，使用本机说明中的 Python。检查后关闭浏览器、停止服务器并删除临时脚本。

## 商店版和发版

共享代码先改仓库根目录的对应文件。合并前由 Codex 在 PR 分支运行 `node scripts/build-chrome-store.js`，检查同步结果和 `chrome-store/` 中的商店版专属改动。

发版前依次运行下面的命令。

```bash
node scripts/build-chrome-store.js
node pack-zip.js generic
node pack-zip.js chrome
node scripts/validate-release.js
```

扩展 ZIP 一律用现有的 Node.js `pack-zip.js` 生成。由发版校验检查相对目录结构、重复条目、根目录的 `manifest.json` 和 `_locales/*/messages.json` 路径。

## AutoResearch

AutoResearch 的文件和运行产物都应由 `.gitignore` 忽略。仓库已有相关产物或当前任务用到 AutoResearch 时，提交或推送前运行 `git status --short --untracked-files=all` 和 `git ls-files -- autoresearch 'autoresearch/*' '**/autoresearch/*'`，确认相关文件均未跟踪或暂存。
