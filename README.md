# 风声赫立的博客

本站使用 Hexo 7.3.0 和 Butterfly 5.3.5。文章源文件位于 `source/_posts/`，提交到 `master` 后，GitHub Actions 会自动把 Markdown 构建为 HTML 并部署到 GitHub Pages。

## 新建文章

可以先用 Hexo 原生命令生成带时间、作者等字段的 Markdown：

```bash
npx hexo new "我的新文章"
```

也可以直接在 `source/_posts/` 下创建 `my-post.md`：

```markdown
---
title: 我的新文章
date: 2026-08-22 20:00:00
updated: 2026-08-22 20:00:00
author: 王赫杰
tags:
  - 随笔
categories:
  - 学习笔记
---

这里写 Markdown 正文。
```

同名图片可以放在 `source/_posts/my-post/` 中，并在文章里使用 `![说明](图片名.png)`。

## 本地预览

```bash
npm install
npm run server
```

## 发布

提交 Markdown 和图片并推送即可：

```bash
git add source/_posts
git commit -m "add post"
git push
```

第一次使用工作流前，在仓库的 `Settings -> Pages -> Build and deployment -> Source` 中选择 `GitHub Actions`。原有文章只有生成后的 HTML，现已通过 `tools/migrate-generated-site.cjs` 将旧文章和本地图片恢复到 Hexo 源目录。
