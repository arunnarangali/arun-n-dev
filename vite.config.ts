import { Readable } from 'node:stream'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleChatRequest, type ChatEnv } from './worker/chat'

// Serves `/api/chat` in dev with the same code as the Cloudflare Worker, reading
// OLLAMA_API_KEY from `.env.local`. Non-VITE_ variables never reach the client bundle.
const chatDevServer = (env: ChatEnv): Plugin => ({
  name: 'chat-dev-server',
  configureServer(server) {
    server.middlewares.use('/api/chat', async (req, res) => {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(chunk as Buffer)
      const request = new Request(`http://localhost${req.url ?? ''}`, {
        method: req.method,
        headers: { 'Content-Type': 'application/json', 'X-Owner-Passcode': String(req.headers['x-owner-passcode'] ?? '') },
        body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
      })
      try {
        const response = await handleChatRequest(request, env, req.socket.remoteAddress)
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        if (response.body) Readable.fromWeb(response.body as never).pipe(res)
        else res.end()
      } catch (error) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Chat proxy failed' }))
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      chatDevServer({ OLLAMA_API_KEY: env.OLLAMA_API_KEY, OWNER_PASSCODE: env.OWNER_PASSCODE }),
    ],
    base: '/arun-n-dev/',
  }
})
