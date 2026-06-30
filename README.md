# JewelStore — Professional Jewelry Management System

Works **online and offline**. Runs as a **Windows desktop app** or in a browser.  
All data stored **locally on your computer** — no cloud, no internet required.

---

## ▶ Option 1: Build a Windows .exe Installer (Recommended)

> Creates a proper Windows installer you can share with anyone.

**Prerequisites:** Install [Node.js LTS](https://nodejs.org) (one-time setup)

```
Double-click:  BUILD-INSTALLER.bat
```

**Step 2:** A terminal window opens and runs automatically. You will see text scrolling — this is normal. It works through 6 stages:
1. **Installing backend packages** ← downloads ~200 packages from the internet. This step can take 3–8 minutes on its own depending on your internet speed. The cursor may appear frozen for stretches — it is still working. If it has been more than 15 minutes without any new text appearing, see the fix below.
2. Generating database client
3. Compiling backend code
4. Installing frontend packages
5. Building frontend (React)
6. Packaging the Windows installer

**This takes 5–15 minutes on the first run** because it downloads packages from the internet. Your computer is not frozen — just wait and do not close the window. Subsequent builds are much faster.

> ⚠️ **Stuck on step 1 for more than 15 minutes?** Close the window, then open a new Command Prompt and run these two commands one at a time:
> ```
> npm config set registry https://registry.npmjs.org/
> npm cache clean --force
> ```
> Then double-click `BUILD-INSTALLER.bat` again.

**Step 3:** After 3–5 minutes the terminal prints "BUILD COMPLETE!" and a `dist-installer/` folder opens automatically in File Explorer.

**Step 4:** Inside that folder, double-click `JewelStore Setup 1.0.0.exe` to install the app on your computer.

**Step 5:** Follow the installer (click Next → choose folder → Install → Finish). JewelStore launches automatically when done.

You can also share `JewelStore Setup 1.0.0.exe` with anyone — they just double-click it to install on their own PC.

**After installing:**
- JewelStore appears in your Start Menu and as a Desktop shortcut
- Double-click to launch — no browser, no terminal needed
- App runs in its own window with a system tray icon
- Data is stored in `C:\Users\YourName\AppData\Roaming\JewelStore\`

---

## ▶ Option 2: Run in Browser (Development / Quick Start)

> Runs in your browser. Good for testing or if you prefer the web version.

**Prerequisites:** Install [Node.js LTS](https://nodejs.org) (one-time setup)

```
Double-click:  START-DEV.bat
```

- First run: automatically installs everything and seeds demo data (~3 min)
- Every run after: starts in under 10 seconds
- Opens at `http://localhost:5173` in your browser
- Works offline after first load (PWA — installable from browser)

---

## ▶ Option 3: Launch as Desktop App (without building installer)

> Faster than Option 1 for testing Electron.

```
Double-click:  START-ELECTRON.bat
```

---

## Login Credentials (Demo)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@jewelstore.com | Admin@123 |
| **Manager** | manager@jewelstore.com | Manager@123 |
| **Sales Staff** | staff@jewelstore.com | Staff@123 |

---

## Key Features

- **Dashboard** — KPI cards, sales trend chart, low stock alerts, recent transactions
- **Inventory** — Add/edit/delete jewelry items with metal type, purity, weight, pricing, images
- **Customers** — Full CRM with purchase history, balance tracking, birthdays/anniversaries
- **Sales / Invoicing** — Create invoices with GST, discounts, multiple payment methods
- **Customer Balance** — Track partial payments, outstanding dues, payment history
- **Suppliers & Purchases** — Stock management from supplier to shelf
- **Reports** — Sales, inventory, profit, outstanding balances — exportable to Excel/PDF
- **Dark Mode** — Toggle from the top-right header
- **Offline** — Works without internet; data syncs when connection returns

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 29 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | **SQLite** (embedded, no server needed) |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| Offline | PWA Service Worker |
| Installer | electron-builder (NSIS for Windows) |

---

## Data & Backup

Your data is stored at:
```
C:\Users\[YourName]\AppData\Roaming\JewelStore\jewelry_store.db
```

To **backup**: copy `jewelry_store.db` somewhere safe.  
To **restore**: replace the file and restart JewelStore.  
To **view data folder**: right-click the tray icon → "Open Data Folder".

---

## Project Structure

```
jewelry-store/
├── BUILD-INSTALLER.bat   ← Build .exe installer (double-click)
├── START-DEV.bat         ← Run in browser (double-click)
├── START-ELECTRON.bat    ← Run as desktop app (double-click)
│
├── electron/
│   ├── main.js           ← Desktop app entry point
│   ├── preload.js        ← Electron security bridge
│   └── package.json      ← electron-builder config
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma ← SQLite database models
│   │   └── seed.ts       ← Demo data
│   └── src/
│       ├── app.ts        ← Express server
│       ├── controllers/  ← Auth, Inventory, Customers, Sales
│       ├── routes/       ← All API endpoints
│       └── middleware/   ← Auth, RBAC, error handling
│
└── frontend/
    ├── public/
    │   ├── manifest.json ← PWA manifest
    │   └── sw.js         ← Service worker (offline)
    └── src/
        ├── pages/        ← Dashboard, Inventory, Customers, Sales, Reports
        ├── components/   ← Sidebar, Header, OfflineBanner
        ├── store/        ← Zustand auth store
        └── lib/          ← API client, utilities
```

---

## Security

- JWT tokens (15 min access, 7 day refresh)
- Bcrypt passwords (12 rounds)
- Role-based access: Admin > Manager > Sales Staff
- All data stays on your machine — nothing sent to any cloud by default
- Machine-specific JWT secret (auto-generated, no manual config needed)
