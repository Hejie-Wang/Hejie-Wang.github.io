---
title: 使用 AutoFigure-Edit 项目的说明
date: 2026-09-04 11:00:00
updated: 2026-09-04 11:00:00
author: 王赫杰
tags:
  - AutoFigure-Edit
  - 科研工具
categories:
  - 工具使用
---

# AutoFigure-Edit 说明

## 项目介绍

![AutoFigure-Edit 项目界面](image.png)

AutoFigure-Edit 是一个在 Github 上的开源项目，能将论文的方法部分自动转化为完全可编辑的 SVG 插图，并支持在嵌入式 SVG 编辑器中进行微调。

## 配置方法

### Step 1: 克隆项目到本地并安装依赖

打开项目主页：https://github.com/ResearAI/AutoFigure-Edit

仓库右上角有一个绿色的按钮，其写着`Code`，点击它会弹出一个下拉菜单，选择`HTTPS`，然后点击旁边的复制按钮，将仓库地址复制到剪贴板。

> https://github.com/ResearAI/AutoFigure-Edit.git

直接安装较慢，项目整体大约100MB左右，需要5-10分钟，因此推荐采用 Github 加速下载代理。网站：https://gh-proxy.com/

将原始链接黏贴到输入框中，点击`转换链接`，然后复制转换后的链接。

![GitHub 下载代理页面](image-1.png)

得到链接如下：

> https://v4.gh-proxy.org/https://github.com/ResearAI/AutoFigure-Edit

在本地希望储存仓库的文件夹，右键 -> 在终端打开，输入以下命令：

```bash
git clone https://v4.gh-proxy.org/https://github.com/ResearAI/AutoFigure-Edit
```

则远端仓库中的代码会被克隆到本地的 AutoFigure-Edit 文件夹中。如果使用cmd或PowerShell，需要先将git添加到环境变量中，如果没有添加，则可以使用git bash来执行命令。

![克隆项目示例](image-3.png)

(我的由于已经克隆到了本地，因此再次克隆时候会报错，提示`fatal: destination path 'AutoFigure-Edit' already exists and is not an empty directory.`，如果你是第一次克隆，则不会报错。)

克隆之后，就能在本地文件夹找到 AutoFigure-Edit 文件夹，进入该文件夹，打开终端，输入以下命令安装依赖：

```bash
pip install -r requirements.txt
```

（如果想要在conda环境中安装依赖，可以使用以下命令）

```bash
conda create -n autofigure python=3.12
conda activate autofigure
pip install -r requirements.txt
```

这样会创建一个名为`autofigure`的conda环境，其使用的python版本为3.12，并安装所需的依赖。

注意，这里如果pip没有换源，那么安装依赖会非常慢，建议使用国内的pip源，例如中科大的pip源

```bash
pip install -r requirements.txt -i https://pypi.mirrors.ustc.edu.cn/simple/
```

经过大约5分钟左右的等待，基本上就能安装完依赖了。

### Step 2: 启动网页端运行项目

项目给出了三种运行方式，网页端最好上手。推荐使用这个方法。

在AutoFigure-Edit 文件夹中，打开终端，输入以下命令：

```bash
conda activate autofigure
python server.py
```

会出现如下输出：

