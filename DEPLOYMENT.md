# 🚀 Deployment Guide

This guide covers deploying your Lead Scoring Backend to various cloud platforms. Choose the one that best fits your needs.

## 🎯 Quick Deployment Options

| Platform | Difficulty | Cost | Best For |
|----------|------------|------|----------|
| **Railway** | ⭐ Easy | Free tier | Beginners, PostgreSQL included |
| **Render** | ⭐⭐ Easy | Free tier | Full-stack apps |
| **Heroku** | ⭐⭐ Medium | Free tier | Traditional deployments |
| **Vercel** | ⭐⭐⭐ Hard | Free tier | Frontend focus, needs external DB |

## 1️⃣ Railway Deployment (Recommended)

Railway is perfect for this project because it includes PostgreSQL and is very beginner-friendly.

### Step 1: Prepare Your Project
```bash
# Make sure your code is committed to GitHub
git add .
git commit -m "Complete lead scoring backend"
git push origin main
```

### Step 2: Deploy on Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js and deploys!

### Step 3: Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Railway creates database automatically

### Step 4: Set Environment Variables
In Railway dashboard, go to Variables tab:
```env
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 5: Create Tables
1. Go to your app's deployment URL
2. Add `/setup-db` to run table creation
3. Or use Railway's terminal feature

### Step 6: Test Your Deployment
```bash
# Replace YOUR_APP_URL with your Railway URL
curl https://your-app.railway.app/health
```

**✅ Done! Your app is live with database included!**

---

## 2️⃣ Render Deployment

Great free option with automatic deployments from GitHub.

### Step 1: Prepare for Render
Create `render.yaml` in your project root:
```yaml
services:
  - type: web
    name: lead-scoring-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        fromDatabase:
          name: lead-scoring-db
          property: connectionString
      - key: GEMINI_API_KEY
        sync: false

databases:
  - name: lead-scoring-db
    databaseName: lead_score_asgmnt_db
    user: lead_score_user
```

### Step 2: Deploy on Render
1. Go to https://render.com
2. Sign up and connect GitHub
3. Click "New" → "Blueprint"
4. Connect your repository
5. Render deploys automatically!

### Step 3: Add Environment Variables
1. Go to your service dashboard
2. Click "Environment"
3. Add `GEMINI_API_KEY` with your key

### Step 4: Initialize Database
1. Access your deployed app URL
2. Navigate to `/setup-db` to create tables

**✅ Live on Render with PostgreSQL!**

---

## 3️⃣ Heroku Deployment

Classic platform, very reliable.

### Step 1: Install Heroku CLI
```bash
# On Ubuntu/Linux
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login
```

### Step 2: Create Heroku App
```bash
# In your project directory
heroku create your-lead-scoring-app
heroku addons:create heroku-postgresql:mini
```

### Step 3: Set Environment Variables
```bash
heroku config:set GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 4: Deploy
```bash
git push heroku main
```

### Step 5: Create Database Tables
```bash
heroku run npm run setup-db
```

### Step 6: Test
```bash
curl https://your-lead-scoring-app.herokuapp.com/health
```

**✅ Live on Heroku!**

---

## 4️⃣ Vercel Deployment

Great for serverless, but requires external database.

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
vercel login
```

### Step 2: Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "GEMINI_API_KEY": "@gemini_api_key"
  }
}
```

