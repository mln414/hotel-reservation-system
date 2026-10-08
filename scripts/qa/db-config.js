import { spawnSync } from 'node:child_process'

export function databaseConfig(env = process.env) {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  const missing = required.filter((key) => !env[key]?.trim())
  if (missing.length) throw new Error(`Missing required database configuration: ${missing.join(', ')}`)
  if (!/^\d+$/.test(env.DB_PORT) || Number(env.DB_PORT) < 1 || Number(env.DB_PORT) > 65535) {
    throw new Error('DB_PORT must be a valid TCP port.')
  }
  return Object.fromEntries(required.map((key) => [key, env[key]]))
}

export function queryDatabase(sql) {
  const config = databaseConfig()
  const result = spawnSync('mysql', [
    '--host', config.DB_HOST, '--port', config.DB_PORT, '--user', config.DB_USER,
    '--database', config.DB_NAME, '--batch', '--execute', sql,
  ], { encoding: 'utf8', shell: false, env: { ...process.env, MYSQL_PWD: config.DB_PASSWORD } })
  // Never print CLI environment, stderr, or credentials.
  if (result.error || result.status !== 0) throw new Error('Database verification failed. Check DB_* configuration and MySQL availability.')
  return result.stdout
}
