---
title: "Agent and Sandbox"
date: "2026-08-15T09:00:00.000Z"
updated: "2026-08-15T09:00:00.000Z"
author: 王赫杰
---

<p><img src="image-2.png"></p>
<h2 id="问题描述："><a href="#问题描述：" class="headerlink" title="问题描述："></a>问题描述：</h2>
<p>在使用 Claude Code / Codex / Harness 过程中，发现 WSL 侧文件夹无法很好执行命令行命令，故记录本博客</p>
<h2 id="症候描述："><a href="#症候描述：" class="headerlink" title="症候描述："></a>症候描述：</h2>
<p>若配置文件在windows侧：</p>
<table>
<thead>
<tr>
<th>工作目录位置</th>
<th>Claude Code</th>
<th>Codex</th>
<th>Harness</th>
</tr>
</thead>
<tbody><tr>
<td>WSL 侧</td>
<td>可以</td>
<td>可以</td>
<td>不可以</td>
</tr>
<tr>
<td>Windows 侧</td>
<td>可以</td>
<td>可以</td>
<td>不可以</td>
</tr>
</tbody></table>
<p>若配置文件在 WSL 侧：</p>
<table>
<thead>
<tr>
<th>工作目录位置</th>
<th>Claude Code</th>
<th>Codex</th>
<th>Harness</th>
</tr>
</thead>
<tbody><tr>
<td>WSL 侧</td>
<td>可以</td>
<td>可以</td>
<td>无法跨平台</td>
</tr>
</tbody></table>
<p>针对 vs code 插件：</p>
<table>
<thead>
<tr>
<th>工作目录位置</th>
<th>Claude Code</th>
<th>Codex</th>
<th>Harness</th>
</tr>
</thead>
<tbody><tr>
<td>vs code 插件</td>
<td>可以</td>
<td>可以</td>
<td>暂时没有插件</td>
</tr>
<tr>
<td>CLI</td>
<td>上述表格</td>
<td>上述表格</td>
<td>上述表格</td>
</tr>
</tbody></table>
<h2 id="分析"><a href="#分析" class="headerlink" title="分析"></a>分析</h2>
<p>其中配置文件在windows侧，那么在WSL侧执行命令行命令时，是通过wsl.exe来执行的，也就是使用windows的shell来执行命令，并且在linux侧看来，其本质就是root</p>
<p>其中codex和harness具有较为严格的sandbox机制，导致在使用workspace write模式时，无法在WSL侧执行命令行命令。而claude code本身执行各种命令时候都需要人为批准，所以自动化程度不高，也没有看出在windows和wsl侧执行命令有什么差异。</p>
<p>还有一种解决办法，就是在wsl侧直接安装codex和claude，当然现在无法安装harness。这样配置文件和工作目录都在wsl侧，使用的命令也时bash 格式，也就不会出现命令跨平台的问题</p>
<p>其实最开始我使用copilot的时候，也出现过这里的问题。无法写入wsl侧的文件夹，copliot主体在windows侧，推测遇到的问题和 harness 一样。</p>
<p>harness的sandbox机制，首先会确定“会话工作区”的属主和 ACL（访问控制列表），然后在执行命令时，会检查当前执行命令的用户是否在会话工作区的ACL中，从而判定是否超出权限范围。但是现在它调用 Windows API <code>GetNamedSecurityInfoW</code> 时，针对 <code>\\wsl.localhost\Ubuntu-20.04\home\whj-2004\UAV_Project</code> 的路径，会返回错误码 1 。由于这里的报错发生在沙箱初始化阶段，所以导致整个沙箱初始化失败，无法执行命令。因此 harness 不能将wls侧的文件夹作为工作目录。</p>
<p>继续深入分析，对<code>\\wsl.localhost\Ubuntu-20.04\home\whj-2004\UAV_Project</code>和<code>C:\</code>使用<code>Get-Acl</code>命令，发现WSL侧不能正常返回安全描述符，而windows侧可以。这说明是 WSL 的 Plan 9 文件系统驱动本身不完整支持 Windows 的安全描述符查询 API。因此，即使将windows侧的文件夹作为工作目录，告知 harness 访问的localhost 和 username，harness 也无法正确获取 WSL 侧的 ACL，从而导致无法执行命令。于是只有 Full access 模式才可以在wsl侧执行命令行命令。</p>
<p>我又在codex上面重新测试了一下，发现将wsl侧目录作为工作目录时候，沙箱初始化时候 agent 确实把它标记为可写，但是 Windows 原生沙箱对 <code>\\wsl.localhost\...</code> 的实际支持不可靠，表现为访问 WSL UNC 路径时被拒绝。</p>
<h2 id="总结"><a href="#总结" class="headerlink" title="总结"></a>总结</h2>
<p>其实走到这里，才发现原来官方 OpenAI 文档已经建议了：工作流原本就在 WSL2 或依赖 Linux 工具时，应选择 WSL 环境，而不是 Windows 原生沙箱。 <a target="_blank" rel="noopener" href="https://learn.chatgpt.com/docs/windows/windows-sandbox">https://learn.chatgpt.com/docs/windows/windows-sandbox</a></p>
<p>那么，最后经过尝试，有几个可行的办法：</p>
<ol>
<li>在 WSL 侧直接安装 codex 和 claude，工作目录和配置文件都在 WSL 侧，这样就不会出现跨平台的问题。</li>
<li>harness 开启 Full access 模式，但是这样就失去了 harness 的安全性和隔离性。</li>
<li>针对codex，可以将项目放到 Windows NTFS 路径下，从而解决沙箱访问 WSL UNC 路径时被拒绝的问题。</li>
</ol>
