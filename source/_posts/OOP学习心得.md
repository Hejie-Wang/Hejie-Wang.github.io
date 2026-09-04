---
title: "OOP学习心得"
date: "2025-03-18T05:49:59.758Z"
updated: "2025-03-18T08:35:26.626Z"
author: 王赫杰
categories:
  - "C++ basic knowledge"
---

<h1 id="OOP学习心得："><a href="#OOP学习心得：" class="headerlink" title="OOP学习心得："></a>OOP学习心得：</h1><h2 id="1-构造函数："><a href="#1-构造函数：" class="headerlink" title="1.构造函数："></a>1.构造函数：</h2><h3 id="1-1-构造函数格式："><a href="#1-1-构造函数格式：" class="headerlink" title="1.1 构造函数格式："></a>1.1 构造函数格式：</h3><figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br></pre></td><td class="code"><pre><span class="line"><span class="comment">//定义：有实际参数传入 &amp;&amp; 默认构造函数</span></span><br><span class="line"><span class="function">Matrix <span class="title">Matrix</span><span class="params">(<span class="type">int</span> m, <span class="type">int</span> n, <span class="type">int</span> &amp; mat)</span></span>;</span><br><span class="line"><span class="function">Matrix <span class="title">Matrix</span><span class="params">()</span></span>;</span><br><span class="line"></span><br><span class="line"><span class="comment">//使用：</span></span><br><span class="line">Matrix m1 = <span class="built_in">Matrix</span>(), m2 = <span class="built_in">Matrix</span>(<span class="number">3</span>, <span class="number">4</span>, mat);	<span class="comment">//显式默认构造函数</span></span><br><span class="line"><span class="function">Matrix <span class="title">m1</span><span class="params">(<span class="number">5</span>, <span class="number">6</span>, mat)</span></span>;							<span class="comment">//隐式调用构造函数，注意不能这么写默认构造函数</span></span><br></pre></td></tr></table></figure>

