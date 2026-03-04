# 登录注册系统 

## 项目介绍

嗨～这是一个基于 Node.js 和 Redis 的登录注册系统，

## 功能特性

- 快速响应的 API 接口
- 安全的用户验证
- 远程 Redis 存储
- 简单的注册流程

## 安装依赖

在开始之前，你需要准备好以下材料：

1. **Node.js** 环境
2. **Redis** 服务器

然后在命令行中：

```bash
npm install
```

## 配置

入口处，你需要设置一个 `.env` 文件，告诉系统 Redis 的位置（示例的内容视情况而定）：

```env
# Redis 服务器的地址
REDIS_HOST=10.1.0.0
# Redis 服务器的端口
REDIS_PORT=6379
# Redis 的密码
REDIS_PASSWORD=redis_4yYKK8
```

## 启动城堡

一切准备就绪，现在可以启动了！

```bash
node server.js
```

在浏览器中输入 `http://localhost:8000`

## 使用指南

### 注册新用户
1. 点击「注册」按钮
2. 输入你的邮箱、用户名和密码
3. 点击「注册」按钮
4. 注册成功

### 登录系统
1. 在登录页面输入你的邮箱和密码
2. 点击「登录」按钮，进入系统
3. 登录成功后，会看到欢迎信息

## 接口说明

### 注册接口
- **地址**：`/api/register`
- **方法**：`POST`
- **参数**：
  - `email`：邮箱地址
  - `username`：用户名
  - `password`：密码
  - `confirmPassword`：确认密码
- **返回**：注册成功或失败的信息

### 登录接口
- **地址**：`/api/login`
- **方法**：`POST`
- **参数**：
  - `email`：邮箱地址
  - `password`：密码
- **返回**：登录成功或失败的信息

## 技术栈

- **前端**：HTML5 + CSS3 + JavaScript
- **后端**：Node.js
- **存储**：Redis
- **依赖**：
  - `redis`：连接 Redis 服务器
  - `dotenv`：加载环境变量
  - `http-proxy`：API 请求代理

## 开发小贴士

- 如果你想修改外观，可以编辑 `public` 目录下的文件
- 如果你想添加新的功能，可以修改 `server.js` 文件
- 记得定期备份你的 Redis 数据

## 最后

✨ 你的代码永远没有 bug，你的服务器永远不宕机 ✨