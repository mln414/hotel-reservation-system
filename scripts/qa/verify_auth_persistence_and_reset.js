import { databaseConfig, queryDatabase } from './db-config.js';
// Fail before HTTP mutations when database configuration is missing.
databaseConfig();


const BASE_URL = 'http://localhost:8080';
let csrfToken = '';
let cookieHeader = '';

async function fetchCsrf() {
  const res = await fetch(`${BASE_URL}/api/v1/auth/csrf`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const raw = setCookie.split(';')[0];
    cookieHeader = cookieHeader ? `${cookieHeader}; ${raw}` : raw;
  }
  const body = await res.json();
  csrfToken = body.token;
  return csrfToken;
}

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...options.headers };
  if (cookieHeader) headers['Cookie'] = cookieHeader;
  if (!['GET', 'HEAD'].includes(method)) {
    if (!csrfToken) await fetchCsrf();
    headers['X-XSRF-TOKEN'] = csrfToken;
  }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, method, headers });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const raw = setCookie.split(';')[0];
    cookieHeader = cookieHeader ? `${cookieHeader}; ${raw}` : raw;
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

async function runLiveTest() {
  console.log('=== STARTING LIVE AUTHENTICATION PERSISTENCE & RESET QA ===');

  await fetchCsrf();
  console.log('[1. CSRF] Initialized CSRF token.');

  // 1. Reset DB manager to initial state if needed or try login with permanent password
  let managerPass = 'NewManagerPass#2026!Lanka';
  let loginRes = await request('/api/v1/auth/login', {
    method: 'POST',
    body: { email: 'manager@lankastay.local', password: managerPass },
  });

  if (loginRes.status === 401) {
    console.log('[2. Staff Auth] Logging in with initial temporary password...');
    loginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'manager@lankastay.local', password: 'TempMgr#2026!LankaStaySecure' },
    });
    if (loginRes.body?.status === 'PASSWORD_CHANGE_REQUIRED') {
      console.log('[2. Staff Auth] Initial password change required. Changing password...');
      const changeRes = await request('/api/v1/auth/change-initial-password', {
        method: 'POST',
        body: { newPassword: managerPass, confirmNewPassword: managerPass },
      });
      console.log('[2. Staff Auth] Password changed successfully to permanent password. Status:', changeRes.status);
    }
  } else {
    console.log('[2. Staff Auth] Manager logged in directly with existing permanent password.');
  }

  // 2. Register QA Customer
  const timestamp = Date.now();
  const customerEmail = `qa.customer.${timestamp}@lankastay.test`;
  const initialCustomerPass = 'InitialCustomerPass#2026!';

  console.log(`[3. Customer Auth] Registering customer: ${customerEmail}...`);
  const regRes = await request('/api/v1/customer/auth/register', {
    method: 'POST',
    body: {
      firstName: 'Test',
      lastName: 'Customer',
      email: customerEmail,
      phone: '0712345678',
      password: initialCustomerPass,
    },
  });
  console.log('[3. Customer Auth] Registration response status:', regRes.status, 'ID:', regRes.body?.id);

  // Verify in MySQL
  const mysqlOut = queryDatabase(`SELECT id, email, role, status FROM customer_users WHERE email='${customerEmail}';`);
  console.log('[4. MySQL Verification] Customer row in DB:\n', mysqlOut.trim());

  // 3. Customer Login
  console.log('[5. Customer Auth] Customer logging in...');
  const custLoginRes = await request('/api/v1/customer/auth/login', {
    method: 'POST',
    body: { email: customerEmail, password: initialCustomerPass },
  });
  console.log('[5. Customer Auth] Customer login status:', custLoginRes.status);

  // 4. Request Password Reset for Customer
  console.log('[6. Password Reset] Requesting password reset...');
  const resetReqRes = await request('/api/v1/customer/auth/forgot-password', {
    method: 'POST',
    body: { email: customerEmail },
  });
  console.log('[6. Password Reset] Response:', resetReqRes.body?.message);

  // Supply the token from the delivered email privately; no public token lookup exists.
  const rawToken = process.env.QA_RESET_TOKEN;
  if (!rawToken) throw new Error('Set QA_RESET_TOKEN from the delivered reset email to complete reset verification.');

  const newCustomerPass = 'NewCustomerPass#2026!Updated';

  console.log('[7. Password Reset] Executing reset password...');
  const resetExecRes = await request('/api/v1/customer/auth/reset-password', {
    method: 'POST',
    body: { token: rawToken, newPassword: newCustomerPass, confirmNewPassword: newCustomerPass },
  });
  console.log('[7. Password Reset] Reset response status:', resetExecRes.status);

  // Verify old password fails and new password succeeds
  const oldPassFail = await request('/api/v1/customer/auth/login', {
    method: 'POST',
    body: { email: customerEmail, password: initialCustomerPass },
  });
  console.log('[8. Password Reset] Old password login status (expected 401):', oldPassFail.status);

  const newPassSucc = await request('/api/v1/customer/auth/login', {
    method: 'POST',
    body: { email: customerEmail, password: newCustomerPass },
  });
  console.log('[8. Password Reset] New password login status (expected 200):', newPassSucc.status);

  console.log('=== QA LIVE SCRIPT COMPLETE ===');
}

runLiveTest().catch((error) => { console.error(error.message); process.exitCode = 1; });
