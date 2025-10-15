# Quick Setup Guide

## 🚀 First Time Setup (New PC)

### Prerequisites
Before running the setup, make sure you have installed:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** (v14 or higher)
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

3. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

### Automated Setup

1. **Clone the repository:**
   ```powershell
   git clone https://github.com/apps-eduard/pacifica-loan-management.git
   cd pacifica-loan-management
   ```

2. **Run the setup script:**
   ```powershell
   .\setup.ps1
   ```

3. **Follow the prompts:**
   - Enter PostgreSQL credentials
   - Choose database name (default: `pacifica_loans`)
   - Wait for dependencies to install
   - Database tables will be created automatically

### What the Setup Script Does

✅ Checks if all prerequisites are installed  
✅ Installs global dependencies (Ionic CLI, Angular CLI)  
✅ Prompts for database credentials  
✅ Creates PostgreSQL database  
✅ Generates secure JWT secrets  
✅ Creates backend `.env` file  
✅ Installs backend dependencies  
✅ Builds backend TypeScript  
✅ Runs database migrations (creates tables + seed data)  
✅ Installs web app dependencies  
✅ Installs customer app dependencies  
✅ Installs collector app dependencies  

### Default Test Users

After setup, you can login with these accounts:

**Super Admin:**
- Email: `admin@pacifica.ph`
- Password: `Admin@123`

**Branch Manager:**
- Email: `manager@pacifica.ph`
- Password: `Manager@123`

**Loan Officer:**
- Email: `officer@pacifica.ph`
- Password: `Officer@123`

---

## 🏃 Running the Applications

### Option 1: Start All Services at Once

```powershell
.\start-all.ps1
```

This will open 4 terminal windows:
- Backend API (http://localhost:3000)
- Web Admin (http://localhost:4200)
- Customer App (http://localhost:8100)
- Collector App (http://localhost:8101)

### Option 2: Start Services Individually

**Backend API:**
```powershell
cd backend
npm run dev
```

**Web Admin App:**
```powershell
cd web
ng serve
```

**Customer Mobile App:**
```powershell
cd customer-app
ionic serve
```

**Collector Mobile App:**
```powershell
cd collector-app
ionic serve --port=8101
```

---

## 🔧 Manual Setup (Advanced)

If you prefer manual setup or encounter issues:

### 1. Install Global Dependencies
```powershell
npm install -g @ionic/cli @angular/cli
```

### 2. Create Database
```sql
CREATE DATABASE pacifica_loans;
```

### 3. Configure Backend
Create `backend/.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/pacifica_loans
DB_SSL=false
LOG_LEVEL=debug

JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-chars
JWT_REFRESH_EXPIRES_IN=7d
```

### 4. Install Dependencies
```powershell
# Backend
cd backend
npm install
npm run build
npm run migrate:up

# Web App
cd ../web
npm install

# Customer App
cd ../customer-app
npm install

# Collector App
cd ../collector-app
npm install
```

---

## 🐛 Troubleshooting

### "psql: command not found"
- PostgreSQL is not in your PATH
- Add PostgreSQL bin directory to PATH: `C:\Program Files\PostgreSQL\16\bin`

### "npm: command not found"
- Node.js is not installed or not in PATH
- Reinstall Node.js from https://nodejs.org/

### "Database connection failed"
- Check if PostgreSQL service is running
- Verify credentials are correct
- Check firewall settings

### "Port already in use"
- Another service is using the port
- Stop the conflicting service or change port in config

### Migration errors
- Ensure database exists and is empty
- Check database permissions
- Run: `npm run migrate:down` then `npm run migrate:up`

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **API Documentation**: See `backend/README.md`
- **Git Guide**: See `GIT-SETUP.md`
- **GitHub Upload**: See `GITHUB-UPLOAD-GUIDE.md`

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages carefully
3. Ensure all prerequisites are installed
4. Contact: support@pacifica.ph

---

**Setup Time:** Approximately 10-15 minutes  
**Internet Connection:** Required for downloading dependencies  
**Disk Space:** ~500MB for all node_modules
