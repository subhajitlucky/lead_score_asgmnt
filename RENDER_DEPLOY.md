# 🚀 Deploy to Render (Free Tier)

**Render** is the best free alternative to Railway - offering both web hosting and PostgreSQL database.

## Quick Deploy Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with your GitHub account

### 3. Deploy Database First
1. Click **"New +"** → **"PostgreSQL"**
2. Settings:
   - **Name**: `lead-score-db`
   - **Database**: `lead_score_asgmnt_db`
   - **User**: `lead_score_asgmnt_db_user`
   - **Region**: Choose closest to you
   - **Instance Type**: Free
3. Click **"Create Database"**
4. **Save the Database URL** (you'll need it)

### 4. Deploy Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Settings:
   - **Name**: `lead-score-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 5. Set Environment Variables
In your web service dashboard, go to **Environment** tab and add:
```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
GEMINI_API_KEY=your_gemini_api_key_here
```

### 6. Deploy!
- Click **"Create Web Service"**
- Render will automatically deploy from your GitHub repo
- You'll get a URL like: `https://lead-score-backend.onrender.com`

## ✅ Render Free Tier Benefits
- 🗄️ PostgreSQL Database (500MB)
- 🌐 Web Service Hosting
- 🔒 SSL Certificates
- 🔄 Auto-deploys from GitHub
- 💯 No credit card required

## 🔗 Alternative Free Platforms

If Render doesn't work, try these:

### **Cyclic.sh**
- Connect GitHub repo
- Auto-detects Node.js
- Use **Supabase** for PostgreSQL (free tier)

### **Fly.io**
- Free tier: 3 shared CPU VMs
- Use **Neon** for PostgreSQL (free tier)

### **Vercel + PlanetScale**
- Vercel for serverless API
- PlanetScale for MySQL (free tier)

---

## 🚨 Important Notes

1. **Database URL**: Make sure to use the exact DATABASE_URL from Render
2. **Environment Variables**: Set GEMINI_API_KEY in Render dashboard
3. **Port**: Our app uses `process.env.PORT` (Render handles this automatically)
4. **Cold Starts**: Free tier services sleep after 15 minutes of inactivity

Your API will be live at: `https://your-app-name.onrender.com`