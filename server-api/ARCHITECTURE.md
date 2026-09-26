# Inner View — Arquitetura do Backend

## Visão Geral

API REST construída com **NestJS** + **Prisma ORM** + **PostgreSQL**. Expõe documentação via **Swagger** em `/docs`.

---

## Infraestrutura

```
┌─────────────────────────────────┐
│           Docker Compose        │
│                                 │
│  ┌──────────────┐  ┌──────────┐ │
│  │  server-api  │  │ postgres │ │
│  │  NestJS :3000│──│  :5432   │ │
│  └──────────────┘  └──────────┘ │
└─────────────────────────────────┘
```

Arquivo de referência: `docker-compose.yml` e `Dockerfile` na raiz.

---

## Stack

| Camada       | Tecnologia                          |
| ------------ | ----------------------------------- |
| Framework    | NestJS (Express)                    |
| Linguagem    | TypeScript                          |
| ORM          | Prisma                              |
| Banco        | PostgreSQL                          |
| Autenticação | JWT (Access + Refresh via Passport) |
| Validação    | Zod (ZodValidationPipe)             |
| Documentação | Swagger / OpenAPI                   |

---

## Autenticação

JWT com par de tokens — Access (15 min) e Refresh (7 dias). O refresh token é hasheado e persistido na tabela `Session`.

```
Client                    API
  │                        │
  ├─── POST /auth/signin ──►│
  │◄── { accessToken,       │
  │      refreshToken } ────┤
  │                        │
  ├─── GET /... (Bearer accessToken) ──►│  ← válido 15 min
  │                        │
  ├─── POST /auth/refresh (Bearer refreshToken) ──►│
  │◄── { accessToken } ────┤  ← renova sem re-login
```

| Rota               | Guard      | Descrição               |
| ------------------ | ---------- | ----------------------- |
| POST /auth/signup  | —          | Cadastro de usuário     |
| POST /auth/signin  | —          | Login → par de tokens   |
| POST /auth/refresh | JwtRefresh | Renova o access token   |
| GET /auth/me       | JwtAccess  | Dados do usuário logado |
