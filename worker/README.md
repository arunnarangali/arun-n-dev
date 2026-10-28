# Chat proxy

`chat.ts` sits between the chat panel and Ollama. It's needed because ollama.com blocks
requests from browsers, and because the API key must not be in the website code.

- **Local:** nothing to do. `npm run dev` runs `chat.ts` inside Vite using `OLLAMA_API_KEY` and `OWNER_PASSCODE` from `.env.local`.
- **Live site:** deploy it once to Cloudflare (free):

```bash
cd worker
npx wrangler secret put OLLAMA_API_KEY
npx wrangler secret put OWNER_PASSCODE   # the code JARVIS asks for to unlock owner mode
npx wrangler deploy
```

Paste the printed `https://….workers.dev` URL into `PRODUCTION_CHAT_URL` in
`src/portfolio/ai/chatClient.ts`, then push.
