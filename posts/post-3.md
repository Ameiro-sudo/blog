# 代码与排版测试
date: 2026-06-05
tags: Bash, 代码, 排版, 测试
time: 21:00
readTime: 4 分钟
---
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
# 批量重命名 .txt 为 .bak
for file in *.txt; do
  if [ -f "$file" ]; then
    mv "$file" "${file%.txt}.bak"
    echo "已重命名: $file → ${file%.txt}.bak"
  fi
done
```

## JavaScript 示例

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
    if hour < 12:
        return "早上好"
    elif hour < 18:
        return "下午好"
    else:
        return "晚上好"

print(f"{greet()}，今天也要加油！")
```

## 引用与嵌套

> 代码是写给人看的，顺便能在机器上运行。
>
> —— Harold Abelson

嵌套引用：

> 编程语言
> > Python
> > JavaScript
> > Rust
>
> 各有千秋

## 内联代码

在文本中可以使用 `npm install` 或 `pip install requests` 这样的内联代码。

路径示例：`/usr/local/bin/node`、`C:\Users\name\AppData`

## 无语法高亮的代码块

```
This is a plain code block
No syntax highlighting applied
Just monospace text
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
   > 确保所有测试通过后再部署
