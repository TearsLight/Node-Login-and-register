const img = new Image();
img.src = '/assets/res/image.png';

img.onload = function() {
  document.body.style.backgroundImage = `url(${img.src})`;
  document.body.style.transition = 'background-image 1s ease';
};

img.onerror = function() {
  document.body.style.backgroundColor = '#324537ff'; 
};

// Cookie 工具函数
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// 检查登录状态
function checkLoginStatus() {
  console.log('开始检查登录状态');
  
  // 检查是否存在 token 和 username cookie
  const token = getCookie('token');
  const username = getCookie('username');
  
  console.log('Token:', token);
  console.log('Username:', username);
  
  // 判断登录状态
  const isLoggedIn = token === 'user_logged_in' && username !== null;
  
  if (isLoggedIn) {
    console.log('登录成功，更新导航栏');
    updateNavbar(username);
  } else {
    console.log('用户未登录');
  }
}

// 更新导航栏
function updateNavbar(username) {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  // 找到登录链接并替换为欢迎信息
  const loginLink = navLinks.querySelector('a[href="/login"]');
  if (loginLink) {
    const li = loginLink.parentElement;
    li.innerHTML = `<a href="/account" style="color: #ff00fbff; font-weight: bold;">欢迎，${username}</a>`;
  }
}

// 页面加载完成后检查登录状态
document.addEventListener('DOMContentLoaded', checkLoginStatus);