# 博客一键发布（VS Code 扩展）

给 [风声赫立的博客](https://hejie-wang.github.io) 用的博客工作台：左侧活动栏常驻一个「博客」视图，把写完之后要做的事都收在一处。

## 左侧「博客」视图

活动栏里的书本图标 → **博客工作台**，五个入口：

| 入口 | 说明 |
| --- | --- |
| **发布博客** | 校验 → `git add -A` → 输入提交信息 → `git commit` → `git push`，成功后可直接打开站点或查看 Actions。右侧会显示「N 个文件待提交 / 无改动」 |
| **选择标签和分类** | 给当前文章挑选 `tags` / `categories`：多选、显示每个标签被几篇文章用过、右上角 `+` 可以新建。改完自动保存 |
| **进行校验** | 运行 `tools/validate-posts.cjs`，检查 front matter、图片与附件引用，出错时打开输出面板 |
| **新建文章** | 输入标题 → `hexo new` 建到 `source/_posts/<年>/<月>/` 并打开 |
| **打开远端网页** | 展开后有：站点首页、当前文章的线上页面、当前文章的 GitHub 源码、Actions 构建记录、GitHub 仓库 |

视图标题栏还有两个按钮：🚀 发布、↻ 刷新。保存文件、切换编辑器、发布或校验完成后，视图会自动刷新。

「选择标签和分类」「当前文章的线上页面」「当前文章的 GitHub 源码」优先取当前编辑器里的 `.md`；如果当前不是文章，会弹出文章列表让你选。

## 命令一览

| 命令 | 快捷键 |
| --- | --- |
| `博客：发布博客` | `Ctrl+Alt+P`（macOS `Cmd+Alt+P`） |
| `博客：选择标签和分类` | |
| `博客：进行校验` | |
| `博客：新建文章` | |
| `博客：打开站点首页` | |
| `博客：打开当前文章的线上页面` | |
| `博客：打开当前文章的 GitHub 源码` | |
| `博客：打开 Actions 构建记录` | |
| `博客：打开 GitHub 仓库` | |
| `博客：刷新侧边栏` | |

## 设置

| 设置项 | 默认值 | 说明 |
| --- | --- | --- |
| `blogPublisher.validateBeforePublish` | `true` | 发布前运行校验脚本 |
| `blogPublisher.remote` | `origin` | 推送远端名 |
| `blogPublisher.siteUrl` | `https://hejie-wang.github.io` | 站点根地址，用来打开站点和拼出文章线上地址 |

线上地址按 `_config.yml` 的 `permalink: :year/:month/:day/:title/` 拼接：文章 front matter 的 `date` + 文件名。

## 安装 / 更新

```bash
cd tools/vscode-extension
npx @vscode/vsce package                               # 产物 blog-publisher-x.y.z.vsix
code --install-extension blog-publisher-x.y.z.vsix --force
```

装完在 VS Code 里执行一次 `Developer: Reload Window`，活动栏才会出现新图标。

卸载：`code --uninstall-extension hejie-wang.blog-publisher`。

## 目录

```
tools/vscode-extension/
  package.json          清单：视图容器、视图、命令、菜单、配置
  extension.js          命令实现 + TreeDataProvider
  lib/front-matter.js   tags / categories 的读写与 permalink 拼接（无第三方依赖）
  media/blog.svg        活动栏图标
```

插件只负责「写完 → 上线」这条链路，构建仍然交给 `.github/workflows/deploy.yml`，本地不生成也不提交 `public/`。
