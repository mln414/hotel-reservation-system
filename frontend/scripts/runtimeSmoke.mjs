import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const routes = process.argv.slice(2)
const paths = routes.length ? routes : ['/']
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const { default: RuntimeSmokeApp } = await server.ssrLoadModule('/scripts/RuntimeSmokeApp.jsx')
  for (const pathname of paths) {
    const html = renderToString(React.createElement(RuntimeSmokeApp, { pathname }))
    if (!html.trim()) throw new Error(`${pathname} rendered an empty document`)
    console.log(`PASS ${pathname} (${html.length} characters)`)
  }
} finally {
  await server.close()
}