<h3 id="1-2-什么时候用调用函数："><a href="#1-2-什么时候用调用函数：" class="headerlink" title="1.2 什么时候用调用函数："></a>1.2 什么时候用调用函数：</h3><p><strong>当程序中没有构造函数的时候系统自动生成一个构造函数</strong></p>
<p>但是一旦写了一个构造函数，就一定要对其进行重载，再写一个默认构造函数，不然系统会报错，并且会影响程序正常运行。</p>
<p><strong>在使用类定义对象的时候，就要调用构造函数对其进行初始化</strong></p>
<p>常常初始化是一个好的习惯</p>
<h3 id="1-3-const修饰限定："><a href="#1-3-const修饰限定：" class="headerlink" title="1.3 const修饰限定："></a>1.3 <code>const</code>修饰限定：</h3><ol>
<li><p><code>const Matrix</code> ：意味着 <code>Matrix</code> 对象不能被修改</p>
</li>
<li><p><code>Matrix::Matrix(int rownum, int colnum, double *mat) const</code> ：意味着该成员函数不能对类中的成员做出任何修改</p>
</li>
<li><p>这里面还是有一些门道的：</p>
</li>
</ol>
<figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br><span class="line">9</span><br><span class="line">10</span><br><span class="line">11</span><br><span class="line">12</span><br><span class="line">13</span><br><span class="line">14</span><br><span class="line">15</span><br><span class="line">16</span><br><span class="line">17</span><br><span class="line">18</span><br><span class="line">19</span><br><span class="line">20</span><br><span class="line">21</span><br><span class="line">22</span><br><span class="line">23</span><br><span class="line">24</span><br><span class="line">25</span><br><span class="line">26</span><br><span class="line">27</span><br><span class="line">28</span><br><span class="line">29</span><br><span class="line">30</span><br><span class="line">31</span><br><span class="line">32</span><br><span class="line">33</span><br><span class="line">34</span><br><span class="line">35</span><br></pre></td><td class="code"><pre><span class="line"><span class="comment">//NO, THIS IS A WRONG EXAMPLE</span></span><br><span class="line"><span class="keyword">class</span> <span class="title class_">Date</span></span><br><span class="line">&#123;</span><br><span class="line"><span class="keyword">public</span>:</span><br><span class="line">	<span class="comment">//构造函数</span></span><br><span class="line">	<span class="built_in">Date</span>(<span class="type">int</span> year, <span class="type">int</span> month, <span class="type">int</span> day)</span><br><span class="line">	&#123;</span><br><span class="line">		_year = year;</span><br><span class="line">		_month = month;</span><br><span class="line">		_day = day;</span><br><span class="line">	&#125;</span><br><span class="line">	<span class="function"><span class="type">void</span> <span class="title">Printf</span><span class="params">()</span>			<span class="comment">//void Printf(Data *this)，类型为Date </span></span></span><br><span class="line"><span class="function">	</span>&#123;</span><br><span class="line">		cout &lt;&lt; _year &lt;&lt; <span class="string">&quot;年&quot;</span> &lt;&lt; _month &lt;&lt; <span class="string">&quot;月&quot;</span> &lt;&lt; _day &lt;&lt; <span class="string">&quot;日&quot;</span> &lt;&lt; endl;</span><br><span class="line">	&#125;</span><br><span class="line"><span class="keyword">private</span>:</span><br><span class="line">	<span class="type">int</span> _year;</span><br><span class="line">	<span class="type">int</span> _month;</span><br><span class="line">	<span class="type">int</span> _day;</span><br><span class="line">&#125;;</span><br><span class="line"> </span><br><span class="line"><span class="function"><span class="type">void</span> <span class="title">Func</span><span class="params">(<span class="type">const</span> Date&amp; d)</span>	<span class="comment">//void Func(const Data &amp;d)，类型为const Date</span></span></span><br><span class="line"><span class="function"></span>&#123;</span><br><span class="line">	d.<span class="built_in">Printf</span>();</span><br><span class="line">&#125;</span><br><span class="line"> </span><br><span class="line"><span class="function"><span class="type">int</span> <span class="title">main</span><span class="params">()</span></span></span><br><span class="line"><span class="function"></span>&#123;</span><br><span class="line">	<span class="function">Date <span class="title">d1</span><span class="params">(<span class="number">2023</span>, <span class="number">11</span>, <span class="number">1</span>)</span></span>;</span><br><span class="line">	d<span class="number">1.</span><span class="built_in">Printf</span>();			<span class="comment">//printf(Data &amp;d1)，传参类型为Date</span></span><br><span class="line">	<span class="function">Date <span class="title">d2</span><span class="params">(<span class="number">2023</span>, <span class="number">11</span>, <span class="number">2</span>)</span></span>;</span><br><span class="line">	<span class="built_in">Func</span>(d2);</span><br><span class="line">	<span class="keyword">return</span> <span class="number">0</span>;</span><br><span class="line">&#125;</span><br><span class="line"><span class="comment">//如果需要对this指针类型做出限定，那么可以使用const后缀修饰函数</span></span><br></pre></td></tr></table></figure>

