# Pixel Library

A full-stack web application for managing and organizing pixel art assets.

## Project Structure
```
├── client/             # Frontend React application
├── server/             # Backend Express server
├── shared/            # Shared utilities and types
└── database/           # Database migrations and schema
```

## Prerequisites
- Node.js >= 14
- npm >= 6

## Getting Started

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
- Copy `.env.example` to `.env` in both client and server directories
- Update the values as needed

3. Start development servers:
```bash
npm run dev
```

This will start both the client (Vite) and server (Express) in development mode.

## Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start only the client
- `npm run dev:server` - Start only the server
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm run lint` - Run linting
- `npm test` - Run tests
- `npm run clean` - Clean up node_modules

## Production Deployment

### Prerequisites
1. Set up a production server
2. Configure SSL/HTTPS
3. Set up domain and DNS
4. Configure database

### Deployment Steps

1. Build the project:
```bash
npm run build
```

2. Set environment variables:
```bash
# Server
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
CORS_ORIGIN=https://your-domain.com

# Client
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://api.your-domain.com
```

3. Start the server:
```bash
npm start
```

### Server Configuration

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Client files
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Monitoring Setup

1. Error Tracking:
   - Set up Sentry or similar service
   - Add error boundaries in React
   - Configure server-side error logging

2. Performance Monitoring:
   - Set up New Relic or similar
   - Configure server metrics
   - Monitor database performance

3. Security:
   - Regular security audits
   - Keep dependencies updated
   - Monitor for vulnerabilities

## Tech Stack

- Frontend: React, Vite
- Backend: Express.js
- Database: PostgreSQL with Supabase
- Styling: CSS Modules