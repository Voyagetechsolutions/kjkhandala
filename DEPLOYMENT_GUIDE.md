# 🚀 DEPLOYMENT GUIDE - VOYAGE ONBOARD

## Complete Production Deployment Instructions

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### **1. Environment Setup**
- [ ] PostgreSQL database created
- [ ] DPO payment account configured
- [ ] SMTP email account setup
- [ ] Twilio SMS account setup
- [ ] Domain name registered (optional)
- [ ] SSL certificate obtained

### **2. Code Preparation**
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Build process verified

---

## 🗄️ DATABASE SETUP

### **Step 1: Create PostgreSQL Database**

```bash
# On your server or cloud provider
createdb kjkhandala

# Or using SQL
CREATE DATABASE kjkhandala;
CREATE USER kjkhandala_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kjkhandala TO kjkhandala_user;
```

### **Step 2: Configure Connection**

```env
DATABASE_URL="postgresql://kjkhandala_user:your_secure_password@localhost:5432/kjkhandala"
```

### **Step 3: Run Migrations**

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

## 🔧 BACKEND DEPLOYMENT

### **Option A: Traditional Server (VPS/Dedicated)**

#### **1. Install Dependencies**

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

#### **2. Clone & Setup**

```bash
# Clone repository
git clone https://github.com/Voyagetechsolutions/voyage-onboard-now.git
cd voyage-onboard-now/backend

# Install packages
npm install

# Create .env file
nano .env
```

#### **3. Environment Variables**

```env
# Server
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/kjkhandala

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this

# DPO Payment
DPO_URL=https://secure.3gdirectpay.com
DPO_COMPANY_TOKEN=your_dpo_company_token
DPO_SERVICE_TYPE=3854

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="Voyage Onboard" <noreply@voyage.com>

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+267XXXXXXXX

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

#### **4. Start with PM2**

```bash
# Start application
pm2 start src/server.js --name voyage-backend

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

#### **5. Setup Nginx Reverse Proxy**

```bash
# Install Nginx
sudo apt-get install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/voyage-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/voyage-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### **6. Setup SSL (Let's Encrypt)**

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

### **Option B: Cloud Platform (Heroku/Railway/Render)**

#### **Heroku Deployment:**

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create voyage-onboard-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
heroku config:set DPO_COMPANY_TOKEN=your_token
# ... (set all env vars)

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

---

## 🎨 FRONTEND DEPLOYMENT

### **Option A: Netlify (Recommended)**

#### **1. Build Application**

```bash
cd frontend
npm run build
```

#### **2. Deploy to Netlify**

**Via Netlify CLI:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**Via Netlify Dashboard:**
1. Go to https://app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag & drop the `dist` folder
4. Configure environment variables
5. Set custom domain (optional)

#### **3. Environment Variables**

In Netlify Dashboard → Site settings → Environment variables:
```
VITE_API_URL=https://api.yourdomain.com
```

#### **4. Configure Redirects**

Create `frontend/public/_redirects`:
```
/*    /index.html   200
```

---

### **Option B: Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

---

### **Option C: Traditional Server**

```bash
# Build
cd frontend
npm run build

# Copy to server
scp -r dist/* user@server:/var/www/voyage

# Nginx configuration
sudo nano /etc/nginx/sites-available/voyage-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/voyage;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

---

## 🔐 SECURITY HARDENING

### **1. Firewall Setup**

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### **2. Database Security**

```sql
-- Create read-only user for reports
CREATE USER readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE kjkhandala TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
```

### **3. Rate Limiting (Already Implemented)**

Backend already has rate limiting:
- API: 100 req/15min
- Auth: 5 req/15min
- Payment: 10 req/hour

### **4. HTTPS Only**

```javascript
// In server.js (production only)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 📊 MONITORING & LOGGING

### **1. PM2 Monitoring**

```bash
# View logs
pm2 logs voyage-backend

# Monitor resources
pm2 monit

# Web dashboard
pm2 plus
```

### **2. Database Monitoring**

```bash
# Check connections
SELECT count(*) FROM pg_stat_activity;

# Slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### **3. Error Tracking (Optional)**

Install Sentry:
```bash
npm install @sentry/node
```

```javascript
// In server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

---

## 🧪 POST-DEPLOYMENT TESTING

### **1. Health Checks**

```bash
# Backend health
curl https://api.yourdomain.com/health

# Database connection
curl https://api.yourdomain.com/api/health

# WebSocket
wscat -c wss://api.yourdomain.com
```

### **2. Functional Testing**

- [ ] Login works
- [ ] Booking flow completes
- [ ] Payments process
- [ ] Notifications send
- [ ] Live tracking updates
- [ ] Reports generate
- [ ] Queue processes messages

### **3. Performance Testing**

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://api.yourdomain.com/api/trips

# Or use k6
k6 run load-test.js
```

---

## 🔄 BACKUP STRATEGY

### **1. Database Backups**

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump kjkhandala > /backups/db_$DATE.sql
gzip /backups/db_$DATE.sql

# Keep only last 7 days
find /backups -name "db_*.sql.gz" -mtime +7 -delete
```

```bash
# Add to crontab
crontab -e
0 2 * * * /path/to/backup-script.sh
```

### **2. Code Backups**

```bash
# Git push to remote
git push origin main

# Or create archive
tar -czf voyage-backup-$(date +%Y%m%d).tar.gz /path/to/voyage-onboard-now
```

---

## 🚨 TROUBLESHOOTING

### **Backend Issues:**

**Server won't start:**
```bash
# Check logs
pm2 logs voyage-backend

# Check port
sudo netstat -tulpn | grep 3001

# Restart
pm2 restart voyage-backend
```

**Database connection fails:**
```bash
# Test connection
psql -U kjkhandala_user -d kjkhandala -h localhost

# Check DATABASE_URL
echo $DATABASE_URL
```

### **Frontend Issues:**

**Build fails:**
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

**API calls fail:**
```bash
# Check CORS
# Verify VITE_API_URL
# Check browser console
```

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- Database: DBA team
- Server: DevOps team
- Application: Development team

**Service Providers:**
- DPO Support: support@dpo.com
- Twilio Support: support@twilio.com
- Hosting: Your provider support

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Database created & migrated
- [ ] Backend deployed & running
- [ ] Frontend deployed & accessible
- [ ] SSL certificates installed
- [ ] Environment variables set
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Health checks passing
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team trained
- [ ] Support contacts documented

---

**Deployment Status:** ✅ READY FOR PRODUCTION

**Last Updated:** 2025-01-07
**Version:** 1.0.0
