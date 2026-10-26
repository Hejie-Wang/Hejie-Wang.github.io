---
title: 如何用好Latex-workshop
date: 2026-10-26 17:38:00
updated: 2026-10-26 17:38:00
author: 王赫杰
tags:
  - Latex
  - Latex-workshop
categories:
  - Latex
---

# 如何用好Latex-workshop

在宇宙级编译器VSCode中编写latex是一件很方便的事情，写好了`tex`文件，就面临着一个编译的问题。一般在VSCode中都是使用插件`Latex-workshop`进行编译的操作，该插件负责调度各个Latex引擎，把源文件顺利编译为结果pdf，如何编写其配置文件呢，这是一个需要学习和整理一下的内容，现简要介绍一下。

本文主要介绍简单文件（不涉及交叉引用和参考文献编译）和复杂文件（涉及参考文献编译）两种情况的配置方法。

## 简单文件的配置方法

一般，`latexmk`是可以自动调度各个Latex引擎的，不需要显式指定`xelatex`或者`pdflatex`。对一般对于中文稿件，使用`xelatex`进行编译，可以允许中文命名的文件名，使用`pdflatex`则不行。一般来讲，路径中含有中文，则不太要紧，基本上都能编译成功。

`Latex-workshop`插件的配置文件是`settings.json`，需要放在工作目录的`.vscode`文件夹中。如果打开的编辑器根目录和当前工作目录各有一个`settings.json`，则优先使用根目录的`settings.json`，这点值得注意。

`Latex-workshop`插件的配置文件中，主要有两个配置项需要注意：`latex-workshop.latex.tools`和`latex-workshop.latex.recipes`。前者是指定编译工具，后者是指定编译方法。下面给出一个简单文件的配置示例：

```json
{
    "latex-workshop.latex.tools": [
        {
            "name": "xelatex",
            "command": "xelatex",
            "args": [
                "-synctex=1",
                "-interaction=nonstopmode",
                "-file-line-error",
                "-output-directory=%DIR%/build",
                "%DOC%"
            ]
        }
    ],
    "latex-workshop.latex.recipes": [
        {
            "name": "xelatex",
            "tools": [
                "xelatex"
            ]
        }
    ]
}
```

其中，第一项`latex-workshop.latex.tools`中，指定了一个编译工具`xelatex`，其命令为`xelatex`，并指定了编译参数。`-synctex=1`表示生成同步文件，`-interaction=nonstopmode`表示在编译过程中遇到错误时继续编译，`-file-line-error`表示在输出错误信息时显示文件名和行号，`-output-directory=%DIR%/build`表示将生成的文件输出到`build`目录中，`%DOC%`表示当前编辑的文档。

这些信息基本上可以满足一般的编译需求了，保持默认就行了。当然，如果有特殊需求，也可以根据自己的需要进行修改。

第二项`latex-workshop.latex.recipes`中，指定了一个编译方法`xelatex`，其使用的工具为前面定义的`xelatex`。这样，当我们在VSCode中选择编译方法为`xelatex`时，就会使用前面定义的编译工具进行编译。

一般简单文件的编译recipe只需要一个tool就可以了，复杂文件的编译recipe则需要多个tool进行串行处理。还有一种常见的tool是`latexmk`，参数设置如下：

```json
{
    "name": "latexmk",
    "command": "latexmk",
    "args": [
        "-synctex=1",
        "-interaction=nonstopmode",
        "-file-line-error",
        "-pdf",
        "-outdir=%DIR%/build",
        "%DOC%"
    ]
}
```

recipe的设置如下：

```json
{
    "name": "latexmk",
    "tools": [
        "latexmk"
    ]
}
```

pdflatex相较于xelatex来说，编译速度更快，但是不支持中文文件名，且不支持中文字体。需要设置的话，设置方法基本相同，只需要将`xelatex`替换为`pdflatex`即可。

## 复杂文件的配置方法

使用 BibTeX 的毕业论文的编译，最常见的是三次编译：

```text
XeLaTeX → BibTeX → XeLaTeX → XeLaTeX
```

| 步骤 | 作用 |
|---|---|
| 第一次 XeLaTeX | 排版正文，写出标签、引用和目录等辅助信息 |
| BibTeX | 读取引用信息和 `.bib` 数据库，生成文献表 `.bbl` |
| 第二次 XeLaTeX | 读入文献表与辅助信息，更新正文引用及页面布局 |
| 第三次 XeLaTeX | 继续更新交叉引用、目录页码，使结果趋于稳定 |

这个通常可以看模板的`README.md`说明，或者参考demo的`tex`文件的magic comment，指定recipe如下：

```json
{
    "name": "毕业论文：XeLaTeX + BibTeX",
    "tools": [
        "xelatex",
        "bibtex",
        "xelatex",
        "xelatex"
    ]
}
```

整体来讲，`latex-workshop`插件的配置方法还是比较简单的，只需要在`settings.json`文件中指定编译工具和编译方法即可。相较于之前接触过的`CMake`编译方法，这个也可以说是相当友善了。


## 奇妙的小问题

对于`latex-workshop`插件来说，理论上配置好了`settings.json`文件，就可以顺利编译了。但是事实上，如果`tex`源码开头的magic comment中指定了编译方法，则会覆盖`settings.json`文件中的配置，导致编译失败。这个问题社区中有很多人遇到过，解决方法是在`settings.json`文件中添加如下配置：

```json
    "latex-workshop.latex.build.enableMagicComments": false
```
从而禁用magic comment的功能，避免其覆盖`settings.json`文件中的配置。

最后，为了个人学习方便，参考教程，整理了一个pdf文件，有较为齐全的配置方法，供大家参考。下方可以直接翻页预览，也可以点「新窗口」或「下载」：

{% pdf assets/如何用好Latex-workshop/LaTeX_Workshop_编译配置教程.pdf LaTeX Workshop 编译配置教程 %}

## 参考教程

- [LaTeX Workshop Documentation](https://github.com/James-Yu/LaTeX-Workshop)
