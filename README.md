# Node-login-and-register 项目

## 项目概述

这是一个基于 Node.js 的静态文件服务器项目，包含登录、注册和账户管理功能。项目采用前后端分离的架构，后端使用原生 Node.js 实现 API 服务，前端使用 HTML、CSS 和 JavaScript 实现用户界面。

## 功能特性

- **静态文件服务**：托管 public 目录下的静态文件
- **用户认证**：登录、注册功能
- **账户管理**：修改密码、退出登录
- **功能控制**：通过配置文件控制登录和注册功能的开启/关闭
- **响应式设计**：适配不同屏幕尺寸
- **现代化界面**：美观的渐变背景和毛玻璃效果
- **粒子动画**：动态背景粒子效果
- **一言功能**：显示随机一言

## 技术栈

- **后端**：Node.js (原生 HTTP 服务器)
- **前端**：HTML5, CSS3, JavaScript
- **数据存储**：JSON 文件
- **依赖**：无第三方依赖

## 项目结构

```
├── app.js              # 主服务器文件
├── config.json         # 配置文件
├── data/
│   └── accounts.json   # 用户数据存储
├── public/             # 静态文件目录
│   ├── assets/         # 静态资源
│   │   ├── css/        # CSS 文件
│   │   ├── js/         # JavaScript 文件
│   │   └── res/        # 图片等资源
│   ├── login/          # 登录页面
│   ├── account/        # 账户管理页面
│   ├── index.html      # 首页
│   ├── login.html      # 登录页面
│   └── register.html   # 注册页面
└── README.md           # 项目说明文档
```

## 安装与运行

### 前提条件

- Node.js 14.0 或更高版本

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <项目地址>
   cd <项目目录>
   ```

2. **创建数据目录**
   ```bash
   mkdir -p data
   ```

3. **创建初始账户数据文件**
   ```bash
   echo '[]' > data/accounts.json
   ```

4. **启动服务器**
   ```bash
   node app.js
   ```

5. **访问网站**
   - 首页：http://localhost:5000
   - 登录页：http://localhost:5000/login
   - 注册页：http://localhost:5000/register
   - 账户页：http://localhost:5000/account

## 配置说明

### config.json

```json
{
    "name": "Web Server",
    "host": "0.0.0.0",
    "port": 5000,
    "staticDir": "public",
    "Database": "./data/accounts.json",
    "features": {
        "login": true,
        "register": true
    }
}
```

- **name**：服务器名称
- **host**：服务器主机地址
- **port**：服务器端口
- **staticDir**：静态文件目录
- **Database**：用户数据存储文件路径
- **features**：功能控制开关
  - **login**：登录功能（true 启用，false 禁用）
  - **register**：注册功能（true 启用，false 禁用）

## API 端点

### 登录
- **路径**：`/api/login`
- **方法**：POST
- **参数**：
  ```json
  {
    "username": "用户名",
    "password": "密码",
    "remember": true/false
  }
  ```
- **响应**：
  - 成功：`{ "message": "Login successful" }`
  - 失败：`{ "error": "错误信息" }`

### 注册
- **路径**：`/api/register`
- **方法**：POST
- **参数**：
  ```json
  {
    "email": "邮箱",
    "username": "用户名",
    "password": "密码"
  }
  ```
- **响应**：
  - 成功：`{ "message": "Registration successful" }`
  - 失败：`{ "error": "错误信息" }`

### 登录状态检查
- **路径**：`/api/login-status`
- **方法**：POST
- **响应**：
  - 已登录：`{ "status": "logged in", "username": "用户名" }`
  - 未登录：`{ "status": "not logged in" }`

### 功能状态
- **路径**：`/api/features`
- **方法**：GET
- **响应**：
  ```json
  {
    "login": true/false,
    "register": true/false
  }
  ```

## 功能控制

当服务器负载较高时，可以通过修改 `config.json` 文件中的 `features` 部分来临时禁用登录或注册功能：

1. **禁用登录功能**：
   ```json
   "features": {
     "login": false,
     "register": true
   }
   ```

2. **禁用注册功能**：
   ```json
   "features": {
     "login": true,
     "register": false
   }
   ```

3. **同时禁用登录和注册功能**：
   ```json
   "features": {
     "login": false,
     "register": false
   }
   ```

## 安全注意事项

- 本项目使用明文存储密码，仅用于演示目的
- 生产环境中应使用加密存储密码
- 建议添加 CORS 配置和其他安全措施

## 浏览器兼容性

- 支持所有现代浏览器（Chrome, Firefox, Safari, Edge）
- 响应式设计，适配桌面和移动设备

