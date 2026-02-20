# Backend

The backend is optional — the app works fully client-side without it. When running, it provides workflow persistence and user authentication.

## Stack

- **Express 5** — HTTP server and API routes
- **better-sqlite3** — SQLite database (file: `wowflow.db`)
- **JWT** — Token-based authentication

## Running

```bash
npm start          # Server only (port 3001)
npm run dev        # Client + server concurrently
```

## API Routes

All API routes are in `server/index.js`.

### Auth

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/register` | `{ username, password }` | Create account |
| POST | `/api/login` | `{ username, password }` | Login, returns JWT |

### Workflows (requires JWT in `Authorization: Bearer <token>` header)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/workflows` | — | List user's workflows |
| GET | `/api/workflows/:id` | — | Get single workflow |
| POST | `/api/workflows` | `{ name, data }` | Create workflow |
| PUT | `/api/workflows/:id` | `{ name, data }` | Update workflow |
| DELETE | `/api/workflows/:id` | — | Delete workflow |

## Database Schema

Two tables in `wowflow.db`:

**users**
- `id` INTEGER PRIMARY KEY
- `username` TEXT UNIQUE
- `password` TEXT (bcrypt hashed)

**workflows**
- `id` INTEGER PRIMARY KEY
- `user_id` INTEGER (FK → users.id)
- `name` TEXT
- `data` TEXT (JSON string of nodes + edges)
- `created_at` DATETIME
- `updated_at` DATETIME
