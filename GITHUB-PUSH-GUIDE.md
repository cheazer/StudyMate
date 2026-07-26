# 🚀 Push StudyMate Frontend to GitHub

## Prerequisites

Before you start, make sure you have:
- ✅ Git installed on your machine
- ✅ A GitHub repository created for StudyMate
- ✅ Git credentials configured

---

## Step-by-Step Guide

### **Step 1: Navigate to Your Project**
```bash
cd "c:\Users\New User\OneDrive\Desktop\StudyMate"
```

### **Step 2: Initialize Git (if not already done)**
```bash
git init
```

**Check if git is already initialized:**
```bash
git status
```

If you see branch info (like `On branch main`), it's already initialized. ✅

---

### **Step 3: Configure Git (First Time Only)**
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

For global config (applies to all repos):
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

### **Step 4: Check What Files Will Be Added**
```bash
git status
```

You'll see files in red (untracked). This is normal.

---

### **Step 5: Add All Files to Staging**
```bash
git add .
```

**Check what's staged:**
```bash
git status
```

Files should now be green (staged for commit).

---

### **Step 6: Create Your First Commit**
```bash
git commit -m "Initial commit: Google Classroom-inspired UI redesign + Gemma backend integration"
```

**Or use a more detailed message:**
```bash
git commit -m "feat: Complete frontend redesign with Gemma AI backend

- Redesigned dashboard with Google Classroom-style layout
- Colorful course cards with progress tracking
- Sticky top navigation replacing bottom nav
- Added courses page with 6 sample courses
- Integrated Gemma AI for roadmap generation
- Integrated Gemma AI for study pack generation
- Added difficulty adjustment logic
- Full Supabase integration for data persistence"
```

---

### **Step 7: Add Remote GitHub Repository**

**Option A: SSH (Recommended if SSH key is set up)**
```bash
git remote add origin git@github.com:YOUR_USERNAME/studymate.git
```

**Option B: HTTPS**
```bash
git remote add origin https://github.com/YOUR_USERNAME/studymate.git
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**Verify the remote was added:**
```bash
git remote -v
```

---

### **Step 8: Push to GitHub**

**First time push (create branch on remote):**
```bash
git branch -M main
git push -u origin main
```

**Or shorter version:**
```bash
git push -u origin main
```

The `-u` flag sets the upstream branch so future `git push` commands work automatically.

---

### **Step 9: Verify on GitHub**

1. Go to https://github.com/YOUR_USERNAME/studymate
2. You should see all your files there! 🎉
3. Check the commits tab to see your commit history

---

## ✅ Complete Command Sequence (Copy & Paste)

```bash
# Navigate to project
cd "c:\Users\New User\OneDrive\Desktop\StudyMate"

# Initialize git (skip if already done)
git init

# Configure git (first time only)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Stage all files
git add .

# Commit
git commit -m "Initial commit: Google Classroom UI + Gemma backend"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/studymate.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace:
- `"Your Name"` with your actual name
- `"your.email@example.com"` with your GitHub email
- `YOUR_USERNAME` with your GitHub username

---

## 🔑 Getting GitHub Personal Access Token (if needed)

If you get authentication errors on HTTPS:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Copy the token
5. When git asks for password, paste the token instead

---

## 📝 .gitignore Check

Your project already has `.gitignore` configured to exclude:
- `node_modules/`
- `.env.local` (secrets are protected!)
- `.next/`

So your API keys won't be uploaded. ✅

---

## 🔄 Future Commits

After the first push, you can use simpler commands:

```bash
# Stage changes
git add .

# Commit
git commit -m "Your commit message"

# Push
git push
```

Or combine into one:
```bash
git add . && git commit -m "Your message" && git push
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `fatal: not a git repository` | Run `git init` first |
| `error: remote origin already exists` | Run `git remote rm origin` then add new remote |
| `Authentication failed` | Use GitHub personal access token instead of password |
| `fatal: bad config value` | Check git config: `git config --list` |
| `nothing to commit, working tree clean` | Make changes to files first, then `git add .` |

---

## ✨ Success Indicators

After pushing:
- ✅ No errors in terminal
- ✅ "main" branch created
- ✅ All files visible on GitHub
- ✅ Commit message appears in GitHub history

**You're done! Your frontend is now on GitHub!** 🚀
