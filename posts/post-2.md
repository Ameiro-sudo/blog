# Bash 命令示例 · 系统检查
date: 2026-06-04
tags: Bash, 终端
time: 14:20
readTime: 5 分钟
---
显示系统资源：

```bash
#!/bin/bash
df -h | grep -E "^(/dev/)"
free -m
uptime
```

批量处理：

```bash
for f in *.txt; do mv "$f" "${f%.txt}.bak"; done
```
