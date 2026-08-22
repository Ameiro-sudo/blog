const i="post2",l="博客更新日志",n="2026-06-06",e="11:00",o="4 分钟",d=["更新"],u=!1,c="post2.md",r="",t="assets/vendor/images/posts/cover-px-5.webp",s="2026-06-06 更新 文章系统 - Markdown 写作，支持置顶 / 分页 / 搜索 / 标签筛选 / 标签云 - 全文搜索匹配标题 + 标签 + 日期 + 正文摘要 - 搜索关键词黄色高亮显示 - 每页 5 篇，底部分页栏支持跳转 归档与热力图 - 按年月分组展示所有文章和相册 - 年度贡献热力图（GitHub 风格），4 级颜色浓度 - 支持切换年份 - 点击方块查看当日文章列表 画",a=1143,h=`<h2 id="2026-06-06-更新">2026-06-06 更新</h2>
<h3 id="文章系统">文章系统</h3>
<ul>
<li>Markdown 写作，支持置顶 / 分页 / 搜索 / 标签筛选 / 标签云</li>
<li>全文搜索匹配标题 + 标签 + 日期 + 正文摘要</li>
<li>搜索关键词黄色高亮显示</li>
<li>每页 5 篇，底部分页栏支持跳转</li>
</ul>
<h3 id="归档与热力图">归档与热力图</h3>
<ul>
<li>按年月分组展示所有文章和相册</li>
<li>年度贡献热力图（GitHub 风格），4 级颜色浓度</li>
<li>支持切换年份</li>
<li>点击方块查看当日文章列表</li>
</ul>
<h3 id="画廊">画廊</h3>
<ul>
<li>瀑布流相册列表（堆叠卡片动效）</li>
<li>相册详情 CSS columns 瀑布流布局</li>
<li>分批加载（IntersectionObserver，每次 12 张，预加载下一批）</li>
<li>灯箱缩放（滚轮 / 双击 / 触摸双指）</li>
<li>灯箱平移（鼠标拖拽 / 触摸单指）</li>
<li>EXIF 信息展示（相机、ISO、光圈、快门、焦距、尺寸）</li>
</ul>
<h3 id="文章阅读体验">文章阅读体验</h3>
<ul>
<li>文章目录（TOC）：基于 h2/h3 自动生成，滚动高亮当前章节</li>
<li>阅读进度条：顶部 3px 渐变色条，随滚动填充</li>
<li>相关文章推荐：按标签重合度排序</li>
<li>代码块：Atom One Dark 高亮、语言标签、一键复制</li>
<li>图片灯箱：文章中图片点击放大</li>
<li>字数统计</li>
</ul>
<h3 id="导航与路由">导航与路由</h3>
<ul>
<li>Hash 路由：<code>#/</code> <code>#/archive</code> <code>#/gallery</code> <code>#/gallery/相册ID</code> <code>#/about</code> <code>#/random</code></li>
<li>随机文章路由</li>
<li>导航栏高亮当前页面</li>
<li>简介卡片：头像 / 昵称 / 简介 / 社交链接</li>
</ul>
<h3 id="构建系统">构建系统</h3>
<ul>
<li><code>scripts/build.js</code>：生成文章 + 相册索引、RSS、Sitemap、版本哈希</li>
<li>异步 EXIF 提取（exifr 包，图片目录并行解析）</li>
<li>相册目录自动扫描，同名 webp/jpg 去重</li>
<li>每次构建写入时间戳，前端 fetch 带 <code>?v=TS</code> 防缓存</li>
</ul>
<h3 id="部署">部署</h3>
<ul>
<li><code>deploy.sh</code>：构建 + 提交 + 推送博客</li>
<li><code>deploy-full.sh</code>：WebP 转换 + 推 my-images + 推博客</li>
<li><code>-n</code> 参数跳过 WebP 转换</li>
</ul>
<h3 id="图片-cdn">图片 CDN</h3>
<ul>
<li><code>cdn.jsdelivr.net/gh/Ameiro-sudo/my-images@main</code> 引用</li>
<li><code>?t=BUILD_TS</code> 时间戳刷新 CDN 缓存</li>
<li>Service Worker 缓存 CDN 图片</li>
<li><code>deploy-full.sh</code> 自动用 ffmpeg 转换 webp</li>
</ul>
<h3 id="设计系统">设计系统</h3>
<ul>
<li>毛玻璃暗色设计（backdrop-filter blur + 半透明背景）</li>
<li>ZCOOL KuaiLe 标题字体</li>
<li>SVG 晶体加载器动画</li>
<li>Canvas 雪花粒子</li>
<li>暗色模式自适应</li>
<li>打印样式优化</li>
</ul>
<h3 id="其他">其他</h3>
<ul>
<li>RSS 订阅 <code>feed.xml</code></li>
<li>Sitemap <code>sitemap.xml</code></li>
<li>动态 OG 标签（社交分享卡片）</li>
<li>CSS/JS 自动版本哈希（<code>?v=8位MD5</code>）</li>
<li>响应式布局，移动端适配</li>
</ul>
<h3 id="已知问题">已知问题</h3>
<ul>
<li><a href="http://raw.githubusercontent.com">raw.githubusercontent.com</a> 在国内访问不稳定，已改用 jsDelivr CDN</li>
</ul>
`,p={id:i,title:l,date:n,time:e,readTime:o,tags:d,pinned:!1,file:c,description:"",image:t,excerpt:s,wc:1143,html:h};export{n as date,p as default,r as description,s as excerpt,c as file,h as html,i as id,t as image,u as pinned,o as readTime,d as tags,e as time,l as title,a as wc};