<p>问题如下：</p>
<p><img src="/OOP%E5%AD%A6%E4%B9%A0%E5%BF%83%E5%BE%97/1.png"></p>
<p>修改如下：</p>
<figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br><span class="line">9</span><br><span class="line">10</span><br><span class="line">11</span><br><span class="line">12</span><br><span class="line">13</span><br><span class="line">14</span><br><span class="line">15</span><br><span class="line">16</span><br><span class="line">17</span><br><span class="line">18</span><br><span class="line">19</span><br><span class="line">20</span><br><span class="line">21</span><br><span class="line">22</span><br><span class="line">23</span><br><span class="line">24</span><br><span class="line">25</span><br><span class="line">26</span><br><span class="line">27</span><br><span class="line">28</span><br><span class="line">29</span><br><span class="line">30</span><br><span class="line">31</span><br><span class="line">32</span><br><span class="line">33</span><br><span class="line">34</span><br></pre></td><td class="code"><pre><span class="line"><span class="keyword">class</span> <span class="title class_">Date</span></span><br><span class="line">&#123;</span><br><span class="line"><span class="keyword">public</span>:</span><br><span class="line">	<span class="comment">//构造函数</span></span><br><span class="line">	<span class="built_in">Date</span>(<span class="type">int</span> year, <span class="type">int</span> month, <span class="type">int</span> day)</span><br><span class="line">	&#123;</span><br><span class="line">		_year = year;</span><br><span class="line">		_month = month;</span><br><span class="line">		_day = day;</span><br><span class="line">	&#125;</span><br><span class="line">	<span class="function"><span class="type">void</span> <span class="title">Printf</span><span class="params">()</span>  <span class="type">const</span>     <span class="comment">// void Printf(Date* const this)</span></span></span><br><span class="line"><span class="function">	</span>&#123;</span><br><span class="line">		cout &lt;&lt; _year &lt;&lt; <span class="string">&quot;年&quot;</span> &lt;&lt; _month &lt;&lt; <span class="string">&quot;月&quot;</span> &lt;&lt; _day &lt;&lt; <span class="string">&quot;日&quot;</span> &lt;&lt; endl;</span><br><span class="line">	&#125;</span><br><span class="line"><span class="keyword">private</span>:</span><br><span class="line">	<span class="type">int</span> _year;</span><br><span class="line">	<span class="type">int</span> _month;</span><br><span class="line">	<span class="type">int</span> _day;</span><br><span class="line">&#125;;</span><br><span class="line"> </span><br><span class="line"><span class="function"><span class="type">void</span> <span class="title">Func</span><span class="params">(<span class="type">const</span> Date&amp; d)</span></span></span><br><span class="line"><span class="function"></span>&#123;</span><br><span class="line">	d.<span class="built_in">Printf</span>();   <span class="comment">// d.Printf(&amp;d);</span></span><br><span class="line">&#125;</span><br><span class="line"> </span><br><span class="line"><span class="function"><span class="type">int</span> <span class="title">main</span><span class="params">()</span></span></span><br><span class="line"><span class="function"></span>&#123;</span><br><span class="line">	<span class="function">Date <span class="title">d1</span><span class="params">(<span class="number">2023</span>, <span class="number">11</span>, <span class="number">1</span>)</span></span>;</span><br><span class="line">	d<span class="number">1.</span><span class="built_in">Printf</span>();           <span class="comment">// d1.Printf(&amp;d);</span></span><br><span class="line">	<span class="function">Date <span class="title">d2</span><span class="params">(<span class="number">2023</span>, <span class="number">11</span>, <span class="number">2</span>)</span></span>;</span><br><span class="line">	cout &lt;&lt; endl;</span><br><span class="line">	<span class="built_in">Func</span>(d2);</span><br><span class="line">	<span class="keyword">return</span> <span class="number">0</span>;</span><br><span class="line">&#125;</span><br></pre></td></tr></table></figure>

<h3 id="1-3-2-可能会出现的面试题："><a href="#1-3-2-可能会出现的面试题：" class="headerlink" title="1.3.2 可能会出现的面试题："></a>1.3.2 可能会出现的面试题：</h3><p><strong>const成员函数能不能调用其他成员函数或者其他成员能不能调用const成员函数</strong>：</p>
<p>​		<strong>能否保证const函数内部一定不会对类中成员做任何修改</strong></p>
<ol>
<li>const对象 可以调用 非const成员函数吗？	不能，因为不能保证不修改成员变量</li>
<li>非 const 的成员变量 可以调用 const 成员函数吗？	能，因为函数修不修成员变量改无所谓</li>
<li>const成员函数内可以调用其它的非const成员函数吗？     不可以，<strong>const成员函数内部只能调用const成员函数</strong>。因为const成员函数内部的this指针已经具有常属性的，万一这个非const成员函数去修改了<a target="_blank" rel="noopener" href="https://so.csdn.net/so/search?q=%E6%88%90%E5%91%98%E5%8F%98%E9%87%8F&spm=1001.2101.3001.7020">成员变量</a>的内容就会出问题了</li>
<li>非const成员函数内可以调用其它的const成员函数吗？ 可以  权限缩小</li>
</ol>
<h2 id="2-析构函数："><a href="#2-析构函数：" class="headerlink" title="2.析构函数："></a>2.析构函数：</h2><h3 id="1-1注意事项："><a href="#1-1注意事项：" class="headerlink" title="1.1注意事项："></a>1.1注意事项：</h3><p>如果在函数中使用 <code>new</code> 关键字，则一定在析构函数中释放空间</p>
<figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br></pre></td><td class="code"><pre><span class="line"><span class="comment">//原型&amp;定义：</span></span><br><span class="line">~<span class="built_in">Matrix</span>();</span><br><span class="line">Matrix::~<span class="built_in">Matrix</span>()&#123;&#125;;	<span class="comment">//空析构函数</span></span><br><span class="line">Matrix::~<span class="built_in">Matrix</span>()&#123;		<span class="comment">//执行实际任务的构造函数</span></span><br><span class="line">    <span class="keyword">delete</span> mat;</span><br><span class="line">&#125;</span><br></pre></td></tr></table></figure>

