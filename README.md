# 风声赫立的博客

Hexo 7.3.0 + Butterfly 5.3.5。仓库里只有**源码**：`master` 分支提交 `source/`，GitHub Actions 负责构建并把 `public/` 发布到 GitHub Pages。仓库根目录不再保存生成后的 HTML。

## 目录约定

```
source/_posts/
  2025/03/
    hello-world.md
    assets/hello-world/类与合并.png     ← 图片跟文章放在一起
  2026/09/
    Agent工作流思考.md
    使用autofigure项目的说明.md
    assets/使用autofigure项目的说明/image.png
```

- 文章按 **年/月** 归档，`hexo new` 会自动落到当前月份目录。
- 每篇文章的图片放在**同级**的 `assets/<文章名>/` 下。
- 文章里写相对路径即可：`![说明](assets/某篇文章/图片.png)`。
  构建时 `scripts/post-assets.js` 会把它改写成
  `/2026/09/04/某篇文章/assets/某篇文章/图片.png`，并把文件挂到该地址，因此首页、归档、RSS 都不会断图。

## 新建文章

```bash
npx hexo new "我的新文章"
```

会生成 `source/_posts/<年>/<月>/我的新文章.md`。也可以直接手写该文件：

```markdown
---
title: 我的新文章
date: 2026-09-10 09:00:00
updated: 2026-09-10 09:00:00
author: 王赫杰
tags:
  - 随笔
categories:
  - 学习笔记
---

正文。
```

## 插图

在 VS Code 里直接往 Markdown 粘贴/拖入图片即可。`.vscode/settings.json` 里已经配好：

```json
"markdown.copyFiles.destination": { "**/*.md": "assets/${documentBaseName}/${fileName}" }
```

图片会落在 `assets/<当前文档名>/`，并自动插入相对链接，Hexo 端无需额外设置。

## 本地预览

```bash
npm install
npm run server
```

`npm run validate` 单独校验 front matter 与图片引用；`npm run generate` 等于校验 + 清理 + 构建。

## 发布

两种方式，效果一样（提交 → 推送 → Actions 构建 → Pages 上线）：

1. **VS Code 插件一键发布**：命令面板执行 `博客：一键发布`，或按 `Ctrl+Alt+P`，或点状态栏的「发布博客」。插件会先跑 `npm run validate`，再 `git add -A`、`git commit`、`git push`，并给出 Actions 链接。
2. **命令行**：

   ```bash
   git add source/_posts
   git commit -m "post: 我的新文章"
   git push
   ```

首次使用工作流前，需要在仓库 `Settings -> Pages -> Build and deployment -> Source` 选择 `GitHub Actions`。

## 插件安装

插件源码在 `tools/vscode-extension/`，打包产物是 `.vsix`：

```bash
cd tools/vscode-extension
npx @vscode/vsce package
code --install-extension blog-publisher-0.1.0.vsix
```

## 历史

旧架构把 Hexo 生成的 HTML 直接提交到仓库根目录（`2025/`、`2026/`、`archives/`、`index.html` 等）。切换到源码架构后这些文件已删除，文章内容由 `tools/migrate-generated-site.cjs`（已随清理移除）迁移进 `source/_posts/`，原始 HTML 仍可从 git 历史中找回。
