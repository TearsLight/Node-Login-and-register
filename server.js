const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const redis = require('redis');
const httpProxy = require('http-proxy');

// 创建代理服务器
const proxy = httpProxy.createProxyServer();

// 加载环境变量
dotenv.config();

// 创建 Redis 客户端
const redisClient = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

// 连接 Redis
redisClient.connect().then(() => {
  console.log('Redis 连接成功');
  // 测试 Redis 连接
  return redisClient.ping();
}).then((response) => {
  console.log('Redis PING 响应:', response);
}).catch((err) => {
  console.error('Redis 连接失败:', err);
});

// 监听 Redis 错误
redisClient.on('error', (err) => {
  console.error('Redis 错误:', err);
});

const port = 8000;
const mimeTypes = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'png': 'image/png',
    'jpg': 'image/jpeg',
}

const server = http.createServer((req, res) => {
    // 检查是否是 API 请求
    if (req.url.startsWith('/api/')) {
      // 代理到 API 服务器
      proxy.web(req, res, {
        target: 'http://localhost:8001',
        changeOrigin: true
      });
      return;
    }
    
    let request_path = req.url === '/' ? '/index.html' : req.url;
    const file_path = path.join(__dirname, 'public', request_path);
    const ext_name = path.extname(file_path).substring(1);
    const contentType = mimeTypes[ext_name] || 'application/octet-stream';

    fs.readFile(file_path, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf8' });
        res.end('<h1>404 - 文件不存在</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf8' });
        res.end(`<h1>500 - 服务器错误：${err.code}</h1>`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType + '; charset=utf8' });
      res.end(content);
    }
  });
});

// 解析 JSON 格式的请求体
function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      console.log('收到的请求体:', body);
      try {
        if (!body) {
          reject(new Error('请求体为空'));
          return;
        }
        resolve(JSON.parse(body));
      } catch (err) {
        console.error('JSON 解析错误:', err);
        reject(new Error('JSON 格式错误'));
      }
    });
    req.on('error', err => {
      console.error('请求错误:', err);
      reject(err);
    });
  });
}

const api_server = http.createServer(async (req, res) => {
  // 处理登录请求
  if (req.method === 'POST' && req.url === '/api/login') {
    try {
      const body = await parseJSONBody(req);
      const { email, password } = body;
      
      // 检查请求参数
      if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf8' });
        res.end(JSON.stringify({ success: false, message: '邮箱和密码不能为空' }));
        return;
      }
      
      // 从 Redis 获取用户信息
      const userKey = `user:${email}`;
      const userData = await redisClient.get(userKey);
      
      if (!userData) {
        // 如果用户不存在，创建默认用户（仅用于演示）
        const defaultUser = {
          email: 'admin@example.com',
          password: '123456',
          username: '管理员',
          uid: '10001'
        };
        
        if (email === defaultUser.email && password === defaultUser.password) {
          // 存储用户信息到 Redis
          await redisClient.set(userKey, JSON.stringify(defaultUser));
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf8' });
          res.end(JSON.stringify({ success: true, message: '登录成功', data: defaultUser }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf8' });
          res.end(JSON.stringify({ success: false, message: '邮箱或密码错误' }));
        }
      } else {
        // 验证用户密码
        const user = JSON.parse(userData);
        if (password === user.password) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf8' });
          res.end(JSON.stringify({ success: true, message: '登录成功', data: user }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf8' });
          res.end(JSON.stringify({ success: false, message: '邮箱或密码错误' }));
        }
      }
    } catch (err) {
      console.error('登录错误:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf8' });
      res.end(JSON.stringify({ success: false, message: '服务器内部错误' }));
    }
  } 
  // 处理注册请求
  else if (req.method === 'POST' && req.url === '/api/register') {
    try {
      const body = await parseJSONBody(req);
      const { email, username, password, confirmPassword } = body;
      
      // 检查请求参数
      if (!email || !username || !password || !confirmPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf8' });
        res.end(JSON.stringify({ success: false, message: '所有字段都不能为空' }));
        return;
      }
      
      // 验证邮箱格式
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf8' });
        res.end(JSON.stringify({ success: false, message: '邮箱格式不正确' }));
        return;
      }
      
      // 验证用户名长度
      if (username.length < 2 || username.length > 20) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf8' });
        res.end(JSON.stringify({ success: false, message: '用户名长度为 2-20 个字符' }));
        return;
      }
      
      // 验证密码是否一致
      if (password !== confirmPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf8' });
        res.end(JSON.stringify({ success: false, message: '两次输入的密码不一致' }));
        return;
      }
      
      // 验证密码强度
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,32}$/;
      if (!passwordRegex.test(password)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf8' });
        res.end(JSON.stringify({ success: false, message: '密码必须包含大小写字母和数字，长度为 8-32 个字符' }));
        return;
      }
      
      // 检查用户是否已存在
      const userKey = `user:${email}`;
      const existingUser = await redisClient.get(userKey);
      if (existingUser) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf8' });
        res.end(JSON.stringify({ success: false, message: '该邮箱已被注册' }));
        return;
      }
      
      // 生成唯一的 UID
      const uid = '1000' + Math.floor(Math.random() * 9000).toString();
      
      // 创建用户信息
      const newUser = {
        email,
        username,
        password,
        uid
      };
      
      // 存储用户信息到 Redis
      await redisClient.set(userKey, JSON.stringify(newUser));
      
      // 返回注册成功的响应
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf8' });
      res.end(JSON.stringify({ success: true, message: '注册成功', data: { uid } }));
    } catch (err) {
      console.error('注册错误:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf8' });
      res.end(JSON.stringify({ success: false, message: '服务器内部错误' }));
    }
  } 
  else {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf8' });
    res.end(JSON.stringify({ success: false, message: '路由不存在' }));
  }
});

// 启动主服务器，监听所有地址
server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

// 启动 API 服务器，监听所有地址
const api_port = 8001;
api_server.listen(api_port, '0.0.0.0', () => {
    console.log(`API Server running on port ${api_port}`);
});
