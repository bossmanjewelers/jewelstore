# How to Put JewelStore Online (Free)

Follow these steps exactly. Takes about **15 minutes** total.  
You will get a link like **`https://jewelstore-production.up.railway.app`** that works from any browser, anywhere.

---

## What You Need
- A free **GitHub** account → https://github.com
- A free **Railway** account → https://railway.app
- The JewelStore folder on your computer (you already have this)

---

## PART 1 — Upload Your Code to GitHub (8 minutes)

### Step 1 — Install GitHub Desktop
1. Go to https://desktop.github.com
2. Click **Download for Windows**
3. Install it (click through the installer)
4. Open GitHub Desktop and sign in with your GitHub account

### Step 2 — Create a new repository
1. In GitHub Desktop, click **File → New Repository**
2. Fill in:
   - **Name:** `jewelstore`
   - **Local Path:** Click "Choose…" and select your `jewelry-store` folder
3. Click **Create Repository**

### Step 3 — Publish to GitHub
1. Click the blue **"Publish repository"** button at the top
2. Untick **"Keep this code private"** (leave it public, Railway needs to see it)
3. Click **Publish Repository**

✅ Your code is now on GitHub at `https://github.com/YOUR-USERNAME/jewelstore`

---

## PART 2 — Deploy on Railway (7 minutes)

### Step 4 — Create Railway account
1. Go to https://railway.app
2. Click **Login** → **Login with GitHub**
3. Authorize Railway to access your GitHub

### Step 5 — Create a new project
1. Click **New Project**
2. Click **Deploy from GitHub repo**
3. Click **Configure GitHub App** if asked, then select your `jewelstore` repo
4. Click **Deploy Now**

Railway will start building. Wait about 2 minutes.

### Step 6 — Add a free database
1. Inside your Railway project, click **+ New** (top right)
2. Click **Database** → **Add PostgreSQL**
3. Railway creates a free PostgreSQL database and connects it automatically

### Step 7 — Set your secret keys
1. Click on your **jewelstore** service (not the database)
2. Go to the **Variables** tab
3. Click **+ New Variable** and add these two:

| Variable Name | Value |
|--------------|-------|
| `JWT_SECRET` | type any long random text, e.g. `MyJewelStore2024SecretKey!@#$%` |
| `JWT_REFRESH_SECRET` | type different long random text, e.g. `MyJewelStoreRefresh2024!@#$%` |

4. Click **Deploy** (or it redeploys automatically)

### Step 8 — Seed demo data (first time only)
1. In Railway, click your **jewelstore** service
2. Go to the **Settings** tab → scroll to **Deploy** section
3. Temporarily change the **Start Command** to:
   ```
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma && npm run db:seed --prefix backend && npm start
   ```
4. Click **Deploy** — wait for it to finish (watch the logs)
5. After it finishes successfully, **change the Start Command back** to what's in `railway.json` (remove the seed part):
   ```
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma && npm start
   ```

### Step 9 — Get your live URL
1. Click on your **jewelstore** service
2. Go to **Settings** tab → **Domains**
3. Click **Generate Domain**
4. Copy your URL — looks like `jewelstore-production.up.railway.app`

🎉 **Open that URL in any browser — your app is live!**

---

## Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jewelstore.com | Admin@123 |
| Manager | manager@jewelstore.com | Manager@123 |
| Staff | staff@jewelstore.com | Staff@123 |

---

## Share With Your Team

Send the URL to anyone — they open it in a browser and log in.  
Works on **phone**, **tablet**, **PC** — no installation needed.

---

## Update Your App Later

Whenever you want to update the app:
1. Make changes to your files
2. In GitHub Desktop: write a message in the box (e.g. "updated inventory page") → click **Commit** → click **Push origin**
3. Railway automatically redeploys within 2 minutes

---

## Free Plan Limits (Railway)

- ✅ 500 hours/month (enough for 24/7 use)
- ✅ 1 GB PostgreSQL database
- ✅ Automatic SSL (https://)
- ✅ Custom domain support
- ❌ Sleeps after 30 days of inactivity (upgrade for $5/month to keep always-on)

---

## Troubleshooting

**App shows error after deploy:**  
→ Click your service in Railway → **Logs** tab → read the red error message and share it here.

**Can't see your repo in Railway:**  
→ In Railway, go to **Account Settings → GitHub** → click **Configure** → make sure `jewelstore` repo is checked.

**Forgot your URL:**  
→ Go to railway.app → open your project → Settings → Domains.
