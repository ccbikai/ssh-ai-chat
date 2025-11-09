# 🤖 SSH AI Chat

**通过 SSH 和 AI 聊天。**

![Chat](./images/chat-zh-CN.png)

[English](./README.md) | 简体中文

---

## 💡 如何使用

```sh
# 替换 username 为你的 GitHub 用户名
ssh username@chat.agi.li
```

### 支持的终端

- macOS: **[iTerm2](https://iterm2.com/)**, [Ghostty](https://ghostty.org/)
- Linux: 等待你的反馈
- Windows: 等待你的反馈

## 🧱 技术栈

- 服务端: [Node.js](https://nodejs.org/) 和 [SSH2](https://github.com/mscdex/ssh2)
- UI 框架：[React](https://github.com/facebook/react) 和 [Ink](https://github.com/vadimdemedes/ink)
- 数据库：[PostgreSQL](https://www.postgresql.org/) 和 [Redis](https://redis.io/)

## 🏗️ 如何部署

### Docker（推荐）

**我们推荐您使用 [V.PS](https://404.li/vps) 的服务器通过 Docker 部署**。

1. 复制 .env.example 内容到 .env 文件, 并按下方 .env 文件说明进行修改。
2. 创建 docker-compose.yml 文件，内容如下。 部署 SSH AI Chat 只需如下内容。 如果需要同时部署 PostgreSQL 和 Redis, 可以参考 [docker-compose.dev.yml](./docker-compose.dev.yml) 文件。

```docker
services:
  ssh-ai-chat:
    image: ghcr.io/ccbikai/ssh-ai-chat
    ports:
      - 22:2222
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    mem_limit: 4g
```

3. 通过 `docker compose up -d` 命令启动。
4. 使用 `ssh username@host -p 22` 命令访问，注意替换主机名称和端口号。

### .env 文件说明

```env
# 服务名称，非必选，可换成自己的域名
SERVER_NAME=chat.agi.li

# 是否是公开服务器，必选，不配置则为私有服务器，需要配置白名单
PUBLIC_SERVER=false

# 限流设置，非必选，TTL 结尾为时间，LIMIT 为次数。如果是公开服务器，强烈建议设置
RATE_LIMIT_TTL=3600
RATE_LIMIT_LIMIT=300
LOGIN_FAILED_TTL=600
LOGIN_FAILED_LIMIT=10

# 黑白名单，非必选，配置 GitHub 用户名，使用英文逗号分割。
BLACK_LIST=alice
WHITE_LIST=bob

# Redis 地址，非必选，如果不配置会使用模拟 Redis，重启会丢失数据
REDIS_URL=redis://default:ssh-ai-chat-pwd@127.0.0.1:6379
# 数据库地址，非必选，如果不配置会使用 PGLite 存储数据到 /app/data 目录
DATABASE_URL=postgres://postgres:ssh-ai-chat-pwd@127.0.0.1:5432/ssh-ai-chat

# Umami 配置信息，非必选
UMAMI_HOST=https://eu.umami.is
UMAMI_SITE_ID=6bc6dd79-4672-44bc-91ea-938a6acb63a2

# 系统提示词，非必选
AI_MODEL_SYSTEM_PROMPT="你是一个...的 AI 聊天助手。"

# 模型列表，**必选**，使用英文逗号分割
AI_MODELS="DeepSeek-V3,DeepSeek-R1,Gemini-2.5-Flash,Gemini-2.5-Pro"

# 支持思维链的模型, 使用 `<think>` 标签返回思维链，非必选，不配置会展示思维链内容
AI_MODEL_REASONING_MODELS="DeepSeek-R1,Qwen3-8B"

# 系统推理模型，非必选，用于生成对话标题，只能配置一个模型，不配置会使用模型列表第一个模型
AI_SYSTEM_MODEL="Qwen3-8B"

# 模型配置文件，为 `AI_MODELS` 和 `AI_SYSTEM_MODEL` 模型列表中的模型配置接口调用信息。
# 名称格式：前缀 `AI_MODEL_CONFIG_`，模型名称全部大写，`-` 和 `.` 替换为 `_`, 启动日志中会展示转换关系。
# 值格式: 类型，模型 ID，BaseURL，APIKey 。接口格式需要支持 OpenAI 兼容格式，类型目前未使用
AI_MODEL_CONFIG_GEMINI_2_5_FLASH=fast,gemini-2.5-flash,https://api.example.com/v1,sk-abc
AI_MODEL_CONFIG_GEMINI_2_5_PRO=pro,gemini-2.5-pro,https://api.example.com/v1,sk-abc
```

## 👨‍💻 本地开发

```sh
# 安装依赖
pnpm i

# 开发命令界面
pnpm run dev:cli

# 开发 SSH Server
pnpm run dev
```

## 💖 致谢

1. [itter.sh](https://www.itter.sh/)
2. [ssh.chat](https://github.com/shazow/ssh-chat)
3. [sshtalk.com](https://github.com/akazwz/sshtalk)

## ☕ 赞助

再次感谢 [V.PS](https://404.li/vps) 赞助服务器。

1. [在 Telegram 关注我](https://t.me/miantiao_me)
2. [在 𝕏 上关注我](https://404.li/x)
3. [在 GitHub 赞助我](https://github.com/sponsors/ccbikai)
