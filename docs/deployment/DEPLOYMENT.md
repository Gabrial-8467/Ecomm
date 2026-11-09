# Deployment & Operations Guide (Non-Docker Production Setup)
## Single-Owner Retail Platform for Node.js & PostgreSQL

This deployment runbook adheres strictly to normal Linux / Cloud VM environments without Docker, Docker Compose, pnpm, or Yarn.

---

### 1. Server Architecture & Port Allocation

- **Node.js Express Backend**: Port `5000` (Managed via PM2 process manager)
- **Customer Storefront**: Built as static SPA assets (`dist/`), served via Nginx on Port `80/443` (e.g. `https://apexretailers.in`)
- **Admin Command Center**: Built as static SPA assets (`dist/`), served via Nginx on Port `80/443` with IP/VPN restriction or custom subdomain (e.g. `https://admin.apexretailers.in`)
- **Database**: Managed PostgreSQL on Port `5432`

---

### 2. Bare-Metal / Ubuntu Linux Setup

#### Step 1: Install Node.js (v20+ LTS) and NPM
```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 2: Install and Configure PostgreSQL
```bash
sudo apt-get install -y postgresql postgresql-contrib

# Create database and application user
sudo -u postgres psql -c "CREATE USER apex_user WITH PASSWORD 'SecurePasswordHere';"
sudo -u postgres psql -c "CREATE DATABASE retail_db OWNER apex_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE retail_db TO apex_user;"
```

#### Step 3: Install PM2 Global Process Manager
```bash
sudo npm install -g pm2
```

---

### 3. Application Build & Run Workflow

```bash
# Clone the repository
git clone <repo_url> /var/www/retail-platform
cd /var/www/retail-platform

# Install dependencies across all applications using npm
npm install

# Configure production environment variables
cp .env.example .env
nano .env # Configure production DB, Razorpay, Cloudinary credentials

# Run database migrations and generate Prisma client
npm run prisma:generate
npm run prisma:migrate

# Build all applications
npm run build
```

---

### 4. Running Backend with PM2

Create `ecosystem.config.js` in the root:
```javascript
module.exports = {
  apps: [
    {
      name: 'retail-backend',
      cwd: './backend',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
```

Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### 5. Nginx Reverse Proxy & Static Asset Hosting

Sample Nginx configuration `/etc/nginx/sites-available/retail`:

```nginx
# Customer Storefront
server {
    listen 80;
    server_name apexretailers.in www.apexretailers.in;

    root /var/www/retail-platform/storefront/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Command Center
server {
    listen 80;
    server_name admin.apexretailers.in;

    root /var/www/retail-platform/admin-dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable SSL via Certbot:
```bash
sudo certbot --nginx -d apexretailers.in -d www.apexretailers.in -d admin.apexretailers.in
```
