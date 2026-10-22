# GitHub repository settings

Chosen 2026-10-21. Apply once the repository is on GitHub.

**Description** (85 characters)

> Keep your PixelLab art packed in one place. Browse, search, play and organize images.

The unofficial status is not in the description; the README disclaimer carries it.

**Topics** (20, GitHub's maximum)

`pixellab` `pixel-art` `ai-art` `generative-ai` `gallery` `asset-browser` `game-assets` `sprites` `sprite-animation` `tileset` `gamedev` `indiedev` `2d` `svelte` `typescript` `vite` `client-side` `privacy-first` `indexeddb` `web-app`

No `pwa`: an installable PWA is a non-goal ([product brief](design/01-product-brief.md) §5).

**Apply and verify**

```bash
gh repo edit <owner>/<repo> --description "Keep your PixelLab art packed in one place. Browse, search, play and organize images." --homepage "https://<owner>.github.io/<repo>/" --add-topic pixellab,pixel-art,ai-art,generative-ai,gallery,asset-browser,game-assets,sprites,sprite-animation,tileset,gamedev,indiedev,2d,svelte,typescript,vite,client-side,privacy-first,indexeddb,web-app
gh repo view <owner>/<repo> --json description,homepageUrl,repositoryTopics
```

Then add the live-app link under the README tagline.
