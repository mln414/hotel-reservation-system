import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
try {
  const { default: run } = await server.ssrLoadModule('/scripts/reservationMediaCases.jsx')
  run()
} finally {
  await server.close()
}
