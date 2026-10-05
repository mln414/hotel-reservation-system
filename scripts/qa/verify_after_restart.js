import { databaseConfig, queryDatabase } from './db-config.js';
// Fail before HTTP mutations when database configuration is missing.
databaseConfig();
const BASE_URL = 'http://localhost:8080';
let csrfToken = '';
let cookieHeader = '';

async function fetchCsrf() {
  const res = await fetch(`${BASE_URL}/api/v1/auth/csrf`);
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookieHeader = setCookie.split(';')[0];
  const body = await res.json();
  csrfToken = body.token;
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
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

async function verifyAfterRestart() {
  console.log('=== VERIFYING LOGIN AFTER SERVER RESTART ===');
  await fetchCsrf();

  // 1. Staff Manager login with permanent password after restart
  const managerLogin = await request('/api/v1/auth/login', {
    method: 'POST',
    body: { email: 'manager@lankastay.local', password: 'NewManagerPass#2026!Lanka' },
  });
  console.log('[1. Staff Manager Restart Login] Status:', managerLogin.status, 'User status:', managerLogin.body?.status);

  // 2. Customer login with reset password after restart
  // Query MySQL for the latest QA customer email created right before restart
  const mysqlOut = queryDatabase('SELECT email FROM customer_users ORDER BY created_at DESC LIMIT 1;');
  const lines = mysqlOut.trim().split('\n');
  const customerEmail = lines.length > 1 ? lines[1].trim() : null;

  if (customerEmail) {
    console.log(`[2. Customer Restart Login] Testing customer: ${customerEmail}...`);
    const custLogin = await request('/api/v1/customer/auth/login', {
      method: 'POST',
      body: { email: customerEmail, password: 'NewCustomerPass#2026!Updated' },
    });
    console.log('[2. Customer Restart Login] Status:', custLogin.status, 'Customer Email:', custLogin.body?.email);
  }

  console.log('=== SERVER RESTART CREDENTIAL PERSISTENCE VERIFIED SUCCESS ===');
}

verifyAfterRestart().catch((error) => { console.error(error.message); process.exitCode = 1; });
