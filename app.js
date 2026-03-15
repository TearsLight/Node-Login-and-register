const http = require('http');
const fs = require('fs');
const path = require('path');

const config = require('./config.json');
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
const databaseCheck = () => {
    try {
        fs.accessSync(config.Database);
        console.log('Database file exists');
    } catch (err) {
        if (err.code === 'ENOENT') {
            fs.writeFileSync(config.Database, '[]');
            console.log('Database file created');
        } else {
            throw err;
        }
    }
}
const writeToDatabase = (data) => {
    const accounts = JSON.parse(fs.readFileSync(config.Database));
    accounts.push(JSON.parse(data));
    fs.writeFileSync(config.Database, JSON.stringify(accounts, null, 2));
}
const server = http.createServer((req, res) => {
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
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log(data);
                writeToDatabase(body);
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
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log(data);  
                const accounts = JSON.parse(fs.readFileSync(config.Database));
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
                    const [name, value] = cookie.trim().split('=');
                    cookies[name] = value;
                });
            }
            return cookies;
        };
        
        const cookies = parseCookies(req.headers.cookie);
        console.log('Cookies:', cookies);
        
        //检查cookie是否存在token
        if (cookies.token) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Login status check successful' }));
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No token found' }));
        }   
        return;
    }
    //修改密码
    else if (req.url === '/api/change-password' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('修改密码请求:', data);
                
                // 解析cookie获取当前用户名
                const parseCookies = (cookieHeader) => {
                    const cookies = {};
                    if (cookieHeader) {
                        cookieHeader.split(';').forEach(cookie => {
                            const [name, value] = cookie.trim().split('=');
                            cookies[name] = value;
                        });
                    }
                    return cookies;
                };
                
                const cookies = parseCookies(req.headers.cookie);
                const username = cookies.username;
                
                if (!username) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '未登录' }));
                    return;
                }
                
                // 读取数据库
                const accounts = JSON.parse(fs.readFileSync(config.Database));
                const accountIndex = accounts.findIndex(acc => acc.username === username);
                
                if (accountIndex === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '用户不存在' }));
                    return;
                }
                
                // 验证当前密码
                if (accounts[accountIndex].password !== data.currentPassword) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '当前密码错误' }));
                    return;
                }
                
                // 更新密码
                accounts[accountIndex].password = data.newPassword;
                fs.writeFileSync(config.Database, JSON.stringify(accounts, null, 2));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: '密码修改成功' }));
                
            } catch (err) {
                console.error('修改密码错误:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '修改密码失败' }));
            }
        });
        return;
    }
    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPE[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});
 
server.listen(config.port, config.host, () => {
    databaseCheck();
    console.log(`Server running at http://${config.host}:${config.port}/`);
});


