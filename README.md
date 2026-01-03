# Star Tracker

A React application for tracking and managing your favorite stars with AI-powered features.

## Features

- 🌟 Star tracking and management
- 🤖 AI-powered bio generation and image analysis
- 🎨 AI image generation with multiple models
- 📊 Statistics and streak tracking
- 🔐 Authentication with Supabase
- 🎯 Settings and customization

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: React Context API
- **Database**: Supabase
- **AI Services**: Google Gemini API
- **Styling**: Tailwind CSS

## Environment Variables

This project uses environment variables for configuration. Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_public_key

# Google Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Important**: Never commit `.env` files to version control. They are excluded in `.gitignore`.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) to view the application.

## Deployment to Vercel

### Prerequisites

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

### Deployment Steps

1. **Push to GitHub first** (recommended):
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Vite project

3. **Configure Environment Variables in Vercel**:
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add the same environment variables as in your `.env.local`:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_GEMINI_API_KEY`

4. **Deploy**:
   - Vercel will automatically deploy when you push to your main branch
   - Or manually trigger deployment from the Vercel dashboard

### Alternative: Deploy via CLI

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## Port Configuration

- **Development**: The app runs on port 5173 (configured in `vite.config.ts`)
- **Production**: Vercel handles port configuration automatically
- **No port changes needed** for Vercel deployment

## Files to Exclude from Git

The following files are automatically excluded by `.gitignore`:

- `.env` files (environment variables)
- `node_modules/` (dependencies)
- Build outputs (`dist/`, `.next/`, etc.)
- IDE configuration files
- OS-specific files (`.DS_Store`, `Thumbs.db`)

## Important Notes for Vercel Deployment

1. **Environment Variables**: All `VITE_*` variables must be set in Vercel's environment settings
2. **Build Command**: Vercel will use `npm run build` automatically
3. **Output Directory**: Vercel will serve from the `dist/` directory
4. **No Server-Side Code**: This is a static site, so no server configuration is needed

## Troubleshooting

### Environment Variables Not Working
- Ensure all `VITE_*` variables are set in Vercel dashboard
- Check that variable names match exactly
- Redeploy after adding variables

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (check `package.json` engines)

### Supabase Issues
- Verify your Supabase project is configured correctly
- Check that your API keys have the necessary permissions

## Support

For issues related to:
- **Application Logic**: Check the source code in `src/`
- **Vite Configuration**: See `vite.config.ts`
- **Supabase Integration**: Check `src/services/supabase.ts`
- **AI Features**: Check `services/geminiService.ts`

## License

[Add your license here]
