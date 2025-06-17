# WordWise Deployment Guide

This guide walks you through deploying WordWise to production using Vercel with automated CI/CD via GitHub Actions.

## Prerequisites

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project**: Running Supabase instance with edge functions deployed
4. **OpenAI API Key**: For AI analysis functions

## Step 1: Prepare Your Repository

### 1.1 Ensure All Code is Committed
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Verify GitHub Secrets
In your GitHub repository, go to Settings > Secrets and Variables > Actions and add:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Step 2: Deploy to Vercel

### 2.1 Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your WordWise repository from GitHub
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `cd web && npm run build`
   - **Output Directory**: `web/dist`
   - **Install Command**: `cd web && npm ci`

### 2.2 Configure Environment Variables

In Vercel dashboard, go to your project > Settings > Environment Variables and add:

#### Production Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Optional: Preview/Development Variables
You can set different values for preview deployments if needed.

### 2.3 Configure Domains (Optional)

1. In Vercel dashboard, go to your project > Settings > Domains
2. Add your custom domain if you have one
3. Configure DNS settings as instructed by Vercel

## Step 3: Verify Deployment

### 3.1 Check Build Status
- Monitor the deployment in Vercel dashboard
- Check GitHub Actions for CI pipeline status
- Review build logs for any errors

### 3.2 Test Functionality
1. Visit your deployed site
2. Test user registration/login
3. Create a document and verify AI suggestions work
4. Test both General and Sales personas
5. Verify sales tools functionality

### 3.3 Monitor Performance
- Check Vercel Analytics for performance metrics
- Monitor Supabase logs for API usage
- Verify edge functions are responding correctly

## Step 4: Set Up Automatic Deployments

With the current setup:
- ✅ Pushes to `main` branch automatically deploy to production
- ✅ Pull requests create preview deployments
- ✅ CI pipeline runs linting and builds on every commit

## Troubleshooting

### Common Issues

#### Build Fails with Environment Variables
**Problem**: Build fails because environment variables are undefined
**Solution**: Ensure all required environment variables are set in Vercel dashboard

#### Supabase Connection Issues
**Problem**: App can't connect to Supabase in production
**Solution**: 
1. Verify environment variables are correct
2. Check Supabase project settings for CORS configuration
3. Ensure RLS policies allow public access where needed

#### Edge Functions Not Working
**Problem**: AI suggestions don't work in production
**Solution**:
1. Verify Supabase edge functions are deployed: `supabase functions list`
2. Check function logs: `supabase functions logs ai-analyze`
3. Ensure OpenAI API key is set in Supabase dashboard

#### Routing Issues (404 on Refresh)
**Problem**: Page refreshes result in 404 errors
**Solution**: The `vercel.json` rewrites configuration should handle this automatically

### Performance Optimization

#### Enable Vercel Speed Insights
```bash
npm install @vercel/analytics
```

Add to your `main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

// Add <Analytics /> component to your root
```

#### Enable Vercel Web Vitals
```bash
npm install @vercel/speed-insights
```

## Security Considerations

### Environment Variables
- ✅ Never commit API keys to version control
- ✅ Use Vercel environment variables for secrets
- ✅ Supabase anon key is safe for frontend use (with RLS)

### Headers
The `vercel.json` includes security headers:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Referrer-Policy` - Controls referrer information

## Monitoring and Maintenance

### Regular Tasks
1. **Monitor Performance**: Check Vercel analytics weekly
2. **Update Dependencies**: Run `npm audit` and update packages monthly
3. **Check Logs**: Review Supabase function logs for errors
4. **Backup Data**: Ensure Supabase backups are configured

### Scaling Considerations
- **Supabase**: Monitor database usage and consider upgrading plan
- **Vercel**: Check bandwidth and function execution limits
- **OpenAI**: Monitor API usage and costs

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review GitHub Actions workflow runs
3. Check Supabase dashboard for function errors
4. Review this deployment guide for common solutions

---

**Next Steps**: Once deployed, consider setting up monitoring, analytics, and user feedback collection to improve the product. 