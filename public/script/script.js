// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openRegister() {
  document.getElementById('regModal').classList.add('active');
}
function closeRegister() {
  document.getElementById('regModal').classList.remove('active');
  // reset
  ['regEmail','regName','regPwd','regPwd2'].forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
    el.className = '';
  });
  ['regEmailMsg','regNameMsg','regPwdMsg','pwdError'].forEach(clearMsg);
  document.getElementById('pwdStrength').style.display = 'none';
  updatePwdReqs('');
}

document.getElementById('regModal').addEventListener('click', function(e) {
  if (e.target === this) closeRegister();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clearMsg(id) {
  const el = document.getElementById(id);
  if (el) { el.className = 'msg'; el.textContent = ''; }
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `msg ${type}`;
}

function setFieldState(inputId, state) {
  const el = document.getElementById(inputId);
  el.className = state || '';
}

// ─── Password strength ────────────────────────────────────────────────────────
const checks = [
  { id: 'req-len',   test: p => p.length >= 8 && p.length <= 32 },
  { id: 'req-upper', test: p => /[A-Z]/.test(p) },
  { id: 'req-lower', test: p => /[a-z]/.test(p) },
  { id: 'req-num',   test: p => /[0-9]/.test(p) }
];

function getPwdScore(p) {
  return checks.filter(c => c.test(p)).length;
}

function updatePwdReqs(p) {
  checks.forEach(c => {
    const el = document.getElementById(c.id);
    el.className = p.length > 0 ? (c.test(p) ? 'ok' : 'fail') : '';
  });
}

const strengthConfig = [
  { label: '', color: 'transparent' },
  { label: '弱', color: '#e74c3c' },
  { label: '一般', color: '#e67e22' },
  { label: '良好', color: '#f1c40f' },
  { label: '强', color: '#2ecc71' }
];

function onPwdInput() {
  const p = document.getElementById('regPwd').value;
  clearMsg('regPwdMsg');

  const bar = document.getElementById('pwdStrength');
  bar.style.display = p.length > 0 ? 'block' : 'none';

  const score = getPwdScore(p);
  const fill = document.getElementById('pwdFill');
  const lbl  = document.getElementById('pwdLabel');
  const cfg  = strengthConfig[score] || strengthConfig[0];

  fill.style.width = `${(score / 4) * 100}%`;
  fill.style.background = cfg.color;
  lbl.textContent = p.length > 0 ? `密码强度：${cfg.label}` : '';

  updatePwdReqs(p);
  checkPwdMatch();
}

function checkPwdMatch() {
  const p1 = document.getElementById('regPwd').value;
  const p2 = document.getElementById('regPwd2').value;
  const err = document.getElementById('pwdError');
  if (!p2) { clearMsg('pwdError'); return; }
  if (p1 !== p2) {
    setMsg('pwdError', '密码不匹配', 'error');
    setFieldState('regPwd2', 'error');
  } else {
    setMsg('pwdError', '密码一致 ✓', 'success');
    setFieldState('regPwd2', 'success');
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
async function handleRegister() {
  const email    = document.getElementById('regEmail').value.trim();
  const username = document.getElementById('regName').value.trim();
  const password = document.getElementById('regPwd').value;
  const confirm  = document.getElementById('regPwd2').value;

  let valid = true;

  // Email
  if (!email) {
    setMsg('regEmailMsg', '请输入邮箱', 'error');
    setFieldState('regEmail', 'error');
    valid = false;
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    setMsg('regEmailMsg', '邮箱格式不正确', 'error');
    setFieldState('regEmail', 'error');
    valid = false;
  }

  // Username
  if (!username) {
    setMsg('regNameMsg', '请输入用户名', 'error');
    setFieldState('regName', 'error');
    valid = false;
  } else if (username.length < 2 || username.length > 20) {
    setMsg('regNameMsg', '用户名长度为 2-20 个字符', 'error');
    setFieldState('regName', 'error');
    valid = false;
  }

  // Password
  const score = getPwdScore(password);
  if (!password) {
    setMsg('regPwdMsg', '请输入密码', 'error');
    valid = false;
  } else if (score < 4) {
    setMsg('regPwdMsg', '密码不满足所有要求', 'error');
    valid = false;
  }

  // Confirm
  if (password !== confirm) {
    setMsg('pwdError', '密码不匹配', 'error');
    valid = false;
  }

  if (!valid) return;

  const btn = document.getElementById('regBtn');
  btn.disabled = true;
  btn.textContent = '注册中…';

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, confirmPassword: confirm })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`🎉 注册成功！您的 UID：${data.data.uid}`, 'success');
      closeRegister();
    } else {
      showToast(data.message, 'error');
    }
  } catch (e) {
    showToast('网络错误，请稍后重试', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '注册';
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPwd').value;

  let valid = true;
  clearMsg('loginEmailMsg');
  clearMsg('loginPwdMsg');

  if (!email) {
    setMsg('loginEmailMsg', '请输入邮箱', 'error');
    setFieldState('loginEmail', 'error');
    valid = false;
  }
  if (!password) {
    setMsg('loginPwdMsg', '请输入密码', 'error');
    setFieldState('loginPwd', 'error');
    valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = '登录中…';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`欢迎回来，${data.data.username}！UID: ${data.data.uid}`, 'success');
      setFieldState('loginEmail', 'success');
    } else {
      showToast(data.message, 'error');
      setFieldState('loginEmail', 'error');
      setFieldState('loginPwd', 'error');
    }
  } catch (e) {
    showToast('网络错误，请稍后重试', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '登录';
  }
}

// Enter key support
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const modal = document.getElementById('regModal');
  if (modal.classList.contains('active')) handleRegister();
  else handleLogin();
});