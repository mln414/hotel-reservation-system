import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: run } = await server.ssrLoadModule('/scripts/reviewEditorCases.jsx')
  run()
} finally {
  await server.close()
}
