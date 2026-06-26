# 服务清单

## Docker 容器

| 容器名 | 镜像 | 端口映射 | 用途 |
|--------|------|----------|------|
| astrbot | soulter/astrbot | 6185 | 聊天机器人（钉钉/微信/QQ） |
| napcat | napcat-docker | 3001, 6099 | QQ 协议适配器 |
| astrbot-t2i | astrbot-t2i-service | 8999 | AI 图生成服务 |
| freellmapi | ghcr.io/freellmapi | 3003 | LLM API 统一代理 |

所有容器接入同一 Docker bridge 网络，通过容器名互访。

### LLM 提供商

| 提供商 | 状态 | 说明 |
|--------|------|------|
| freellmapi/auto | 主提供商 | auto 路由，优先 GitHub gpt-4.1 |
| 通义千问 | 已禁用 | — |
| deepseek | 已禁用 | — |
| 硅基流动 | 已禁用 | — |

## 系统服务

| 服务 | 用途 |
|------|------|
| nginx | Web 服务器 |
| php-fpm | PHP FastCGI |
| mysqld | 数据库 |
| mihomo | 代理内核（Clash Meta） |
| mcsm-web + daemon | Minecraft 服务器管理 |
| ssh | 远程登录 |
| rustdesk | 远程桌面 |

## 代理方案

TUN 模式（fake-ip）。所有容器流量经 Docker bridge → TUN 拦截 → Clash 规则路由（国内直连，境外走代理节点）。

---

# 网络拓扑

## 容器网络

```text
┌──────────┐     ┌────────────┐     ┌───────────────┐
│ astrbot  │────→│ freellmapi │←───→│ GitHub/Kilo   │
│ 6185     │     │ 3003       │     │ Google/Groq   │
│ 钉钉/微信/QQ│     │ LLM 调度   │     │ 上游 API      │
└────┬─────┘     └────────────┘     └───────────────┘
      │
      ├──→ napcat — QQ 协议
      └──→ astrbot-t2i — 图片生成
```

## 本地端口（主要）

| 端口 | 用途 |
|------|------|
| 22 | SSH |
| 80 | Nginx HTTP |
| 443 | Nginx HTTPS |
| 3306 | MySQL |
| 3001 | NapCat |
| 3003 | freellmapi |
| 6099 | NapCat WebSocket |
| 6185 | AstrBot |
| 7890 | mihomo HTTP/SOCKS5 |
| 8118 | Privoxy |
| 8999 | AstrBot T2I |
| 9090 | mihomo API |
| 19833 | DPanel |

---

# 硬件配置

| 项目 | 规格 |
|------|------|
| CPU | Intel Core i3-2120 @ 3.30GHz（2核4线程） |
| GPU | NVIDIA GeForce GT 630 |
| 内存 | 8GB DDR3 |
| 系统盘 | 120GB SSD |
| 数据盘 | 465GB HDD |
| 主板 | Intel H61 芯片组 |
| 系统 | Ubuntu 24.04 LTS |
| 网络 | 国内 NAT 内网 |

---

# 安全基线

## 安全措施

| 措施 | 状态 |
|------|------|
| SSH 密码登录 | 已关闭 |
| SSH 密钥 | Ed25519 |
| 自动更新 | unattended-upgrades |

## fail2ban 配置

```ini
[sshd]
enabled = true
maxretry = 5
bantime = 3600
```

## 备份路径

| 路径 | 说明 |
|------|------|
| 自述/ | 文档及配置备份 |
| myweb/ | 博客源码 |
| projects/ | 项目代码 |
| .ssh/ | SSH 密钥 |

---

# 变更记录

| 日期 | 变更 |
|------|------|
| 2026-06-26 | 网络重构：代理注入方案统一迁移到 TUN 模式 |
| 2026-06-26 | LLM 集成：接入 freellmapi API 代理 |
| 2026-06-11 | 安全加固：关闭 SSH 密码、启用 fail2ban |
| 2026-05-30 | 初始搭建 |
