const registerBtn = document.getElementById('registerBtn');
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const socialBtns = document.querySelectorAll('.social-btn');

registerBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    
    if (!email || !username || !password || !confirmPassword) {
        alert('请填写所有必填字段！');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('请输入有效的邮箱地址！');
        return;
    }
    
    if (password.length < 6) {
        alert('密码长度至少为6位！');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致！');
        return;
    }
    
    console.log('注册信息：', {
        email: email,
        username: username,
        password: password
    });
    
    registerBtn.textContent = '注册中...';
    registerBtn.style.opacity = '0.7';
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                username: username,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            registerBtn.textContent = '注册成功！';
            registerBtn.style.background = 'rgba(76, 175, 80, 0.5)';
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            alert(result.message);
            registerBtn.textContent = '确认注册';
            registerBtn.style.opacity = '1';
        }
    } catch (error) {
        console.error('注册请求错误:', error);
        alert('网络错误，请稍后重试');
        registerBtn.textContent = '确认注册';
        registerBtn.style.opacity = '1';
    }
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        confirmPasswordInput.focus();
    }
});

confirmPasswordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        registerBtn.click();
    }
});

usernameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        passwordInput.focus();
    }
});

emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        usernameInput.focus();
    }
});

const reloginBtn = document.querySelector('.re-login-btn');

reloginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/login';
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