# Pixel Library Project

## Project Overview
A modern web application built with React, Node.js, and Supabase, featuring a pixel art library management system.

## Technology Stack
- **Frontend**: React with Vite
- **Backend**: Node.js with Express
- **Database**: Supabase
- **Deployment**: Coolify
- **Version Control**: GitHub
- **CI/CD**: GitHub Actions

## Development Journey

### 1. Initial Setup
- Created React frontend with Vite
- Set up Node.js backend with Express
- Integrated Supabase for database management
- Configured TypeScript for type safety
- Implemented monorepo structure with shared types

### 2. Key Implementation Details
- Configured shared TypeScript definitions
- Set up environment variables for different environments
- Implemented Supabase client with error handling
- Created API endpoints for data management
- Added proper error logging and monitoring

### 3. Deployment Process

#### GitHub Setup
1. Created new repository
2. Added remote origin
3. Configured branch protection rules
4. Set up GitHub Actions workflow

#### Coolify Deployment
1. Installed Coolify on server
2. Connected GitHub repository
3. Configured environment variables
4. Set up build and deployment process

### 4. Environment Configuration

#### Development Environment
```bash
# client/.env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# server/.env
PORT=3000
NODE_ENV=development
```

#### Production Environment
```bash
# client/.env.production
VITE_SUPABASE_URL=production_supabase_url
VITE_SUPABASE_ANON_KEY=production_anon_key

# server/.env.production
PORT=3000
NODE_ENV=production
```

### 5. Deployment Configuration

#### Nixpacks Configuration
```toml
[phases.setup]
nixPkgs = ['nodejs-18_x']

[phases.install]
cmds = [
  'npm install --prefix server',
  'npm install --prefix client'
]

[phases.build]
cmds = [
  'npm run build --prefix client',
  'npm run build --prefix server'
]

[start]
cmd = 'cd server && npm start'
```

#### Procfile
```
web: cd server && npm start
```

## Lessons Learned

1. **Environment Configuration**
   - Keep sensitive data in environment variables
   - Use different configurations for development and production
   - Properly handle environment variables in the build process

2. **Error Handling**
   - Implement comprehensive error handling
   - Add proper logging for debugging
   - Test connection to external services during startup

3. **Deployment Best Practices**
   - Use proper build configuration for production
   - Implement health checks
   - Configure proper environment variables in deployment platform
   - Set up proper monitoring and logging

4. **Version Control**
   - Keep sensitive files out of version control
   - Use proper .gitignore configuration
   - Implement proper branching strategy

## Future Improvements

1. **Monitoring and Logging**
   - Implement centralized logging solution
   - Add performance monitoring
   - Set up alerting for critical errors

2. **Security**
   - Implement rate limiting
   - Add security headers
   - Regular security audits

3. **Performance**
   - Implement caching strategy
   - Optimize build process
   - Add CDN for static assets

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/your-username/your-repo.git
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

4. Start development servers:
```bash
# Terminal 1
cd client && npm run dev

# Terminal 2
cd server && npm run dev
```

5. Build for production:
```bash
npm run build
```

## Deployment

1. Push to GitHub:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

2. Deploy to Coolify:
   - Connect your GitHub repository
   - Configure environment variables
   - Deploy the application

## Troubleshooting

Common issues and their solutions:

1. **404 Not Found**
   - Check if the server is running
   - Verify API endpoints
   - Check routing configuration

2. **Environment Variables**
   - Ensure all required variables are set
   - Check for proper formatting
   - Verify production variables in Coolify

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check build logs
   - Verify dependencies

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Deployment Issues and Solutions

### 1. Nixpacks Configuration Error
**Error:**
```
error: undefined variable 'npm'
```

**Solution:**
- Updated `nixpacks.toml` to use correct Node.js package:
```toml
[phases.setup]
nixPkgs = ['nodejs-18_x']  # Changed from ['nodejs', 'npm']
```

### 2. Directory Path Error
**Error:**
```
/bin/bash: line 1: cd: ../client: No such file or directory
```

**Solution:**
- Fixed installation commands in `nixpacks.toml` to use correct paths:
```toml
[phases.install]
cmds = [
  'npm install --prefix server',
  'npm install --prefix client'
]
```

### 3. Missing Start Script
**Error:**
```
Missing script: 'start:prod'
```

**Solution:**
- Added missing script to `server/package.json`:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "start:prod": "node dist/index.js"
  }
}
```

### 4. Supabase Connection Error
**Error:**
```
Uncaught Error: supabaseUrl is required
```

**Solution:**
1. Added proper environment variables in Coolify:
```env
VITE_SUPABASE_URL=https://supabase.flomify.com
VITE_SUPABASE_ANON_KEY=your_anon_key
```

2. Enhanced error handling in Supabase client:
```typescript
// client/src/lib/supabase.ts
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}
```

### 5. TypeScript Type Errors
**Error:**
```
Could not find a declaration file for module 'express'
```

**Solution:**
- Installed missing type definitions:
```bash
npm install --save-dev @types/express
```

### 6. Build Process Errors
**Error:**
```
Failed to resolve import "react" from "src/App.tsx"
```

**Solution:**
- Updated Vite configuration in `client/vite.config.js`:
```javascript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### 7. 404 Page Not Found
**Error:**
Application running but showing 404 errors

**Solution:**
1. Verified server routes are correctly configured
2. Ensured static file serving is properly set up
3. Added proper error handling middleware:
```javascript
// server/src/index.ts
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
```

### 8. Environment Variable Loading
**Error:**
```
Error: Cannot find module 'dotenv'
```

**Solution:**
1. Installed dotenv package:
```bash
npm install dotenv
```

2. Added proper environment loading:
```javascript
import dotenv from 'dotenv';
dotenv.config();
```

### 9. CORS Issues
**Error:**
```
Access to fetch at 'http://api.example.com' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
- Added proper CORS configuration:
```javascript
// server/src/index.ts
import cors from 'cors';

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

### 10. Database Connection Issues
**Error:**
```
Error: Failed to connect to Supabase
```

**Solution:**
1. Added connection testing on startup:
```typescript
supabase.from('items').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) {
      console.error('Failed to connect to Supabase:', error);
    } else {
      console.log('Successfully connected to Supabase');
    }
  });
```

2. Implemented retry logic for database operations:
```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function withRetry(operation: () => Promise<any>) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}
```

## Best Practices for Error Prevention

1. **Pre-deployment Checklist**
   - Verify all environment variables are set
   - Test build process locally
   - Check all dependencies are installed
   - Verify database connections

2. **Monitoring Setup**
   - Set up error tracking (e.g., Sentry)
   - Configure application logging
   - Set up performance monitoring
   - Implement health checks

3. **Deployment Process**
   - Use staging environment
   - Implement blue-green deployment
   - Set up automated rollback
   - Monitor deployment logs

4. **Security Measures**
   - Secure environment variables
   - Implement rate limiting
   - Set up proper CORS
   - Regular security audits