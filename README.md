# EkSaha

Full-stack subscription IT services platform built with React, Express, and MongoDB.

## Project Structure

```text
eksaha/
|-- client/
|   |-- src/
|   |   |-- app/             # Routing and application composition
|   |   |-- components/      # Common, dashboard, feedback, and navigation UI
|   |   |-- data/            # Static website content
|   |   |-- hooks/           # Reusable application hooks
|   |   |-- layouts/         # Public, user, and admin shells
|   |   |-- pages/           # Route domains: public, auth, dashboard, admin
|   |   |-- services/http/   # API client and interceptors
|   |   |-- store/           # Persisted app, user dashboard, and admin state
|   |   `-- styles/          # Global Tailwind styles
|   `-- package.json
|-- server/
|   |-- src/
|   |   |-- config/          # Database and runtime configuration
|   |   |-- middleware/      # Authentication and authorization
|   |   |-- models/          # Mongoose schemas
|   |   |-- routes/          # Authentication and platform endpoints
|   |   |-- app.js           # Express application
|   |   `-- server.js        # Database connection and HTTP startup
|   `-- package.json
|-- scripts/                 # Cross-platform development utilities
`-- package.json             # Workspace commands
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `client/.env` and `server/.env` from their respective `.env.example` files.

3. Start both applications:

```bash
npm run dev
```

The website runs at `http://localhost:5173` and the API at `http://localhost:5000`.

## Verification

```bash
npm run check
npm audit
```

## Demo Access

- User: `user@eksaha.dev` / `password`
- Admin: `admin@eksaha.dev` / `password`

Without external payment or OAuth credentials, those integrations remain in demo mode.
# EkSaha