<h2 id="重载运算符："><a href="#重载运算符：" class="headerlink" title="重载运算符："></a>重载运算符：</h2><h3 id="1-成员重载："><a href="#1-成员重载：" class="headerlink" title=".1 成员重载："></a>.1 成员重载：</h3><figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br></pre></td><td class="code"><pre><span class="line"><span class="comment">//str为第一个操作数，[]为第二个操作数，返回值为char类型</span></span><br><span class="line"><span class="type">char</span> &amp; String <span class="keyword">operator</span>[](<span class="type">int</span> i)&#123;</span><br><span class="line">    <span class="keyword">return</span> str[i];</span><br><span class="line">&#125;</span><br><span class="line"><span class="comment">//cout&lt;&lt;str[4]将被转换为cout&lt;&lt;str.operator[](4)</span></span><br><span class="line"><span class="comment">//若声明为char &amp; ，则可以给特定元素赋值</span></span><br></pre></td></tr></table></figure>

<h3 id="2-友元重载："><a href="#2-友元重载：" class="headerlink" title=".2 友元重载："></a>.2 友元重载：</h3><figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br><span class="line">9</span><br><span class="line">10</span><br></pre></td><td class="code"><pre><span class="line"><span class="comment">//演示重载函数原型：重载“==”，判断两字符串是否相等</span></span><br><span class="line"><span class="type">bool</span> <span class="keyword">operator</span>==(<span class="type">const</span> String str1, <span class="type">const</span> String str2)&#123;</span><br><span class="line">    <span class="built_in">return</span> (std::<span class="built_in">strcmp</span>(str<span class="number">1.</span>str, str<span class="number">2.</span>str));</span><br><span class="line">&#125;</span><br><span class="line"><span class="comment">//代码转换：</span></span><br><span class="line"><span class="keyword">if</span>(<span class="string">&quot;love&quot;</span> == answer)</span><br><span class="line"><span class="comment">//转换为：</span></span><br><span class="line"><span class="keyword">if</span>(<span class="keyword">operator</span>==(<span class="string">&quot;love&quot;</span>,answer))</span><br><span class="line"><span class="comment">//转换为：调用构造函数</span></span><br><span class="line"><span class="keyword">if</span>(<span class="keyword">operator</span>==(<span class="built_in">String</span>(<span class="string">&quot;love&quot;</span>),answer))</span><br></pre></td></tr></table></figure>



<h2 id="在类中使用new关键字分配动态内存"><a href="#在类中使用new关键字分配动态内存" class="headerlink" title="在类中使用new关键字分配动态内存"></a>在类中使用<code>new</code>关键字分配动态内存</h2><h3 id="1-程序提供默认函数："><a href="#1-程序提供默认函数：" class="headerlink" title=".1 程序提供默认函数："></a>.1 程序提供默认函数：</h3><p>1.默认构造函数，如果没有定义构造函数</p>
<p>2.默认析构函数，如果没有定义</p>
<p>3.复制构造函数，如果没有定义，初始化使用</p>
<p>4.赋值构造函数，如果没有定义，后续赋值使用</p>
<p>5.地址运算符，如果没有定义</p>
<p>如果没有使用引用传递，那么在调用类的时候，会调用默认复制函数，将类的内容首先复制到一个临时的内存空间中去，然后再复制给函数。然后复制函数再调用析构函数，将临时空间释放。</p>
<h3 id="2-浅复制与深复制："><a href="#2-浅复制与深复制：" class="headerlink" title=".2 浅复制与深复制："></a>.2 浅复制与深复制：</h3><p>1.浅复制：使两个对象指向同一个内存地址，如果其中任何一方将内存空间释放，会出现访问未知的情况。</p>
<p>2.深复制：再开辟出一块内存空间存放将要复制的内容，让指针指向该空间，两块空间彼此独立，互不干扰。</p>
<figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br><span class="line">9</span><br></pre></td><td class="code"><pre><span class="line">StringBad::<span class="built_in">StirngBad</span>(<span class="type">const</span> string &amp; s)&#123;</span><br><span class="line">    num_string ++;</span><br><span class="line">    <span class="type">int</span> len = <span class="built_in">strlen</span>(s);</span><br><span class="line">    <span class="comment">//这里str已经定义：</span></span><br><span class="line">    str = <span class="keyword">new</span> <span class="type">char</span>[len + <span class="number">1</span>];</span><br><span class="line">    <span class="built_in">strcpy</span>(str, s);	<span class="comment">//重新开辟内存空间</span></span><br><span class="line">	cout&lt;&lt;num_string&lt;&lt;<span class="string">&quot;:\&quot;&quot;</span>&lt;&lt;str</span><br><span class="line">        &lt;&lt;<span class="string">&quot;\&quot; object created&quot;</span>&lt;&lt;</span><br><span class="line">&#125;</span><br></pre></td></tr></table></figure>

