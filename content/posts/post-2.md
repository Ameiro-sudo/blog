# Markdown 样式与代码排版测试
date: 2026-06-05
tags: 测试, Markdown, 排版, Bash, 代码
time: 20:30
readTime: 6 分钟
---
这是一篇综合测试文章，用于展示各种 Markdown 渲染效果。

## 标题层级

### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

## 文本样式

普通文本，**加粗**，*斜体*，~~删除线~~，`行内代码`，[超链接](#)。

## 引用

> 这是一段引用文本。
> 
> 引用可以换行，也支持 **内嵌样式**。
>
> > 嵌套引用也可以。

嵌套引用：

> 编程语言
> > Python
> > JavaScript
> > Rust
>
> 各有千秋

## 无序列表

- 第一项
- 第二项
  - 嵌套项甲
  - 嵌套项乙
- 第三项

## 有序列表

1. 第一步
2. 第二步
   1. 子步骤 A
   2. 子步骤 B
3. 第三步

## 图片

![示例图片](https://picsum.photos/id/104/800/450)

## 表格

| 方案 | 吞吐量 | 延迟 | 成功率 |
|------|--------|------|--------|
| 方案 A | 12500 req/s | 12ms | 99.95% |
| 方案 B | 9800 req/s | 18ms | 99.92% |
| 方案 C | 15200 req/s | 9ms | 99.98% |

## 分割线

---

## 内嵌 HTML

<div style="display:flex;gap:1rem;flex-wrap:wrap;margin:0.5rem 0;">
  <span style="background:#1e2a32cc;padding:4px 12px;border-radius:40px;color:#b0f0cc;font-size:0.75rem;">状态: 正常</span>
  <span style="background:#1e2a32cc;padding:4px 12px;border-radius:40px;color:#b0f0cc;font-size:0.75rem;">响应: 24ms</span>
</div>

<progress value="60" max="100" style="width:100%;height:8px;border-radius:20px;"></progress>

<button style="background:#8fd8ef33;border:1px solid #8fd8ef;border-radius:60px;padding:6px 16px;color:white;cursor:pointer;" onclick="alert('测试通过')">点击测试</button>

## Bash 脚本

```bash
#!/bin/bash
# 系统信息检查
echo "=== 系统信息 ==="
uname -a
echo "=== 磁盘使用 ==="
df -h | grep -E "^(/dev/)" | awk '{print $1, $4, $5}'
echo "=== 内存状态 ==="
free -h | awk '/^Mem:/ {print "已用:", $3, "可用:", $4}'
echo "=== 运行时间 ==="
uptime
```

## 批量文件处理

```bash
#!/bin/bash
for file in *.txt; do
  if [ -f "$file" ]; then
    mv "$file" "${file%.txt}.bak"
    echo "Renamed: $file -> ${file%.txt}.bak"
  fi
done
```

## JavaScript

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}
console.log(fibonacci(10)); // 55
```

## Python

```python
from datetime import datetime

def greet():
    hour = datetime.now().hour
    if hour < 12: return "早上好"
    elif hour < 18: return "下午好"
    else: return "晚上好"

print(f"{greet()}，今天也要加油！")
```

## 无高亮代码块

```
This is a plain code block
No syntax highlighting
```

## 混合列表

1. 准备工作
   - 安装依赖：`npm install`
   - 配置环境变量
2. 运行测试
   ```bash
   npm run test -- --coverage
   ```
3. 部署上线
   > 确保测试通过后再部署
