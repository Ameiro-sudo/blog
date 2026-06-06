#!/bin/bash
set -e

# 检查是否有未跟踪的 .md 文件
NEW_MD=$(git diff --cached --name-only --diff-filter=A "content/posts/*.md" 2>/dev/null || true)
if [ -z "$NEW_MD" ]; then
  NEW_MD=$(git ls-files --others --exclude-standard "content/posts/*.md" 2>/dev/null || true)
fi

# 检查 nvm (如果安装了 nvm)
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

echo "🔨 构建索引..."
node scripts/build.js

echo "📦 提交并推送..."
git add -A

# 如果传入了提交信息就用它，否则自动生成
if [ -n "$1" ]; then
  MSG="$1"
elif [ -n "$NEW_MD" ]; then
  MSG="add: 新文章"
else
  MSG="update: $(date +'%m-%d %H:%M')"
fi

git commit -m "$MSG"
git push

echo "✅ 完成！"