<p>如果类中使用了new初始化的成员，那么应当定义一个复制函数，以复制指向数据，而不是使用简单复制指向指针</p>
<h3 id="3-1-问题出现原因：默认复制运算符："><a href="#3-1-问题出现原因：默认复制运算符：" class="headerlink" title=".3.1 问题出现原因：默认复制运算符："></a>.3.1 问题出现原因：默认复制运算符：</h3><ul>
<li><p><code>=</code> ：接受并返回一个指向类对象的引用</p>
<figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br></pre></td><td class="code"><pre><span class="line">Class_name &amp; Class_name::<span class="keyword">operator</span>=(<span class="type">const</span> Class_name &amp;) ;</span><br></pre></td></tr></table></figure></li>
</ul>
<p>赋值与复制函数相同，出现了多个指针指向同一块内存区域的行为，于是在一个指针将内存区域释放后，访问出现未定义行为。</p>
<h3 id="3-2-问题解决方案：定义赋值运算符深复制"><a href="#3-2-问题解决方案：定义赋值运算符深复制" class="headerlink" title=".3.2 问题解决方案：定义赋值运算符深复制"></a>.3.2 问题解决方案：定义赋值运算符深复制</h3><figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br><span class="line">9</span><br><span class="line">10</span><br></pre></td><td class="code"><pre><span class="line">StringBad::StringBad &amp; <span class="keyword">operator</span>=(<span class="type">const</span> StringBad &amp; st)&#123;</span><br><span class="line">    <span class="keyword">if</span>(<span class="keyword">this</span> == &amp;st)&#123;</span><br><span class="line">        <span class="keyword">return</span> *<span class="keyword">this</span></span><br><span class="line">    &#125;					<span class="comment">//处理自赋值情况</span></span><br><span class="line">    <span class="keyword">delete</span> [] str;		<span class="comment">//首先将构造str中原本存放内容释放</span></span><br><span class="line">    len = <span class="built_in">strlen</span>(st);</span><br><span class="line">    str = <span class="keyword">new</span> <span class="type">char</span>[len + <span class="number">1</span>];</span><br><span class="line">    <span class="built_in">strcpy</span>(str, st);	<span class="comment">//将st直接复制到str中</span></span><br><span class="line">    <span class="keyword">return</span> *<span class="keyword">this</span>;</span><br><span class="line">&#125;</span><br></pre></td></tr></table></figure>

<p>注意点：</p>
<ol>
<li>使用delete []来释放先前分配内存</li>
<li>不要自赋值</li>
<li>返回指向对象的调用</li>
</ol>
<ul>
<li>注意C+11中使用空指针：<code>nullptr</code></li>
</ul>
<figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br></pre></td><td class="code"><pre><span class="line"><span class="comment">//声明指针为空：</span></span><br><span class="line">	str = <span class="literal">nullptr</span>;</span><br><span class="line"><span class="comment">//默认构造函数分配空间</span></span><br><span class="line">Matrix::<span class="built_in">Matrix</span>()&#123;</span><br><span class="line">    rows = <span class="number">0</span>;			<span class="comment">//rows(0);</span></span><br><span class="line">    cols = <span class="number">0</span>;			<span class="comment">//cols(0);</span></span><br><span class="line">    matrix = <span class="literal">nullptr</span>;	<span class="comment">//matrix(nullptr);</span></span><br><span class="line">&#125;</span><br></pre></td></tr></table></figure>

<h3 id="4-1-静态成员"><a href="#4-1-静态成员" class="headerlink" title=".4.1 静态成员"></a>.4.1 静态成员</h3><h4 id="4-1-1-静态成员变量："><a href="#4-1-1-静态成员变量：" class="headerlink" title=".4.1.1 静态成员变量："></a>.4.1.1 静态成员变量：</h4><p>一个类所有对象公用：因此不能使用<code>this</code>指针来调用</p>
<figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br></pre></td><td class="code"><pre><span class="line"><span class="type">static</span> <span class="type">int</span> num_String ;</span><br></pre></td></tr></table></figure>

