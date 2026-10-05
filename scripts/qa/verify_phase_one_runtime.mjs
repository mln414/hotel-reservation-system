import assert from "node:assert/strict";
if (!process.env.PHASE1_BASE_URL || process.env.PHASE1_ALLOW_ISOLATED_FIXTURES !== "true") {
 throw new Error("Set PHASE1_BASE_URL for an isolated local test backend and PHASE1_ALLOW_ISOLATED_FIXTURES=true. This script creates a test customer.");
}
const address = new URL(process.env.PHASE1_BASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(address.hostname)) throw new Error("Only a local isolated backend is supported.");
const base = address.origin;
const cookies = new Map();
async function request(path, options = {}) {
 const res = await fetch(base + path, {...options, headers:{...options.headers, Cookie:Array.from(cookies, ([k,v]) => k+"="+v).join("; ")}});
 for(const cookie of res.headers.getSetCookie()) { const pair=cookie.split(";")[0]; const i=pair.indexOf("="); cookies.set(pair.slice(0,i),pair.slice(i+1)); }
 const text=await res.text(); let body; try { body=JSON.parse(text); } catch { body=text; }
 return {status:res.status,body,headers:res.headers};
}
(async()=>{
 for(const prefix of ["/api/v1/auth","/api/v1/customer/auth"]) {
  for(const suffix of ["/forgot-password/change-password","/forgot-password/check-email"])
   assert.equal((await request(prefix+suffix,{method:"POST"})).status,404);
 }
 assert.equal((await request("/api/v1/auth/dev-last-reset-link")).status,404);
 const csrf=await request("/api/v1/auth/csrf"); assert.equal(csrf.status,200);
 const post=(path,body)=>request(path,{method:"POST",headers:{"Content-Type":"application/json",[csrf.body.headerName]:csrf.body.token},body:JSON.stringify(body)});
 const email="runtime-phase1-"+Date.now()+"@example.test",password="Original1!SecurePassword";
 assert.equal((await post("/api/v1/customer/auth/register",{email,password,firstName:"Runtime",lastName:"Test",phone:"0712345678"})).status,201);
 const known=await post("/api/v1/customer/auth/forgot-password",{email});
 const unknown=await post("/api/v1/customer/auth/forgot-password",{email:"absent-phase1@example.test"});
 assert.equal(known.status,200); assert.equal(unknown.status,200); assert.deepEqual(known.body,unknown.body);
 assert.equal((await post("/api/v1/auth/forgot-password",{email:"absent-staff@example.test"})).status,200);
 assert.equal((await post("/api/v1/customer/auth/reset-password",{token:"random-invalid-token",newPassword:"Changed2@SecurePassword",confirmNewPassword:"Changed2@SecurePassword"})).status,400);
 assert.equal((await post("/api/v1/customer/auth/login",{email,password})).status,200);
 const discovery=await request("/api/destinations"); assert.equal(discovery.status,200);
 assert.equal(discovery.headers.get("x-content-type-options"),"nosniff"); assert.ok(discovery.headers.get("content-security-policy").includes("sandbox"));
 assert.equal((await request("/uploads/destinations/payload.svg")).status,404);
 console.log("PASS isolated HTTP smoke: retired routes 404, CSRF, registration/login, generic reset responses, invalid token preserves credential, public discovery, inert-upload headers.");
})().catch(error=>{console.error(error.message);process.exitCode=1;});
