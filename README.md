# ThreadMind 🧵

> AI-powered outfit matcher for Indian fashion. Upload any garment, get curated matching suggestions, shop instantly on Amazon, Flipkart & Myntra.

---

## ✨ Features

- 📷 Upload any garment photo — AI reads color, pattern & style
- 🎨 Skin tone selector for personalised color recommendations
- 🛍️ Direct search links to Amazon India, Flipkart & Myntra
- 📍 Pincode-aware links for delivery filtering
- 💸 Budget, fabric, sleeve & occasion filters
- 🔒 API key stored only in your browser — no server, no tracking

---

## 🚀 Deploy to GitHub Pages (Step by Step)

### Prerequisites
- Node.js installed ✅ (you have this)
- A GitHub account → https://github.com

---

### Step 1 — Install Git

Download and install Git from https://git-scm.com/download/win (Windows) or run:
```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt install git
```

Verify: `git --version`

---

### Step 2 — Create a GitHub repository

1. Go to https://github.com/new
2. Repository name: `threadmind`
3. Set to **Public**
4. Do NOT initialise with README
5. Click **Create repository**

---

### Step 3 — Push the project

Open your terminal in the `threadmind` folder and run:

```bash
git init
git add .
git commit -m "Initial commit — ThreadMind"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/threadmind.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

### Step 4 — Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **Deploy from a branch**
4. Branch: `main` · Folder: `/ (root)`
5. Click **Save**

GitHub will give you a URL like:
```
https://YOUR_USERNAME.github.io/threadmind
```

It takes 1–3 minutes to go live. 🎉

---

## 🔑 Getting your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-`)
5. Paste it into ThreadMind when you use the app

Your key is **never sent to any server** — it goes directly from your browser to Anthropic's API.

---

## 📁 Project Structure

```
threadmind/
├── index.html          ← Main app page
├── assets/
│   ├── css/
│   │   └── style.css   ← All styles
│   └── js/
│       └── app.js      ← All logic
└── README.md
```

---

## 🛠️ Local Development

No build tools needed. Just open `index.html` in your browser, or run a local server:

```bash
# Using Node.js (npx)
npx serve .

# Or Python
python3 -m http.server 8080
```

Then open http://localhost:8080

---

## 🤝 Contributing / Extending

Want to add features? Some ideas:
- Saved looks / outfit history (localStorage)
- Share outfit as image
- More platforms (Ajio, Nykaa Fashion)
- Multi-garment upload (full outfit builder)

---

Built with Claude AI · Anthropic
