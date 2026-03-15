// 功能控制开关 - 从服务器获取状态
let LOGIN_ENABLED = true;

// 获取功能状态
async function fetchFeatures() {
    try {
        const response = await fetch('/api/features');
        const data = await response.json();
        LOGIN_ENABLED = data.login;
        console.log('Login feature status:', LOGIN_ENABLED);
    } catch (error) {
        console.error('Error fetching features:', error);
        // 出错时默认启用功能
        LOGIN_ENABLED = true;
    }
}

// 页面加载时获取功能状态
document.addEventListener('DOMContentLoaded', fetchFeatures);

const loginBtn = document.querySelector('.login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const socialBtns = document.querySelectorAll('.social-btn');

loginBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    
    // 检查登录功能是否启用
    if (!LOGIN_ENABLED) {
        alert('登录功能暂时暂停，敬请谅解！');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const remember = rememberCheckbox.checked;
    
    if (!username || !password) {
        alert('请输入用户名和密码！');
        return;
    }
    
    console.log('登录信息：', {
        username: username,
        password: password,
        remember: remember
    });
    
    loginBtn.textContent = '登录中...';
    loginBtn.style.opacity = '0.7';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                remember: remember
            })
        });
        
        const result = await response.json();
        
        if (response.status === 200) {
            loginBtn.textContent = '登录成功！';
            loginBtn.style.background = 'rgba(76, 175, 80, 0.5)';
            
            console.log('登录成功：', result);
            
            // 登录成功后跳转到首页
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            alert(result.error || '登录失败');
            loginBtn.textContent = '确认登录';
            loginBtn.style.opacity = '1';
        }
    } catch (error) {
        console.error('登录请求错误:', error);
        alert('网络错误，请稍后重试');
        loginBtn.textContent = '确认登录';
        loginBtn.style.opacity = '1';
    }
});
const registerBtn = document.querySelector('.register-btn');

registerBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/register';
});

passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

usernameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        passwordInput.focus();
    }
});


socialBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const platform = this.classList.contains('google') ? 'Google' : 'Facebook';
        console.log(`使用 ${platform} 登录`);
        alert(`${platform} 登录功能开发中...`);
    });
});


document.querySelector('.forgot-password').addEventListener('click', function(e) {
    e.preventDefault();
    alert('找回密码功能开发中...');
});


const inputs = document.querySelectorAll('.input-group input');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});


const inputGroups = document.querySelectorAll('.input-group');
inputGroups.forEach(group => {
    group.style.transition = 'transform 0.3s ease';
});


window.addEventListener('load', function() {
    const loginBox = document.querySelector('.login-box');
    loginBox.style.animation = 'fadeInUp 0.8s ease';
});


function createParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = '3px';
    particle.style.height = '3px';
    particle.style.background = 'rgba(255, 255, 255, 0.5)';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '5';
    
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;
    
    particle.style.left = startX + 'px';
    particle.style.top = startY + 'px';
    
    document.body.appendChild(particle);
    
    const duration = 3000 + Math.random() * 2000;
    const distance = 50 + Math.random() * 100;
    
    particle.animate([
        { 
            transform: 'translateY(0px)',
            opacity: 0
        },
        { 
            transform: `translateY(-${distance}px)`,
            opacity: 0.8
        },
        { 
            transform: `translateY(-${distance * 2}px)`,
            opacity: 0
        }
    ], {
        duration: duration,
        easing: 'ease-out'
    });
    
    setTimeout(() => {
        particle.remove();
    }, duration);
}
setInterval(createParticle, 300);