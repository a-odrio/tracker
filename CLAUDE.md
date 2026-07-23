@AGENTS.md

# Notas / decisiones del producto

- La app se mantiene **local** por ahora (sin deploy, sin auth). No armar hosting,
  login ni migrar la base a menos que el usuario lo pida explícitamente.
- Cuando más adelante se decida migrar a web, la base de datos elegida es
  **Neon** (Postgres serverless, free tier con scale-to-zero) — se descartó
  Supabase para este uso porque su free tier pausa el proyecto tras 7 días de
  inactividad y lo borra si sigue pausado mucho tiempo, algo problemático para
  una app personal que no se usa todos los días.
