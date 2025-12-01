# Deployment

## Prerequisites

- PostgreSQL database
- Node.js 20+ runtime
- Environment variables configured

## Environment Variables

Required for production:

```bash
DATABASE_URL=postgresql://...
AI_GATEWAY_API_KEY=...
APP_BASE_URL=https://yourdomain.com
BETTER_AUTH_SECRET=... # min 16 chars, strong entropy recommended
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Vercel Deployment

1. **Connect repository** to Vercel
2. **Set environment variables** in project settings
3. **Deploy**:
   ```bash
   pnpm build
   vercel deploy --prod
   ```

Build command: `pnpm build`  
Output directory: `.vercel/output`

## Database Migrations

Run migrations before deploying:

```bash
pnpm db:migrate
```

Or in CI/CD:

```bash
pnpm --filter @base/core db:migrate
```

## Health Checks

- `/` - Main app should load
- `/api/auth/session` - Auth endpoint check

## Troubleshooting

**Build fails**
- Check all environment variables are set
- Verify database connection
- Run `pnpm typecheck` locally first

**Database errors**
- Ensure migrations are applied
- Check `DATABASE_URL` format
- Verify network access to database

**Auth issues**
- Verify OAuth credentials
- Check `APP_BASE_URL` matches domain
- Ensure callback URLs are configured in OAuth app