```bash
(autofigure) E:\Github-projects\AutoFigure-Edit>python server.py
--- Starting Server ---
Local access: http://127.0.0.1:8000
-----------------------
INFO:     Started server process [15440]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

将浏览器打开，输入网址 <http://127.0.0.1:8000>，就能得到如下界面：

![AutoFigure-Edit 网页端](image-4.png)

可以看到，这里有两种使用模式，第一种是粘贴论文方法部分的文本，之后项目会走一个pipeline：
> gpt-image-2 生成图片 -> png2svg 将图片转化为svg -> svg-edit 编辑svg 
第二种是直接上传图片，之后项目会走一个pipeline：
> png2svg 将图片转化为svg -> svg-edit 编辑svg 

这里需要填写两个api key，分别是`OpenAI API Key`和`Roboflow API Key`，如果没有这两个key，则无法使用项目。

### Step 3: 获取OpenAI API Key

这里我们使用的是MICU中转站的gpt-image-2模型，需要为其首先申请一个api key，才能使用该模型。

进入micu中转站的官网：https://www.micuapi.ai/ （注意一定要开梯子，不然访问不了gpt等国外模型）

在导航栏右上方，点击`控制台`，进入控制台页面。

在控制台页面中，点击左侧的`API 密钥`，进入API密钥管理页面。

点击右上角`创建API密钥`，在弹出的对话框中，输入一个名称，为这个API密钥命名，建议命名为`gpt-image-2`，然后选择分组，在下拉菜单中寻找`gpt_image_2`，选择它，然后点击`保存更改`，其他配置保持默认即可。

![创建 API 密钥](image-5.png)

之后返回到API密钥管理页面，就能看到刚刚创建的API密钥，点击密钥旁边的按钮，将其复制到剪贴板中。

![复制 API 密钥](image-6.png)

就完成了OpenAI API Key的获取。

回到AutoFigure-Edit的网页端，将获取的API Key填入，注意上方按钮选择`自定义`，来输入自定义模型提供商。

![填写模型与 API 配置](image-7.png)

其中必要信息如下：

```text
SVG模型：gpt-5.5
步骤 1 图片 Provider: 自定义
图片模型: gpt-image-2
主 API Key： sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx(填入你自己的gpt-5.5 API Key)
自定义 API URL: https://www.micuapi.ai/v1
图片路线 API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx(填入你自己的gpt-image-2 API Key)
图片路线 API URL: https://www.micuapi.ai/v1
... 保持默认 ...
```

由于micu中转站的gpt-5.5模型和gpt-image-2模型需要不同的API Key，因此需要分别填写。gpt-5.5模型的API Key填入主 API Key，gpt-image-2模型的API Key填入图片路线 API Key。gpt-5.5模型的获取方式与gpt-image-2模型类似，都是在micu中转站的官网申请。
唯一区别是分组，gpt-image-2模型的分组是`gpt_image_2`，而gpt-5.5模型的分组是`vip_2`，剩余流程完全相同。

解释一下，我们选择方案 1：OpenAI 主路线。其中SVG / 推理 Provider 选 OpenAI Responses，步骤 1 图片 Provider 保持与 SVG 路径一致，Image Model 用 gpt-image-2，SVG Model 用 gpt-5.5。这里SVG模型选用多模态大模型，可以根据文本和图像输入，生成高质量的SVG图像；而图像模型，则直接选用gpt-image-2，能够直接处理图像。

**注意，非常重要**

micu生图的api需要更改Autofigure-Edit的源码，才能使用gpt-image-2模型。更改`autofigure2.py`中的代码。我会将更改后的代码一同展示，放在结尾附件中。

![需要修改的源码位置](image-8.png)

### Step 4: 获取Roboflow API Key

进入Roboflow官网：https://roboflow.com/，点击右上角的 Sign Up 按钮，注册一个账号。

可以使用邮箱注册，也可以使用 Google、GitHub 等第三方账号注册。随意选择一个注册方式，完成注册后，登录 Roboflow。

即可进入 Roboflow 的主界面

![Roboflow 控制台](image-9.png)

在左侧栏，选择`Settings`->`API Keys`，进入 API Keys 页面。

![Roboflow API Keys 页面](image-10.png)

找到`Private API Key`，复制到剪贴板中。

完成Roboflow API Key的获取。

回到项目浏览器页面，粘贴到`SAM3 API Key`输入框中。

详细信息如下:

```text
SAM3 后端: Roboflow API
SAM Prompt: 保持默认
SAM3 API Key： xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx(填入你自己的Roboflow API Key)
```

---

至此，我们所有的配置都完成了，接下来就可以使用AutoFigure-Edit来生成SVG图像了。

## 使用方法

随便找了一段论文的方法论部分文本，作为示例，选择了论文《Mastering the game of Go with deep neural networks and tree search》，其方法部分如下：

```text
根据论文《Mastering the game of Go with deep neural networks and tree search》，AlphaGo 的核心研究方法结合了深度神经网络和蒙特卡洛树搜索（MCTS）。

### 核心研究方法

AlphaGo 的方法主要包括以下几个阶段：

1.  **监督学习（SL）策略网络训练**：
    *   首先，通过监督学习训练一个策略网络 $p_\sigma$ 来预测人类专家的走法。
    *   这个网络使用卷积层和整流非线性激活函数，最终通过 softmax 层输出所有合法走法的概率分布。
    *   训练数据来自 KGS 围棋服务器的 3000 万个局面，预测准确率达到 57.0%。
    *   **核心公式**：
        $$ \Delta\sigma\propto\frac{\partial\log p_{\sigma}(a\mid s)}{\partial\sigma} $$
        这个公式表示通过随机梯度上升来最大化人类走法 $a$ 在给定状态 $s$ 下的对数似然来更新策略网络 $p_\sigma$ 的权重 $\sigma$。

2.  **强化学习（RL）策略网络训练**：
    *   在 SL 策略网络的基础上，通过策略梯度强化学习训练一个 RL 策略网络 $p_\rho$。
    *   该网络通过自我对弈来优化最终的胜负结果，而不是仅仅最大化预测准确率。
    *   **核心公式**：
        $$ \Delta\rho\propto\frac{\partial\log p_{\rho}(a_{t}\mid s_{t})}{\partial\rho}z_{t} $$
        这个公式表示通过随机梯度上升来更新 RL 策略网络 $p_\rho$ 的权重 $\rho$，以最大化在时间步 $t$ 选择动作 $a_t$ 并在状态 $s_t$ 下的预期结果 $z_t$。

3.  **价值网络（Value Network）训练**：
    *   训练一个价值网络 $v_\theta(s)$ 来预测给定局面 $s$ 的胜负结果。
    *   该网络与策略网络结构相似，但输出的是一个单一的胜负预测值，而不是概率分布。
    *   为了避免过拟合，训练数据来自 3000 万个独立的自我对弈局面。
    *   **核心公式**：
        $$ \varDelta\theta\propto\frac{\partial\nu_{\theta}(s)}{\partial\theta}(z-\nu_{\theta}(s)) $$
        这个公式表示通过随机梯度下降来更新价值网络 $v_\theta$ 的权重 $\theta$，以最小化预测值 $v_\theta(s)$ 与实际结果 $z$ 之间的均方误差。