<h4 id="4-1-2-静态成员函数："><a href="#4-1-2-静态成员函数：" class="headerlink" title=".4.1.2 静态成员函数："></a>.4.1.2 静态成员函数：</h4><figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br></pre></td><td class="code"><pre><span class="line"><span class="comment">//声明</span></span><br><span class="line"><span class="function"><span class="type">static</span> <span class="type">int</span> <span class="title">HowMany</span> <span class="params">()</span> </span>&#123;<span class="keyword">return</span> num_String;&#125;</span><br><span class="line"><span class="comment">//使用类名和作用域解析运算符调用</span></span><br><span class="line"><span class="type">int</span> count = String::<span class="built_in">HowMany</span>();</span><br></pre></td></tr></table></figure>



<h2 id="继承、派生、多态："><a href="#继承、派生、多态：" class="headerlink" title="继承、派生、多态："></a>继承、派生、多态：</h2><h3 id="2-1-类继承："><a href="#2-1-类继承：" class="headerlink" title="2.1 类继承："></a>2.1 类继承：</h3><h4 id="2-1-1-定义派生类："><a href="#2-1-1-定义派生类：" class="headerlink" title="2.1.1 定义派生类："></a>2.1.1 定义派生类：</h4><figure class="highlight cpp"><table><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br></pre></td><td class="code"><pre><span class="line"><span class="keyword">class</span> <span class="title class_">COperator</span> : <span class="keyword">public</span> CEmployee&#123;</span><br><span class="line">    <span class="keyword">public</span> :</span><br><span class="line">    string Password;</span><br><span class="line">    <span class="function"><span class="type">bool</span> <span class="title">login</span><span class="params">()</span></span>;</span><br><span class="line">&#125;</span><br></pre></td></tr></table></figure>

<p>子类定义与父类相同的成员：隐藏</p>
<h4 id="2-1-2-派生类内部访问基类："><a href="#2-1-2-派生类内部访问基类：" class="headerlink" title="2.1.2 派生类内部访问基类："></a>2.1.2 派生类内部访问基类：</h4><table>
<thead>
<tr>
<th>名称</th>
<th>对内</th>
<th>对派生类</th>
<th>对外&#x2F;用户</th>
</tr>
</thead>
<tbody><tr>
<td>public</td>
<td>可见</td>
<td>可见</td>
<td>可见</td>
</tr>
<tr>
<td>protected</td>
<td>可见</td>
<td>可见</td>
<td>不可见</td>
</tr>
<tr>
<td>private</td>
<td>可见</td>
<td>不可见</td>
<td>不可见</td>
</tr>
</tbody></table>
<p>在<strong>派生类内部</strong>访问基类成员的时候，<strong>不受继承方式的影响</strong>，只看该成员在基类中的访问属性</p>
<p><img src="/OOP%E5%AD%A6%E4%B9%A0%E5%BF%83%E5%BE%97/2.png" alt="这里写图片描述"></p>
<ul>
<li>private类：只能通过成员函数或者友元函数进行访问，在<strong>派生类</strong>不可访问</li>
<li>protected类：与private类类似，但是<strong>派生类</strong>可以访问</li>
<li>public类，不再赘述，一定可以访问</li>
</ul>
<h4 id="2-1-3-派生类外部访问基类："><a href="#2-1-3-派生类外部访问基类：" class="headerlink" title="2.1.3 派生类外部访问基类："></a>2.1.3 派生类外部访问基类：</h4><p> 在<strong>派生类外部</strong>(派生类用户)使用基类成员时： <strong>不同的继承方式决定了基类成员在派生类中的访问属性</strong>， 从而对派生类用户的访问权限产生影响。</p>
<p><img src="/OOP%E5%AD%A6%E4%B9%A0%E5%BF%83%E5%BE%97/3.png" alt="这里写图片描述"></p>
<ul>
<li>private类继承：<strong>基类</strong>所有类型均变为private类，在<strong>派生类外部</strong>不可访问</li>
<li>protected类继承：<strong>基类</strong>中public — protected  protected — protected private — private ,在<strong>派生类外部</strong>均不能访问</li>
</ul>
<p>​					protected 可以被基类的所有派生类使用，可以沿着继承树无限向下传播</p>
<ul>
<li>public继承： <strong>基类</strong>成员在派生类中（<strong>对外部</strong>）保持原有的访问级别</li>
</ul>
<h4 id="2-1-4-父类和子类的构造顺序"><a href="#2-1-4-父类和子类的构造顺序" class="headerlink" title="2.1.4 父类和子类的构造顺序"></a>2.1.4 父类和子类的构造顺序</h4>
