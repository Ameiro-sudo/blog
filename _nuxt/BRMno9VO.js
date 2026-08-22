const t="post8",n="喜报！Bocchi Client 1.0",e="2026-08-22",o="03:17",d="6 分钟",i=["Mod","开发记录"],c=!1,a="post8.md",h="",s="assets/vendor/images/posts/cover-px-4.webp",r="喜报！Bocchi Client 1.0 正式发布了🎉 上回书说到，这只从模板改出来的客户端才刚出生（出生记录 ）。出生第 18 天，直接办成人礼：版本号跳到 1.0.0，双 MC 版本 × 双加载器，四个 jar 整整齐齐上架 GitHub Releases。 半个月从 0.1 干到 1.0，凭什么 凭审计。本来打完 0.3.0 就想直接拍 1.0 tag，被按住了：再审几轮，干净就发。行，那",l=1766,p=`<p>喜报！Bocchi Client 1.0 正式发布了🎉</p>
<p>上回书说到，这只从模板改出来的客户端才刚出生（<a href="https://blog.snowblock.top/#/post7">出生记录</a>）。出生第 18 天，直接办成人礼：版本号跳到 1.0.0，双 MC 版本 × 双加载器，四个 jar 整整齐齐上架 GitHub Releases。</p>
<h2 id="半个月从-01-干到-10凭什么">半个月从 0.1 干到 1.0，凭什么</h2>
<p>凭审计。本来打完 0.3.0 就想直接拍 1.0 tag，被按住了：再审几轮，干净就发。行，那就审。</p>
<p>先把帧率救回来。之前每个按钮每帧都做一次全屏离屏染色，5 个按钮就是每帧 5 次全屏 saveLayer……改成 Picture 录制缓存复用，染色层缩到图标包围盒。主菜单终于不像幻灯片放映了。</p>
<p>然后 R3 到 R7 五轮正式审计：</p>
<div class="table-responsive"><table>
<thead>
<tr>
<th>轮次</th>
<th>审什么</th>
<th>战果</th>
</tr>
</thead>
<tbody>
<tr>
<td>R3</td>
<td>渲染资源生命周期</td>
<td>Skia 那套 stencil/alpha 栈机制整体是空壳，全仓 grep 零调用方，净删 271 行。删代码一时爽</td>
</tr>
<tr>
<td>R4</td>
<td>并发与事件</td>
<td>零改动。事件的生产和消费全在主客户端线程，线程封闭成立。白审一轮（褒义）</td>
</tr>
<tr>
<td>R5</td>
<td>配置健壮性</td>
<td>挖出狠活：字体加载只捕 IOException，材质包里塞个坏 ttf 能把主菜单炸黑屏。现在坏了就回退系统字体，顶多丑点，不装死</td>
</tr>
<tr>
<td>R6</td>
<td>输入与 mixin</td>
<td>两棵树 18 个 mixin 逐个过目，零改动。看着像死代码的 Redirect 其实是互补关系，删了才叫出事</td>
</tr>
<tr>
<td>R7</td>
<td>元数据 + 资产终扫</td>
<td>双树资源哈希级比对；模组图标接上（NeoForge 的 logoFile 之前是悬空的）；删掉 257KB 没人引用的孤儿字体；description 占位符换真话</td>
</tr>
</tbody>
</table></div>
<p>顺手还修了个 BooleanSetting 参数传反的潜伏 bug：value 和 defaultValue 对调，真实值直接 null。这种 bug 平时人畜无害，发作时你怀疑人生。</p>
<h2 id="悲报发布当天jar-里中文全是乱码">悲报：发布当天，jar 里中文全是乱码</h2>
<p>喜报发完没高兴多久，保底审查实锤一个大活：</p>
<p>Gradle 读 gradle.properties 按 .properties 的老规矩用 ISO-8859-1 解码。「自」字的 UTF-8 三字节 E8 87 AA 被逐字节当成仨拉丁字符再编码，原样写进 META-INF/neoforge.mods.toml——NeoForge 模组列表的中文描述直接变附魔台铭文，对，就是谁都读不懂的那种。</p>
<p>更绝的是 fabric.mod.json 压根没写 description 字段，Fabric 那边连乱码都没有，一片空白。</p>
<p>之前一直没炸是因为描述一直是纯英文占位符，中文一上就现形。</p>
<p>处理简单粗暴：旧 v1.0 的 tag 和 Release 全删 → 构建脚本显式按 UTF-8 重读 description → fabric 补上字段 → 重挂 tag，CI 自动重建双 Release → 四个 jar 逐个字节复验：严格 UTF-8、中文正常、图标在位、零 \${} 残留。</p>
<p>所以 1.0 不是审出来的，是审完又翻车翻出来的。悲报 → 抢救 → 还是喜报。</p>
<h2 id="下载">下载</h2>
<div class="table-responsive"><table>
<thead>
<tr>
<th>MC 版本</th>
<th>加载器</th>
<th>下载</th>
</tr>
</thead>
<tbody>
<tr>
<td>1.21.5</td>
<td>Fabric / NeoForge</td>
<td><a href="https://github.com/Ameiro-sudo/bocchi-mod/releases/tag/v1.0-1.21.5">GitHub Releases: v1.0-1.21.5</a></td>
</tr>
<tr>
<td>1.21.1</td>
<td>Fabric / NeoForge</td>
<td><a href="https://github.com/Ameiro-sudo/bocchi-mod/releases/tag/v1.0-1.21.1">GitHub Releases: v1.0-1.21.1</a></td>
</tr>
</tbody>
</table></div>
<p>每个 Release 里 Fabric 和 NeoForge 各一个 jar。安装老规矩：丢 mods 文件夹。</p>
<h2 id="最后">最后</h2>
<p>致谢照抄出生那篇：模板 <a href="https://github.com/baier233/bocchi-template-1.21.5">bocchi-template-1.21.5</a>（CC0）</p>
<p>接下来干嘛还没想好。设置面板、让黑胶转起来、给菜单配点声音，候补名单排着呢。反正波奇酱已经转正了，工资 0，跟我一样。</p>
<p>源码：<a href="https://github.com/Ameiro-sudo/bocchi-mod">github.com/Ameiro-sudo/bocchi-mod</a></p>
`,b={id:t,title:n,date:e,time:o,readTime:d,tags:i,pinned:!1,file:a,description:"",image:s,excerpt:r,wc:1766,html:p};export{e as date,b as default,h as description,r as excerpt,a as file,p as html,t as id,s as image,c as pinned,d as readTime,i as tags,o as time,n as title,l as wc};
