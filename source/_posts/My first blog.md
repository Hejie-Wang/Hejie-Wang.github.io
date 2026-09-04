---
title: "如何完善自己的个人博客"
date: "2025-03-18T05:05:29.246Z"
updated: "2025-03-18T05:36:22.493Z"
author: 王赫杰
---

<h1 id="第一篇博客："><a href="#第一篇博客：" class="headerlink" title="第一篇博客："></a>第一篇博客：</h1><h2 id="丁伟的毕业论文（bushi）"><a href="#丁伟的毕业论文（bushi）" class="headerlink" title="丁伟的毕业论文（bushi）"></a><del>丁伟的毕业论文</del>（bushi）</h2><h2 id="如何完善自己的个人博客："><a href="#如何完善自己的个人博客：" class="headerlink" title="如何完善自己的个人博客："></a>如何完善自己的个人博客：</h2><h3 id="一、选择便捷图片上传—从图床做起"><a href="#一、选择便捷图片上传—从图床做起" class="headerlink" title="一、选择便捷图片上传—从图床做起"></a>一、选择便捷图片上传—从图床做起</h3><p><img src="https://cdn.jsdelivr.net/gh/Hejie-Wang/blog-image@master/img/202503180712900.webp"></p>
<p>个人采取的搭建方式为：Github+picgo搭建博客图床</p>
<p>网上有很多搭建图床的教程，这里这里连带自己的实践加摘录别人的内容进行搭建：</p>
<p>文章附录如下：</p>
<p>1.<a target="_blank" rel="noopener" href="https://blog.csdn.net/xdnxl/article/details/129466060?ops_request_misc=%257B%2522request%255Fid%2522%253A%252240aed2a00fa4c0c887185b369824bd0e%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=40aed2a00fa4c0c887185b369824bd0e&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-2-129466060-null-null.142%5Ev102%5Econtrol&utm_term=%E5%9B%BE%E5%BA%8A%20github&spm=1018.2226.3001.4187">如何用github搭建图床（亲测有效）</a></p>
<p>2.<a target="_blank" rel="noopener" href="https://blog.csdn.net/m0_62742128/article/details/134089237">PicGo打不开？？</a></p>
<p>3.<a target="_blank" rel="noopener" href="https://blog.csdn.net/qq_42455031/article/details/121301716">windows10进入&#x2F;退出管理员账户（Administrator）方法</a></p>
<p>4.<a target="_blank" rel="noopener" href="https://blog.csdn.net/bingqilin_/article/details/100582989">windows 管理员权限编辑文件</a></p>
<h3 id="1-Github相关操作："><a href="#1-Github相关操作：" class="headerlink" title="1. Github相关操作："></a>1. Github相关操作：</h3><ol>
<li>首先创建一个仓库</li>
<li>生成token令牌</li>
</ol>
<h3 id="2-Picgo下载与安装："><a href="#2-Picgo下载与安装：" class="headerlink" title="2. Picgo下载与安装："></a>2. Picgo下载与安装：</h3><ol>
<li>下载没什么好说的，使用的山大的镜像网站</li>
<li>注意下载之后点击右下角的图表才能点开picgo</li>
<li>配置好github的相关事项</li>
</ol>
<h3 id="3-遇到了天大的问题："><a href="#3-遇到了天大的问题：" class="headerlink" title="3. 遇到了天大的问题："></a>3. 遇到了天大的问题：</h3><ol>
<li>一切都准备就绪了，但是picgo上传的照片在github里面找不到，怀疑是DNS污染。因为一般都是开着Steam++访问github的</li>
<li>一夜休息，问题得到了解决，等待一段时间照片就可以显示了。</li>
</ol>
<h3 id="二、配置页面-config："><a href="#二、配置页面-config：" class="headerlink" title="二、配置页面_config："></a>二、配置页面_config：</h3><h4 id="1-前置知识：YAML-语法规范"><a href="#1-前置知识：YAML-语法规范" class="headerlink" title="1. 前置知识：YAML 语法规范"></a>1. 前置知识：YAML 语法规范</h4><ol>
<li><p><strong>常规字符串</strong><br>YAML 默认支持无引号字符串，但若字符串包含特殊符号（如冒号、空格、括号），需用引号包裹。例如：</p>
<p>yaml</p>
<figure class="highlight yaml"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br></pre></td><td class="code"><pre><span class="line"><span class="attr">title:</span> <span class="string">我的博客</span>  <span class="comment"># 无引号（中文字符无特殊符号）</span></span><br><span class="line"><span class="attr">description:</span> <span class="string">&quot;技术博客：记录开发与算法&quot;</span>  <span class="comment"># 含冒号，需引号</span></span><br></pre></td></tr></table></figure>
</li>
<li><p><strong>布尔值&#x2F;数字</strong><br>布尔值（<code>true</code>&#x2F;<code>false</code>）和数字无需引号：</p>
<p>yaml</p>
<figure class="highlight yaml"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br></pre></td><td class="code"><pre><span class="line"><span class="attr">marked:</span></span><br><span class="line">  <span class="attr">smartypants:</span> <span class="literal">false</span>  <span class="comment"># 直接写布尔值（网页1示例）</span></span><br></pre></td></tr></table></figure></li>
</ol>
<h4 id="2-前置知识：-Hexo-配置中的中文处理"><a href="#2-前置知识：-Hexo-配置中的中文处理" class="headerlink" title="2.前置知识： Hexo 配置中的中文处理"></a>2.前置知识： Hexo 配置中的中文处理</h4><ol>
<li><p><strong>涉及路径或分类的配置</strong></p>
<ul>
<li><p>若路径或分类名含空格或特殊符号，需用双引号包裹：</p>
<p>yaml</p>
<figure class="highlight yaml"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br></pre></td><td class="code"><pre><span class="line"><span class="attr">permalink:</span> <span class="string">&quot;posts/:year/:month/:title/&quot;</span></span><br><span class="line"><span class="attr">categories:</span> [<span class="string">&quot;编程&quot;</span>, <span class="string">&quot;人工智能&quot;</span>]  <span class="comment"># 数组项含中文</span></span><br></pre></td></tr></table></figure></li>
</ul>
</li>
<li><p><strong>禁用引号转换</strong><br>若发现中文字符显示异常（如英文引号被转换为中文引号），需在 <code>marked</code> 配置中禁用 <code>smartypants</code>（网页1）：</p>
<p>yaml</p>
<figure class="highlight yaml"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br></pre></td><td class="code"><pre><span class="line"><span class="attr">marked:</span></span><br><span class="line">  <span class="attr">smartypants:</span> <span class="literal">false</span>  <span class="comment"># 禁用自动转换引号</span></span><br></pre></td></tr></table></figure></li>
</ol>
<h3 id=""><a href="#" class="headerlink" title=""></a></h3><h4 id="3-具体操作："><a href="#3-具体操作：" class="headerlink" title="3. 具体操作："></a>3. 具体操作：</h4><p><a target="_blank" rel="noopener" href="https://butterfly.js.org/">butterfly作者详细指导如何实现个人博客</a></p>
<table>
<thead>
<tr>
<th align="center">操作</th>
<th>更改内容</th>
<th>注意事项</th>
</tr>
</thead>
<tbody><tr>
<td align="center">修改网站资料</td>
<td>_config.yml</td>
<td></td>
</tr>
<tr>
<td align="center">导航</td>
<td>参数设置</td>
<td>跟网页图标关联</td>
</tr>
<tr>
<td align="center"></td>
<td>目录</td>
<td>网页右上角目录</td>
</tr>
<tr>
<td align="center">代码块</td>
<td>代码高亮主题</td>
<td></td>
</tr>
<tr>
<td align="center"></td>
<td>代码框展开&#x2F;关闭</td>
<td></td>
</tr>
<tr>
<td align="center">图片设置</td>
<td>头像</td>
<td>默认不会旋转</td>
</tr>
<tr>
<td align="center"></td>
<td>顶部图</td>
<td>没有添加即为默认</td>
</tr>
<tr>
<td align="center"></td>
<td>页脚背景图</td>
<td>默认空白</td>
</tr>
<tr>
<td align="center"></td>
<td>网站背景</td>
<td></td>
</tr>
<tr>
<td align="center">首页</td>
<td>网站副标题</td>
<td>在sub中直接敲出座右铭</td>
</tr>
</tbody></table>
<p>简要实现博客基本功能，大头基本都在作者的博客之中讲解到位了，后续心得会继续更新在博客上面。</p>