### Step 3: Setup External Database
1. Use [ElephantSQL](https://www.elephantsql.com/) (free PostgreSQL)
2. Create database and get connection URL

### Step 4: Deploy
```bash
vercel --prod
```

### Step 5: Set Environment Variables
```bash
vercel env add DATABASE_URL
vercel env add GEMINI_API_KEY
```

**✅ Live on Vercel!**

---

## 🔧 Post-Deployment Checklist

### ✅ Essential Tests
```bash
# Replace YOUR_DOMAIN with your deployment URL

# 1. Health check
curl https://YOUR_DOMAIN/health

# 2. Database test  
curl https://YOUR_DOMAIN/db-test

# 3. Create offer
curl -X POST https://YOUR_DOMAIN/offers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Offer","value_props":["Great value"],"ideal_use_cases":["Testing"]}'

# 4. Test upload (if you have sample CSV)
curl -X POST https://YOUR_DOMAIN/leads/upload \
  -F "file=@sample_leads.csv"

# 5. Score leads
curl -X POST https://YOUR_DOMAIN/score

# 6. Get results
curl https://YOUR_DOMAIN/results
```

### 🚨 Common Issues & Fixes

**Issue: "Cannot connect to database"**
```bash
# Check DATABASE_URL format
postgres://username:password@host:port/database
```

**Issue: "AI scoring fails"**
```bash
# Verify GEMINI_API_KEY is set correctly
# Check Gemini API quota at https://makersuite.google.com
```

**Issue: "File upload fails"** 
```bash
# Ensure upload directory exists
mkdir -p uploads
```

**Issue: "Port already in use"**
```bash
# Use environment PORT variable
const PORT = process.env.PORT || 5000;
```

## 📱 Mobile-Friendly Testing

Create a simple test page to demo your API:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Lead Scoring API Demo</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        button { padding: 10px 20px; background: #007cba; color: white; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🎯 Lead Scoring API</h1>
    <p>API Base URL: <strong id="baseUrl">https://your-app.railway.app</strong></p>
    
    <div class="endpoint">
        <h3>Health Check</h3>
        <button onclick="testEndpoint('/health')">Test Health</button>
        <pre id="health-result"></pre>
    </div>
    
    <div class="endpoint">
        <h3>Database Test</h3>
        <button onclick="testEndpoint('/db-test')">Test Database</button>
        <pre id="db-test-result"></pre>
    </div>
    
    <script>
        const baseUrl = document.getElementById('baseUrl').textContent;
        
        async function testEndpoint(endpoint) {
            try {
                const response = await fetch(baseUrl + endpoint);
                const data = await response.json();
                document.getElementById(endpoint.slice(1) + '-result').textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById(endpoint.slice(1) + '-result').textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>
```

## 🎯 Performance Optimization

### Production Optimizations
```javascript
// Add to server.js for production
if (process.env.NODE_ENV === 'production') {
    app.use(compression()); // Enable gzip compression
    app.use(helmet());      // Security headers
    app.use(morgan('combined')); // Detailed logging
}
```

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_leads_final_score ON leads(final_score DESC);
CREATE INDEX idx_leads_intent ON leads(intent);
CREATE INDEX idx_offers_created_at ON offers(created_at DESC);
```

## 📊 Monitoring

### Simple Health Monitoring
```javascript
// Add to server.js
app.get('/health-detailed', async (req, res) => {
    try {
        const dbTest = await pool.query('SELECT NOW()');
        const leadCount = await pool.query('SELECT COUNT(*) FROM leads');
        const offerCount = await pool.query('SELECT COUNT(*) FROM offers');
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            leads: leadCount.rows[0].count,
            offers: offerCount.rows[0].count,
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});
```

## 🔐 Security Best Practices

### Environment Variables Security
```bash
# Never commit .env files
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### API Security
```javascript
// Add rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/score', limiter); // Apply to scoring endpoint
```

## 🎉 You're Live!

Your Lead Scoring Backend is now deployed and ready to impress! 

### 📝 For Your Assignment Submission:
1. **Include your live URL** in the README
2. **Test all endpoints** work correctly
3. **Document any customizations** you made
4. **Share the repository** with proper commit history

### 🚀 Next Steps:
- **Custom domain**: Add your own domain name
- **SSL certificate**: Ensure HTTPS (most platforms include this)
- **Monitoring**: Set up uptime monitoring
- **Analytics**: Track API usage patterns

**Congratulations! You have a production-ready AI-powered backend! 🎊**