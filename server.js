const http = require('http');
const fs = require('fs');
const path = require('path');
const redis = require('redis');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const CONFIG = {
  PORT: 3000,
  PUBLIC_DIR: path.join(__dirname, 'public'),
  NOT_FOUND_PAGE: path.join(__dirname, 'public', '404.html'),
  MIME_MAP: {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.txt': 'text/plain'
  }
};

// Redis连接配置
const redisClient = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => {
  console.error('Redis连接错误:', err);
});

redisClient.connect().then(() => {
  console.log('Redis连接成功');
  // 初始化UID计数器
  redisClient.get('next_uid').then((value) => {
    if (!value) {
      redisClient.set('next_uid', '100001');
    }
  });
}).catch((err) => {
  console.error('❌ Redis连接失败:', err);
});

/**
 * 获取文件对应的Content-Type
 * @param {string} filePath 文件绝对路径
 * @returns {string} Content-Type值
 */
const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return CONFIG.MIME_MAP[ext] || 'application/octet-stream';
};

/**
 * 读取并返回文件内容
 * @param {string} filePath 文件路径
 * @param {http.ServerResponse} res 响应对象
 */
const serveFile = (filePath, res) => {

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(CONFIG.NOT_FOUND_PAGE, (notFoundErr, notFoundData) => {
        if (notFoundErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found - 页面不存在');
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(notFoundData);
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': `${getContentType(filePath)}; charset=utf-8`,
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(data);
  });
};

const server = http.createServer((req, res) => {

  // 解析cookie
  const cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      cookies[parts[0].trim()] = parts[1].trim();
    });
  }

  if (req.url === '/favicon.ico') {
    const faviconPath = path.join(CONFIG.PUBLIC_DIR, 'assets/res/favicon.ico');
    serveFile(faviconPath, res);
    return;
  }

  // 处理注册API请求
  if (req.url === '/api/register' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { email, username, password } = data;

        // 验证数据
        if (!email || !username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: '请填写所有必填字段' }));
          return;
        }

        // 检查邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: '请输入有效的邮箱地址' }));
          return;
        }

        // 检查密码长度
        if (password.length < 6) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: '密码长度至少为6位' }));
          return;
        }

        // 检查邮箱是否已存在
        const existingUser = await redisClient.get(`user:email:${email}`);
        if (existingUser) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: '该邮箱已被注册' }));
          return;
        }

        // 生成唯一UID
        const uid = await redisClient.incr('next_uid');

        // 存储用户信息
        const userData = {
          uid: uid.toString(),
          email: email,
          username: username,
          password: password, // 实际生产环境应该加密存储
          created_at: new Date().toISOString()
        };

        // 存储用户数据
        await redisClient.set(`user:uid:${uid}`, JSON.stringify(userData));
        await redisClient.set(`user:email:${email}`, uid.toString());

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: '注册成功', uid: uid }));
      } catch (error) {
        console.error('注册错误:', error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: '注册失败，请稍后重试' }));
      }
    });
    return;
  }

  // 处理登录API请求
  if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { username, password, remember } = data;

        // 验证数据
        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: '请填写用户名和密码' }));
          return;
        }

        // 尝试通过邮箱登录
        let uid = await redisClient.get(`user:email:${username}`);
        if (!uid) {
          // 尝试通过用户名查找（如果需要）
          // 这里简化处理，实际应该维护用户名到UID的映射
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: '用户不存在' }));
          return;
        }

        // 获取用户信息
        const userDataStr = await redisClient.get(`user:uid:${uid}`);
        if (!userDataStr) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: '用户不存在' }));
          return;
        }

        const userData = JSON.parse(userDataStr);

        // 验证密码
        if (userData.password !== password) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: '密码错误' }));
          return;
        }

        // 生成session ID
        const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        
        // 存储session到Redis
        await redisClient.set(`session:${sessionId}`, JSON.stringify({
          uid: userData.uid,
          email: userData.email,
          username: userData.username,
          created_at: new Date().toISOString()
        }), {
          EX: 86400 // 24小时过期
        });
        
        // 登录成功，设置cookie
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=86400`
        });
        res.end(JSON.stringify({ 
          success: true, 
          message: '登录成功', 
          user: {
            uid: userData.uid,
            email: userData.email,
            username: userData.username
          }
        }));
      } catch (error) {
        console.error('登录错误:', error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: '登录失败，请稍后重试' }));
      }
    });
    return;
  }

  // 处理检查登录状态API请求
  if (req.url === '/api/check-login' && req.method === 'GET') {
    const sessionId = cookies.sessionId;
    if (!sessionId) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: '未登录' }));
      return;
    }

    // 检查session是否存在
    redisClient.get(`session:${sessionId}`).then((sessionData) => {
      if (!sessionData) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: '未登录' }));
        return;
      }

      const userData = JSON.parse(sessionData);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ 
        success: true, 
        message: '已登录', 
        user: {
          uid: userData.uid,
          email: userData.email,
          username: userData.username
        }
      }));
    }).catch((error) => {
      console.error('检查登录状态错误:', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: '检查登录状态失败' }));
    });
    return;
  }

  let requestPath = req.url;
  if (requestPath === '/login' || requestPath === '/index.html') {
    requestPath = '/login.html';
  } else if (requestPath.includes('/register=true')) {
    // 处理注册请求，返回register.html
    const registerPath = path.join(CONFIG.PUBLIC_DIR, 'register.html');
    serveFile(registerPath, res);
    return;
  }

  const resolvedPath = path.resolve(CONFIG.PUBLIC_DIR, `.${requestPath}`);
  if (!resolvedPath.startsWith(CONFIG.PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden - 禁止访问');
    return;
  }
  serveFile(resolvedPath, res);
});

server.listen(CONFIG.PORT, () => {
  console.log(`服务器已启动`);
  console.log(`静态资源目录：${CONFIG.PUBLIC_DIR}`);
});

server.on('error', (err) => {
  switch (err.code) {
    case 'EADDRINUSE':
      console.error(`端口 ${CONFIG.PORT} 已被占用！`);
      console.error(`解决方案：1. 停止占用进程（sudo lsof -i:${CONFIG.PORT}） 2. 修改CONFIG.PORT为其他端口`);
      break;
    case 'EACCES':
      console.error(`权限不足！监听${CONFIG.PORT}端口需要root权限`);
      console.error(`解决方案：使用 sudo node server.js 启动`);
      break;
    default:
      console.error(`服务器启动失败：${err.message}`);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已安全关闭');
    process.exit(0);
  });
});