4.  **结合蒙特卡洛树搜索（MCTS）**：
    *   AlphaGo 将策略网络和价值网络与 MCTS 算法结合起来，通过前瞻搜索来选择动作。
    *   MCTS 模拟会遍历搜索树，选择具有最大动作价值 $Q$ 和探索奖励 $u(P)$ 的边。
    *   叶子节点会通过策略网络进行扩展，并由价值网络和快速走子策略的蒙特卡洛模拟进行评估。
    *   动作价值 $Q$ 会根据所有评估结果进行更新。
    *   **核心公式**：
        $$ a_{t}=\operatorname{a r g m a x}(Q(s_{t},a)+u(s_{t},a)) $$
        $$ u(s,a)\propto\frac{P(s,a)}{1+N(s,a)} $$
        第一个公式表示在时间步 $t$ 选择动作 $a_t$ 以最大化动作价值 $Q(s_t, a)$ 加上一个探索奖励 $u(s_t, a)$。第二个公式表示探索奖励 $u(s,a)$ 与先验概率 $P(s,a)$ 成正比，并随着对该动作的访问次数 $N(s,a)$ 增加而衰减，以鼓励探索。
        $$ V(s_{L})=(1-\lambda)v_{\theta}(s_{L})+\lambda z_{L} $$
        这个公式表示叶子节点 $s_L$ 的评估 $V(s_L)$ 是价值网络预测 $v_\theta(s_L)$ 和快速走子策略模拟结果 $z_L$ 的加权平均，其中 $\lambda$ 是混合参数。
        $$ \begin{aligned}N(s,a)=&amp;\sum_{i=1}^{n}1
```

生成效果如图

![AutoFigure 生成效果](figure.png)

说明内置提示词功底很不错，之后生成的png也可以成功转为svg，并且可以在svg编辑器中进行微调。

![SVG 编辑效果](image-11.png)

唯一有一个问题，就是生成的svg图像中，由于Roboflow的SAM3模型似乎没有合理配置提示词，导致没有办法很好地分割图像中的不同部分，生成的svg图像中，所有的图像元素都被当作一个整体，无法单独编辑每个元素。我后面再琢磨一下，看看怎么搞这里的更改

## 附件1： autofigure2.py源码更改

改动1：

```python
# 改动前
if provider == "custom":
    return _call_openai_compatible_image_generation(prompt, api_key, model, base_url, reference_image)

# 改动后
if provider == "custom":
    return _call_openai_compatible_image_generation(
        prompt, api_key, model, base_url, reference_image, image_size
    )
```

改动2：

```python
# 源码
def _call_openai_compatible_image_generation(
    prompt: str, api_key: str, model: str, base_url: str,
    reference_image: Optional[Image.Image] = None,
) -> Optional[Image.Image]:
    """使用 OpenAI SDK 调用自定义 OpenAI 兼容图像生成接口"""

# 改动后
def _call_openai_compatible_image_generation(
    prompt: str, api_key: str, model: str, base_url: str,
    reference_image: Optional[Image.Image] = None,
    image_size: str = GEMINI_DEFAULT_IMAGE_SIZE,
) -> Optional[Image.Image]:
    """
    优先尝试 chat/completions「文本内嵌 base64 图片」协议（部分中转站支持）。
    若网关不支持该用法（例如 micu 只提供 /v1/images/generations，chat 通道会 404），
    或聊天结果中解析不到图片，则自动回退到标准 OpenAI Images API
    （images.generate / images.edit，对应 /v1/images/generations|edits）。
    """
```

改动3：
```python
# 源码:只走 chat 一条路,失败/空/无图统统静默 return None,调用方只能拿到"失败"
completion = client.chat.completions.create(model=model, messages=messages)
content = completion.choices[0].message.content if completion and completion.choices else None
if not content:
    return None            # ← 空回复直接放弃,没有下一步
...
return None                # ← 解析不到 data URI 也直接放弃

# 改动后:chat 失败 → 打印原因 → 自动切换到 Images API
def _fallback_to_images_api(reason):
    print(f"[Custom/OpenAI-compatible] chat/completions 出图不可用（{reason}），自动回退到 Images API ...")
    return _call_openai_image_generation(prompt, api_key, model, base_url, reference_image, image_size)

try:
    completion = client.chat.completions.create(model=model, messages=messages)
except Exception as chat_err:          # ← micu 的 404 就在这里被接住
    return _fallback_to_images_api(str(chat_err))

content = completion.choices[0].message.content if completion and completion.choices else None
if not content:
    return _fallback_to_images_api("chat 返回为空")      # 原来是 return None
...
if match:
    ...
    return Image.open(io.BytesIO(image_data))

return _fallback_to_images_api("chat 未返回可解析的 data URI 图片")  # 原来是 return None
```

