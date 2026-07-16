# Tracker

App personal para organizar, planificar y registrar trabajo: Clientes → Proyectos → Tareas, tablero Kanban, planificación semanal, registro de tiempo tipo calendario y reportes.

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

`.env` no se versiona (está en `.gitignore`); usá `.env.example` como referencia. La base de datos es un archivo SQLite local (`dev.db`), también ignorado por git.
