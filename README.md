# Node-Login-and-register
基于Node和Redis的登录注册功能的实现

## 项目简介
这是一个基于Node.js和Redis的用户登录注册系统，提供了完整的用户认证功能，包括注册、登录、会话管理等。

## 技术栈

### 后端
- **Node.js**：JavaScript运行环境
- **Redis**：高性能键值存储，用于存储用户信息和会话数据
- **Express**：Web应用框架
- **bcryptjs**：密码加密库
- **cookie-parser**：Cookie解析中间件
- **dotenv**：环境变量管理

### 前端
- **HTML5**：页面结构
- **CSS3**：样式设计
- **JavaScript**：交互逻辑

## 功能特性
- ✅ 用户注册（邮箱、用户名、密码）
- ✅ 用户登录（支持邮箱登录）
- ✅ 会话管理（基于Redis的会话存储）
- ✅ Cookie登录状态保持
- ✅ 表单验证
- ✅ 错误处理
- ✅ 响应式设计
- ✅ 美观的用户界面

## 项目结构
```
e:\Learn\NodeJS\login_register\
├── public/                # 静态资源目录
│   ├── assets/            # 资源文件
│   │   ├── css/           # CSS样式
│   │   ├── js/            # JavaScript脚本
│   │   └── res/           # 图片等资源
│   ├── .htaccess          # Apache配置文件
│   ├── 404.html           # 404错误页面
│   ├── login.html         # 登录页面
│   └── register.html      # 注册页面
├── .env                   # 环境变量文件
├── .htaccess              # Apache配置文件
├── .user.ini              # PHP配置文件
├── package-lock.json      # 依赖锁定文件
├── package.json           # 项目配置文件
├── README.md              # 项目说明文档
└── server.js              # 服务器主文件
```

## 安装与运行

### 前提条件
- Node.js 14.x或更高版本
- Redis 6.0或更高版本

### 安装步骤
1. 克隆项目到本地
2. 安装依赖
   ```bash
   npm install
   ```
3. 配置环境变量（见下方环境配置）
4. 启动Redis服务
5. 启动项目
   ```bash
   npm start
   ```

## 环境配置
在项目根目录创建`.env`文件，添加以下配（示例）：

```env
# Redis配置
REDIS_HOST=10.1.0.0
REDIS_PORT=6379
REDIS_PASSWORD=redis_4yYKK8
```

## API接口

### 注册接口
- **URL**: `/api/register`
- **方法**: `POST`
- **参数**:
  - `email`: 邮箱地址
  - `username`: 用户名
  - `password`: 密码
- **返回**: JSON格式的注册结果

### 登录接口
- **URL**: `/api/login`
- **方法**: `POST`
- **参数**:
  - `username`: 用户名或邮箱
  - `password`: 密码
  - `remember`: 是否记住登录状态
- **返回**: JSON格式的登录结果和用户信息

### 检查登录状态接口
- **URL**: `/api/check-login`
- **方法**: `GET`
- **返回**: JSON格式的登录状态和用户信息

## 使用说明
1. 访问 `http://localhost:3000/login` 进入登录页面
2. 点击"注册账号"按钮进入注册页面
3. 填写注册信息并提交
4. 注册成功后自动跳转到登录页面
5. 输入邮箱和密码登录
6. 登录成功后会自动保存登录状态

## 注意事项
- 本项目使用Redis作为存储，需要确保Redis服务正常运行
- 密码目前为明文存储，实际生产环境应使用bcryptjs进行加密
- 本项目仅作为学习和演示用途，生产环境使用时需要进一步加强安全性
