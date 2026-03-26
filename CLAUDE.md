# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MERN stack e-commerce application (MongoDB, Express, React 18, Node.js) with Braintree payment integration. Backend serves REST API at `/api/v1/`, frontend is a Create React App project in `client/`.

## Common Commands

### Development
```bash
npm run dev              # Run backend (port 6060) + frontend (port 3000) concurrently
npm start                # Backend only
npm run client           # Frontend only
```

### Testing
```bash
npm run test             # All tests (backend + frontend)
npm run test:backend     # Backend Jest tests
npm run test:frontend    # Frontend Jest tests (includes integration tests)
npm run test:e2e         # Playwright E2E tests (requires running servers)

# Single test file
npm run test:backend -- authController.test.js
npm run test:frontend -- Categories.test.js
npx playwright test client/tests/e2e/auth.spec.js
```

### Environment Setup
Copy `.env.example` → `.env` and `client/.env.example` → `client/.env`, then:
```bash
npm install && cd client && npm install
```

## Architecture

### Backend
- **Entry:** `server.js` (starts server + DB connection) → `app.js` (Express app, middleware, routes)
- **Routes:** `routes/` — mounted at `/api/v1/auth`, `/api/v1/product`, `/api/v1/category`
- **Controllers:** `controllers/` — business logic for each route group
- **Models:** `models/` — Mongoose schemas (User, Product, Category, Order)
- **Middleware:** `middlewares/authMiddleware.js` — `requireSignIn` (JWT verify) and `isAdmin` (role check)
- **Helpers:** `helpers/authHelper.js` — bcrypt password hashing
- **Swagger docs:** Available at `/api-docs` when server is running

### Frontend (`client/src/`)
- **Routing:** React Router v6 in `App.js`
- **Auth:** JWT stored in localStorage, managed via React Context (`context/auth.js`), synced to axios default headers
- **Route protection:** `components/Routes/Private.js` (authenticated users), `components/Routes/AdminRoute.js` (role === 1)
- **Pages:** `pages/auth/` (login/register), `pages/admin/` (admin dashboard), `pages/user/` (user dashboard)
- **UI library:** Ant Design (antd)

### API Route Structure
- `/api/v1/auth/*` — Register, login, forgot password, profile, orders
- `/api/v1/product/*` — CRUD, search, filter, photo handling, Braintree payments
- `/api/v1/category/*` — CRUD operations

## Testing Notes

- Backend tests live alongside source files (e.g., `controllers/authController.test.js`)
- Frontend unit tests live alongside components (e.g., `pages/admin/Products.test.js`)
- Integration tests: `client/tests/integration/`
- E2E tests: `client/tests/e2e/`
- Tests use `mongodb-memory-server` for in-memory DB (no external MongoDB needed for Jest)
- Backend coverage threshold: 80% lines/functions
- Frontend coverage threshold: 100% lines/functions
- Jest uses ESM via `--experimental-vm-modules`; Babel config in `babel.config.cjs`
- CI runs on GitHub Actions (Node 24) for pushes to main and all PRs
