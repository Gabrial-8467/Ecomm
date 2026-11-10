# Production Deployment Guide

Zero-Docker, zero-AWS deployment strategy using standard PaaS providers.

| Application | Recommended Host | Runtime / Framework |
|---|---|---|
| **Storefront** | Vercel / Netlify | Vite SPA (Static HTML/JS/CSS) |
| **Admin Panel** | Vercel / Netlify | Vite SPA (Static HTML/JS/CSS) |
| **Backend API** | Render / Railway | Node.js (Express TypeScript) |
| **PostgreSQL** | Neon / Supabase | Managed Cloud PostgreSQL 14+ |
| **Media Assets** | Cloudinary | Cloud Image CDN & Optimization |

---

## 1. PostgreSQL Database Setup (Neon)
1. Create a project on [Neon.tech](https://neon.tech).
2. Copy the Connection String URI:
   ```
   postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
   ```
3. Set `DATABASE_URL` in your hosting provider's backend environment variables.

---

## 2. Backend API Deployment (Render / Railway)

### Build & Start Commands
- **Root Directory**: `backend`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start`

### Required Environment Variables in Render:
```ini
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
JWT_ACCESS_SECRET=your_super_strong_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_super_strong_refresh_secret_min_32_chars
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
STOREFRONT_URL=https://www.yourfurniturestore.com
ADMIN_URL=https://admin.yourfurniturestore.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STORE_NAME=Grand Living Furniture & Electronics
STORE_PHONE=+919876543210
STORE_EMAIL=support@yourfurniturestore.com
```

---

## 3. Customer Storefront Deployment (Vercel)

### Configuration in Vercel:
- **Root Directory**: `storefront`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables:
```ini
VITE_API_URL=https://api.yourfurniturestore.com/api/v1
VITE_APP_NAME=Grand Living Furniture & Electronics
VITE_APP_URL=https://www.yourfurniturestore.com
```

### SPA Rewrites (`storefront/vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 4. Admin Panel Deployment (Vercel)

### Configuration in Vercel:
- **Root Directory**: `admin`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables:
```ini
VITE_API_URL=https://api.yourfurniturestore.com/api/v1
VITE_APP_NAME=Store Management Dashboard
VITE_APP_URL=https://admin.yourfurniturestore.com
```

### SPA Rewrites (`admin/vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
