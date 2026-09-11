# Event Horizon 404

A single-page web-art 404: a deep starfield, a black hole with an accretion-disk glow, and the letter **w** spiraling toward the event horizon.

Vanilla HTML, CSS, and canvas — built with Vite, no runtime framework. The production build is a static folder you can drop on Cloudflare Pages (or any static host).

## Local preview

```bash
npm install
npm run dev
```

Then open the URL Vite prints (this project binds to port `4721`).

```bash
npm run build
npm run preview
```

`build` writes `dist/` and copies `index.html` to `dist/404.html` so unknown paths can show the same piece.

## Deploy on Cloudflare Pages

1. Push this repository to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repo. Use:
   - **Framework preset:** None / Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `22` (or add an environment variable `NODE_VERSION=22`)
4. After the first deploy, **Custom domains** → add your domain and follow the DNS prompts Cloudflare shows (CNAME or the nameservers it recommends).

Root `/` is the art page. Missing routes serve `404.html` (same scene) so the piece works as both a homepage and a 404.

## Motion

The scene respects `prefers-reduced-motion`: the composition still renders, but orbits, twinkles, and infall freeze. Pointer parallax is disabled in that mode.

## Fonts

[Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) and [Outfit](https://fonts.google.com/specimen/Outfit) are self-hosted under the SIL Open Font License.
