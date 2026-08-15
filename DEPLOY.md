# Publish Wayline as a public website

Yes. This project builds to a folder of static files (`dist/`). Anyone can open the site in a browser from a public URL. No app install is required.

The recommended free host is **GitHub Pages**. The published data file (`public/data/network.json`) is about **5.6 MB**, which is well under GitHub’s limits (warning at 50 MB, hard stop at 100 MB).

Do **not** upload `intercity_GeoJSON_dataset.geojson`. That source file is about 13.5 million lines and is too large for a normal GitHub repo. The website only needs the smaller `network.json` file.

Your local git repo is on the `main` branch and does **not** have a GitHub remote yet. You still need a GitHub account, a new repository, a first commit, and a push. This folder is inside Box; wait until files finish syncing before you push.

---

## Option A — GitHub Pages (recommended)

### 1. Create a GitHub account

1. Open [https://github.com/signup](https://github.com/signup).
2. Create a free account and verify your email.

### 2. Create an empty GitHub repository

1. After you are signed in, click the **+** in the top right, then **New repository**.
2. Repository name: something like `intercity-route-explorer` (you can choose another name).
3. Visibility: **Public**.
4. Leave **Add a README file** unchecked.
5. Leave **Add .gitignore** and **Choose a license** blank.
6. Click **Create repository**.
7. Leave that page open. GitHub will show commands that include your username and repository name.

### 3. Commit this project and push it

Open a terminal in this `Github_interface` folder (in Cursor: **Terminal → New Terminal**).

Check that Git sees the project:

```bash
git status
```

Stage the website files (the large GeoJSON is ignored on purpose):

```bash
git add package.json package-lock.json index.html vite.config.js DEPLOY.md .gitignore public src scripts .github
git status
```

Confirm `intercity_GeoJSON_dataset.geojson` is **not** listed. Confirm `public/data/network.json` **is** listed.

Create the first commit:

```bash
git commit -m "Publish the intercity route explorer as a static site."
```

Connect your new GitHub repository. Replace `YOUR-USERNAME` and `YOUR-REPO` with the values from the GitHub page:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

GitHub may ask you to sign in. Use the browser sign-in option if it appears.

### 4. Turn on GitHub Pages

1. On GitHub, open your repository.
2. Click **Settings**.
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment → Source**, choose **GitHub Actions**.
5. Click the **Actions** tab.
6. Open the workflow named **Deploy to GitHub Pages**.
7. If it has not started, click **Run workflow**.
8. Wait until the run is green (usually 1–3 minutes).

### 5. Open your public URL

When the workflow finishes, GitHub shows the site address on the **Settings → Pages** screen. It will look like:

`https://YOUR-USERNAME.github.io/YOUR-REPO/`

That is the address you can share. It is created only after you push and enable Pages.

---

## Option B — Netlify drag-and-drop (no GitHub required)

Use this if you only want a link today and do not want to create a GitHub repository yet.

1. In this `web` folder, run:

   ```bash
   npm run build
   ```

2. Wait until it finishes. A `dist` folder will appear.
3. Open [https://app.netlify.com/drop](https://app.netlify.com/drop).
4. Create a free Netlify account if asked.
5. Drag the entire `dist` folder onto the page.
6. Netlify gives you a public URL you can share.

Cloudflare Pages works the same way: create a free account, then upload the `dist` folder.

---

## After you change the site

- Edit the code locally and run `npm run dev` to preview.
- If you use GitHub Pages, commit and `git push`. The site updates after the workflow turns green.
- If you use Netlify drop, run `npm run build` again and drag the new `dist` folder onto Netlify.

---

## What not to upload

| File | Upload? | Why |
| --- | --- | --- |
| `public/data/network.json` | Yes | This is the website data (~5.6 MB). |
| `src/`, `index.html`, `package.json` | Yes | These build the site. |
| `intercity_GeoJSON_dataset.geojson` | No | Too large for GitHub. Keep it on your computer. |
| `node_modules/` | No | Reinstalled automatically. |
| `dist/` | No for GitHub | GitHub Actions builds this. For Netlify drop, upload only this folder. |
