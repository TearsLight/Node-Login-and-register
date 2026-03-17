const http = require('http');
const fs = require('fs');
const path = require('path');

const config = require('./config.json');
const { createClient } = require('redis');

const MIME_TYPE = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain',
}

// 创建 Redis 客户端
const redisClient = createClient({
    url: 'redis://localhost:6379'
});

// 连接 Redis
redisClient.connect().then(() => {
    console.log('Redis connected successfully');
}).catch(err => {
    console.error('Redis connection error:', err);
});

const databaseCheck = async () => {
    try {
        // 检查 Redis 连接
        await redisClient.ping();
        console.log('Redis database connected');
        
        // 检查 accounts 键是否存在
        const exists = await redisClient.exists('accounts');
        if (!exists) {
            // 初始化 accounts 列表
            await redisClient.set('accounts', JSON.stringify([]));
            console.log('Redis database initialized');
        }
    } catch (err) {
        console.error('Database check error:', err);
        throw err;
    }
}

const writeToDatabase = async (data) => {
    try {
        // 从 Redis 获取现有账户
        const accountsJson = await redisClient.get('accounts');
        const accounts = JSON.parse(accountsJson);
        
        // 添加新账户
        accounts.push(JSON.parse(data));
        
        // 写回 Redis
        await redisClient.set('accounts', JSON.stringify(accounts, null, 2));
        console.log('Account added to Redis');
    } catch (err) {
        console.error('Write to database error:', err);
        throw err;
    }
}

const server = http.createServer(async (req, res) => {
    let filePath = path.join(__dirname, config.staticDir, req.url);

    if (req.url === '/') {
        filePath = path.join(__dirname, config.staticDir, 'index.html');
    } else if (req.url === '/login') {
        filePath = path.join(__dirname, config.staticDir, 'login.html');
    } else if (req.url === '/account') {
        filePath = path.join(__dirname, config.staticDir, 'account', 'account.html');
    } else if (req.url === '/register') {
        filePath = path.join(__dirname, config.staticDir, 'register.html');
    }
    // API routes --RESTful
    else if (req.url === '/api/register' && req.method === 'POST') {
        // 检查注册功能是否启用
        if (!config.features || !config.features.register) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Registration is temporarily disabled' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                console.log(data);
                await writeToDatabase(body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Registration successful' }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        return;
    }
    //login
    else if (req.url === '/api/login' && req.method === 'POST') {
        // 检查登录功能是否启用
        if (!config.features || !config.features.login) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Login is temporarily disabled' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                console.log(data);  
                
                // 从 Redis 获取账户数据
                const accountsJson = await redisClient.get('accounts');
                const accounts = JSON.parse(accountsJson);
                
                const account = accounts.find((account) => account.username === data.username);
                if (account) {
                    if (account.password === data.password) {
                        //set cookie before sending response
                        let tokenCookie = 'token=user_logged_in; Path=/';
                        let usernameCookie = `username=${account.username}; Path=/`;
                        if (data.remember) {
                            // 7天有效期
                            tokenCookie += '; Max-Age=604800';
                            usernameCookie += '; Max-Age=604800';
                        }
                        res.setHeader('Set-Cookie', [tokenCookie, usernameCookie]);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Login successful' }));
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Incorrect password' }));
                    }
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Username not found' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        return;
    }
    // 获取功能状态
    else if (req.url === '/api/features' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            login: config.features?.login ?? true,
            register: config.features?.register ?? true
        }));
        return;
    }
    //check login status
    else if (req.url === '/api/login-status' && req.method === 'POST') {
        //读取cookie
        const parseCookies = (cookieHeader) => {
            const cookies = {};
            if (cookieHeader) {
                cookieHeader.split(';').forEach(cookie => {
                    const parts = cookie.split('=');
                    cookies[parts[0].trim()] = parts[1];
                });
            }
            return cookies;
        };
        
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies.token;
        const username = cookies.username;
        
        if (token && username) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'logged in', username: username }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'not logged in' }));
        }
        return;
    }
    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 文件不存在，返回404
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        
        // 检查是否是目录
        fs.stat(filePath, (err, stats) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1>');
                return;
            }
            
            if (stats.isDirectory()) {
                // 如果是目录，默认返回index.html
                filePath = path.join(filePath, 'index.html');
            }
            
            // 读取文件
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end('<h1>500 Internal Server Error</h1>');
                    return;
                }
                
                // 根据文件扩展名设置Content-Type
                const ext = path.extname(filePath);
                const contentType = MIME_TYPE[ext] || 'application/octet-stream';
                
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            });
        });
    });
});

// 启动服务器
server.listen(config.port, config.host, async () => {
    console.log(`Server running at http://${config.host}:${config.port}/`);
    // 检查数据库
    await databaseCheck();
});