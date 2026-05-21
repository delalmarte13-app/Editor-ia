# EditorialAI — AI-Powered Book Writing Assistant

EditorialAI is a production-ready web application designed to help authors write, revise, export, and publish books using specialized AI agents.

## Architecture

```text
+----------------+      +-------------------+      +-------------------+
|   Frontend     |      |      Backend      |      |    Database       |
| (React + Vite) | <--> | (Express + tRPC)  | <--> | (PostgreSQL/Neon) |
+----------------+      +---------+---------+      +-------------------+
                                  |
                                  v
                        +-------------------+
                        |     AI APIs       |
                        | (Groq, ElevenLabs)|
                        +-------------------+
```

## Quick Start (Local Development)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/delalmarte13-app/Editor-ia
   cd editorial-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file based on `.env.example`.

4. **Setup Database**:
   - Go to [neon.tech](https://neon.tech) and create a PostgreSQL database.
   - Copy the connection string to `DATABASE_URL` in `.env`.
   - Run migrations: `npm run db:push`.

5. **Start development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

| Name | Required | Description | Source |
|------|----------|-------------|--------|
| `JWT_SECRET` | Yes | Secret for session tokens | Generate a random 32+ char string |
| `DATABASE_URL` | Yes | PostgreSQL connection string | Neon.tech / PlanetScale |
| `VITE_APP_ID` | Yes | Application identifier | `editorial-ai` |
| `BUILT_IN_FORGE_API_URL` | Yes | LLM API Base URL | `https://api.groq.com/openai` |
| `BUILT_IN_FORGE_API_KEY` | Yes | LLM API Key | Groq Console |
| `ELEVENLABS_API_KEY` | No | TTS API Key | ElevenLabs |

## Deployment

### Backend (Railway)
1. Create a new project on [Railway](https://railway.app).
2. Connect your GitHub repository.
3. Set the start command to `npm run build && npm start`.
4. Add all environment variables.

### Frontend (Vercel)
1. Import the repository on [Vercel](https://vercel.com).
2. Set the root directory to `client`.
3. Set the build command to `vite build`.
4. Set the output directory to `../dist/public`.
5. Add `VITE_API_URL` pointing to your Railway backend.

## Free Tier Limits

| Service | Free Tier Limit |
|---------|----------------|
| Neon / PlanetScale | 5GB storage |
| Railway | $5 credit/month |
| Vercel | 100GB bandwidth/month |
| Groq | 14,400 req/day (llama-3.3-70b) |
| ElevenLabs | 10,000 characters/month |
