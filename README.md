# Waverity redesign preview

The static site in [`docs/`](docs/) is a copy of [`waverity-redesign/dist/`](waverity-redesign/dist/) prepared for GitHub Pages. The redesign folder has its own local Git history; `docs/` is the publishable copy in this repository.

## Preview locally

From the repository root:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory docs
```

Open <http://127.0.0.1:4173/>. The site needs no build step.

## Publish on GitHub Pages

1. In this repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**.
2. Push `docs/` and `.github/workflows/pages.yml` to `main`, or run **Publish Waverity redesign** from the Actions tab after the first push.
3. Check the deployment at <https://ruslanwv.github.io/wv_webpage/>. GitHub may take a few minutes to make the site available.

The workflow uploads only `docs/`, so local review files and the nested repository metadata are excluded. All local CSS, JavaScript, images, and video use relative paths and work under the `/wv_webpage/` project URL. Links to the current Waverity website remain external.

To publish a later redesign update, copy the changed files from `waverity-redesign/dist/` into `docs/`, review the diff, then push to `main`.
