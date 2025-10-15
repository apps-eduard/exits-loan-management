# Git Setup and GitHub Upload Guide

## 📋 Pre-Upload Checklist

Before uploading to GitHub, ensure:

### 1. ✅ Git Repository Initialization

```bash
# Navigate to project root
cd "X:\Loan Management System"

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Pacifica Loan Management System"
```

### 2. ✅ Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click "New Repository"
3. Name: `pacifica-loan-management`
4. Description: "Comprehensive loan management system with Angular, Ionic, Node.js, and PostgreSQL"
5. **Choose Public or Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create Repository"

### 3. ✅ Connect and Push

```bash
# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/pacifica-loan-management.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🔐 Important Notes About .env File

### ⚠️ Security Notice

**The `.env` file IS included in this repository!**

This means sensitive data like:
- Database credentials
- JWT secrets
- API keys

Will be visible to anyone who has access to the repository.

### 🛡️ Security Recommendations

#### Option 1: Keep .env but use placeholders (Recommended for Public Repos)

Update `.env` to use placeholder values:

```bash
# In backend/.env
DATABASE_URL=postgres://username:password@localhost:5432/pacifica
JWT_SECRET=CHANGE_THIS_TO_YOUR_SECRET_MINIMUM_32_CHARACTERS
JWT_REFRESH_SECRET=CHANGE_THIS_TO_YOUR_REFRESH_SECRET_MIN_32_CHARS
```

Then document in README that users should:
1. Copy `.env.example` to `.env`
2. Update with their actual credentials

#### Option 2: Keep Real Credentials (Only for Private Repos)

If repository is **private** and only trusted team members have access:
- ✅ Keep real credentials in `.env`
- ✅ Ensure repository is set to Private on GitHub
- ✅ Only invite trusted collaborators

#### Option 3: Remove .env and use .env.example only

```bash
# Add .env to .gitignore
echo "backend/.env" >> .gitignore

# Keep only .env.example in repository
git rm --cached backend/.env
git add backend/.env.example
git commit -m "Remove .env from tracking, keep .env.example"
```

Then each developer creates their own `.env` from `.env.example`.

## 📝 Current Configuration

### What's Tracked (Included in Git)

✅ Source code (TypeScript, HTML, SCSS)
✅ Configuration files (package.json, tsconfig.json, etc.)
✅ README.md and documentation
✅ **.env file** (⚠️ Contains sensitive data)
✅ .env.example (Template)

### What's Ignored (NOT in Git)

❌ node_modules/
❌ dist/
❌ build/
❌ .angular/
❌ Coverage reports
❌ Log files
❌ IDE settings (except .vscode extensions)

## 🚀 Quick Upload Commands

```bash
# 1. Navigate to project
cd "X:\Loan Management System"

# 2. Check git status
git status

# 3. Stage all files
git add .

# 4. Commit
git commit -m "Initial commit: Complete loan management system"

# 5. Add remote (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/pacifica-loan-management.git

# 6. Push to GitHub
git push -u origin main
```

## 🔄 Future Updates

After initial push, use:

```bash
# Check status
git status

# Stage changes
git add .

# Commit with message
git commit -m "Your commit message here"

# Push to GitHub
git push
```

## 👥 Team Collaboration

### Cloning the Repository

Team members can clone:

```bash
git clone https://github.com/YOUR_USERNAME/pacifica-loan-management.git
cd pacifica-loan-management
```

### Setup After Clone

```bash
# Install backend dependencies
cd backend
npm install

# Setup database (update .env with your credentials first)
npm run migrate:up

# Install web app dependencies
cd ../web
npm install

# Install customer app dependencies
cd ../customer-app
npm install

# Install collector app dependencies
cd ../collector-app
npm install
```

## 📞 Questions?

If you need help:
1. Check GitHub documentation: https://docs.github.com
2. Review Git basics: https://git-scm.com/doc
3. Contact team lead for access issues

---

**Ready to push to GitHub! 🚀**
