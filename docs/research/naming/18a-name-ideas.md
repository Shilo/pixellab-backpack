# Name ideas: unofficial PixelLab companion gallery

Temporary research notes (git-ignored). This is not legal advice. Confirm any use of the PixelLab name with PixelLab before you launch.

## Findings

### How gallery and organizer apps get their names

- **Built-in apps use plain nouns.** Examples: Photos, Google Photos, Gallery, Files, Samsung Gallery. A plain noun after a brand name ("PixelLab Gallery", "PixelLab Library", "PixelLab Assets") reads as a page the company built. That's why the owner was right to reject "PixelLab Gallery".
- **Third-party galleries use an evocative word or a descriptor.**
  - Evocative words: Darkroom, Lightroom, Eagle, Pixave, Slidebox, Aves, Memories, Immich.
  - Descriptors that signal "not the stock app": Simple Gallery, Fossify Gallery, Gallery Vault.
  - The pattern: one picture-word that names the place where your stuff lives.
- **Games name the asset store after the place items live.** Examples: Backpack (Team Fortress 2), Inventory, Vault (Destiny), Chest, Satchel, Armory, Codex, Bestiary, Atlas.
  - Players already treat these words as "my stuff, all in one place".
  - Fan tools reuse them: backpack.tf, an unofficial Team Fortress 2 inventory site, and Destiny Item Manager (DIM).
- **Unofficial companions put a distinctive name first and the brand second.**
  - Reddit clients: "Apollo for Reddit", "Relay for reddit", "Sync for Reddit", "rif is fun for Reddit".
  - Reddit Is Fun and Reddit News were renamed to the "X for Reddit" form after trademark-licensing changes ([Android Police](https://www.androidpolice.com/2020/01/07/reddit-is-fun-now-called-rif-is-fun-for-reddit-due-to-licensing-issues/), [9to5Google](https://9to5google.com/2020/01/08/reddit-is-fun/)).
  - Twitter clients (Tweetbot, Twitterrific) used a pun and no brand at all. Twitter still pushed back on "Tweet" in app names ([TechCrunch](https://techcrunch.com/2009/07/01/twitter-grows-uncomfortable-with-the-use-of-the-word-tweet-in-applications)).
  - Pokémon tools usually drop the brand entirely: Poke Genie, Calcy IV.
  - Brand-first exceptions do exist. Destiny Item Manager states clearly that it is not affiliated with Bungie and uses the Bungie API ([DIM on GitHub](https://github.com/DestinyItemManager/DIM), [Kotaku](https://kotaku.com/one-of-destiny-s-most-useful-tools-wasn-t-made-by-bungi-1709392327)).

### What signals "official" and what signals "unofficial companion"

| Reads as official | Reads as unofficial companion |
|---|---|
| Brand + plain function noun: Gallery, Library, Archive, Explorer, Viewer, Manager, Navigator | Distinctive name + "for Brand" (Apollo for Reddit) |
| Brand + "Pocket", "Mobile", "Go", "Pro", "Studio" (these sound like editions) | Brand + a whimsical object noun that is clearly a metaphor (Backpack, Trove, Satchel) |
| The brand's logo, colors or icon style | Its own icon and palette, plus "Unofficial" in the subtitle and a "Not affiliated with…" line |

**Specific risk for PixelLab:** PixelLab's own products already follow the "PixelLab + noun" pattern: PixelLab Editor, PixelLab Game Builder, PixelLab Map Workshop, PixelLab MCP server ([pixellab.ai](https://www.pixellab.ai/)).

- A function noun ("Navigator", "Explorer", "Archive", "Library") will look like the next item in that list.
- A playful container noun is the only "PixelLab ___" form that clearly breaks the pattern.
- PixelLab's site doesn't list a gallery or library page today. That makes a function-noun name easier to mistake for an upcoming official one.

**Second collision on the brand itself:** "PixelLab - Text on pictures" (developer App Holdings) is a popular, unrelated Android photo-text app ([AlternativeTo](https://alternativeto.net/software/pixellab--text-on-pictures/about)). Several unrelated iOS apps also start with "PixelLab:" ([App Store](https://apps.apple.com/us/app/id6757263162)). Searching "PixelLab" in the app stores already shows other products, which is one more reason to make the second word carry the identity.

### Trademark and app-store risk of starting with "PixelLab"

Be honest about this: a name that starts with another company's brand is the riskiest companion pattern.

- **Apple App Review 4.1(c):** "You cannot use another developer's icon, brand, or product name in your app's icon or name, without approval from the developer." Guideline 5.2.1 says "Don't use protected third-party material such as trademarks… without permission." ([Apple guidelines](https://developer.apple.com/app-store/review/guidelines/), [9to5Mac on the 2025 tightening](https://9to5mac.com/2025/11/13/apple-tightens-app-review-guidelines-to-crack-down-on-copycat-apps/)).
  - In practice, a native iOS app named "PixelLab ___" needs written approval from PixelLab.
- **Google Play's impersonation policy** bans names, icons or listings that "imply that your app is related to or authorized by someone that it isn't" ([Play policy](https://support.google.com/googleplay/android-developer/answer/9888374)).
  - Companion apps have been suspended for this even when they were open source and used official APIs. The Pi-hole Droid case is one example ([Pi-hole forum](https://discourse.pi-hole.net/t/pi-hole-eupl-license-question/2915)).
  - Writing "unofficial" only in the package name didn't save one app ([Kodular forum](https://community.kodular.io/t/app-suspended-from-playstore/29878)).
- **Brand policies elsewhere:**
  - Spotify's developer policy forbids names that begin with "Spot" or sound like Spotify ([Spotify policy](https://developer.spotify.com/policy/)).
  - Minecraft's guidelines bar "Minecraft" as the first or dominant word of a title ([summary](https://conductatlas.com/platform/minecraft/minecraft-usage-guidelines/provision/CA-P-025397/minecraft-name-not-first-or-dominant-word-in-publication-title/)).
- **Nominative fair use** generally protects using a brand to *describe compatibility* ("a gallery for PixelLab"), as long as you use only as much of the mark as you need and imply no endorsement. Leading with the brand as part of your product's own name is weaker ground than "for PixelLab".
- **PixelLab's terms** don't appear to have a branding clause. They do say programmatic use goes through the official API, and that building "your own service" means you should reach out to them ([PixelLab ToS](https://www.pixellab.ai/termsofservice)). That's another reason to contact them.
- **A plain web app is lower risk than a store app,** because no store reviewer is involved. But trademark law still applies, and so does the risk of users being confused.

### Safest way to keep the "PixelLab" prefix

1. **Pick a distinctive, playful second word** that no company would use for an official page, and treat that word as the real brand (in the icon, in-app headers and the short name).
2. **Always pair the name with a subtitle:** "an unofficial gallery for your PixelLab art". Add a footer such as "Not made by, affiliated with, or endorsed by PixelLab."
3. **Never use PixelLab's logo, wordmark styling, colors or icon shape.** Give the app its own icon based on the second word (for example, a backpack).
4. **Write the brand in plain text** ("PixelLab") with your word styled more prominently, so the eye reads "Backpack" first.
5. **Ask PixelLab for written OK** before any App Store or Play release. Apple 4.1(c) effectively requires it. Keep a fallback ready, such as "Backpack for PixelLab", in case they decline.

### Home-screen and tab fit

- "PixelLab " plus a space already uses 9 of the roughly 12 characters a home-screen label shows on iOS and Android. The real cutoff depends on pixel width ([Sonar](https://trysonar.app/blog/ios-app-title-length), [Proxmox example](https://lore.proxmox.com/c5950500-9dd0-4a55-8a12-96f08cd89fd2@proxmox.com)).
- **Every "PixelLab ___" name truncates** to something like "PixelLab Ba…", which hides the distinctive word and leaves only the brand. That's the worst possible outcome.
- **Fix:** set the web manifest `short_name` and `apple-mobile-web-app-title` to the second word alone ("Backpack"), and use the full name in `<title>` and the manifest `name`.
- Browser tabs show about 15 to 25 characters, so the full name usually fits. Put the distinctive word where it survives tab truncation, for example a `<title>` of "Backpack · PixelLab" or "PixelLab Backpack".
- In the table, "Fit" rates the short-name label. Every full name overflows 12 characters.

## Ranked names

- **Gallery** = how clearly it says "place to see your assets".
- **Unlikely official** = high is good, meaning it is unlikely to be mistaken for a PixelLab product.

| # | Name | Meaning / why | Gallery | Unlikely official | Home screen (short name) | Conflicts found |
|---|---|---|---|---|---|---|
| 1 | **PixelLab Backpack** | Game-inventory word for "everything you've collected, carried with you". | Medium-high (inventory) | **High** | "Backpack" (8) fits | Backpack crypto wallet/exchange (Solana) ([App Store](https://apps.apple.com/us/app/backpack-crypto-wallet/id6445964121)), different category. Pix LED backpack app, which is pixel-art adjacent ([App Store](https://apps.apple.com/app/id1363522351)). The old 37signals Backpack was discontinued. backpack.tf is a TF2 site and a good precedent. |
| 2 | **PixelLab Trove** | "A treasure trove of your art": a collection of valuable things. | High (collection) | **High** | "Trove" (5) fits | Trove MMO game (Gamigo), and Trove, the National Library of Australia search. Neither is an app-store art tool. Nothing found for "Pixel Trove". |
| 3 | **PixelLab Satchel** | A smaller, crafted take on the backpack idea; RPG satchel/inventory flavor. | Medium (inventory) | **High** | "Satchel" (7) fits | Satchel One, a UK school homework platform. Satchel was also a 2009 iPhone client for 37signals Backpack ([source](https://standalone.com/blog/2009/04/)). Low risk. |
| 4 | **PixelLab Binder** | A trading-card binder: pages of your collection, sorted into folders. | High (collection + folders) | High | "Binder" (6) fits | mybinder.org (Jupyter) and Android's Binder IPC, both developer-only. Nothing found for "Pixel Binder". |
| 5 | **PixelLab Shelf** | Where you display what you've made. Calm, iOS-like. | High (display) | Medium-high | "Shelf" (5) fits | Pixel Shelf, a Chrome extension that saves images from webpages ([Hunted](https://www.hunted.space/product/pixel-shelf)). A close neighbor, so differentiate. |
| 6 | **PixelLab Stash** | Your personal stash of sprites. Short and casual. | Medium-high | High | "Stash" (5) fits | Stash, a self-hosted media organizer widely used for adult-video libraries ([docs](https://docs.stashapp.cc)), and the Stash investing app. This hurts the brand association. |
| 7 | **PixelLab Curio** | A curio cabinet: small treasures on display. | Medium-high | High | "Curio" (5) fits | Curio is a Mac note/mind-map app (Zengobi) and an audio-journalism app. "Curio" is less familiar to non-native speakers. |
| 8 | **PixelLab Cubby** | A cubby you keep your things in. Friendly, small. | Medium | High | "Cubby" (5) fits | Cubby was a LogMeIn file-sync service (discontinued). Can sound childish. |
| 9 | **PixelLab Attic** | Where everything you've ever made ends up. | Medium | High | "Attic" (5) fits | No relevant conflict found. Connotes old, forgotten things. |
| 10 | **PixelLab Hoard** | A dragon's hoard of sprites. Fun for game devs. | Medium | High | "Hoard" (5) fits | No relevant conflict found. Slightly negative ("hoarding"). |
| 11 | **PixelLab Flipbook** | Flip through your art and play the animations. | Medium (animation-first) | Medium (could sound like an official animation tool) | "Flipbook" (8) fits | Many flipbook-maker apps and the Unreal "Flipbook" sprite asset type. Crowded. |
| 12 | **PixelLab Folio** | Short for portfolio. | High | Medium | "Folio" (5) fits | Folio ID/card wallet app, and PixFolio slideshow app ([App Store](https://apps.apple.com/pt/app/apresenta%C3%A7%C3%A3o-de-fotos-pixfolio/id1624072761)). |
| 13 | **PixelLab Scrapbook** | A personal collage of your work. | High | Medium-high | "Scrapbook" (9) fits | Lots of scrapbook apps. Implies decorating, not browsing. |
| 14 | **PixelLab Navigator** | Navigate everything in your account. | Low-medium (sounds like a tool, not a place) | **Low** | "Navigator" (9) fits | Matches PixelLab's own "PixelLab + function noun" pattern (Editor, Game Builder, Map Workshop). "Navigator" is also an image-editor zoom/pan panel name (Photoshop, PixelNEO ([doc](https://pixelneohelp.visualneo.com/ShowNavigator.html))), and Anaconda Navigator. No exact-name product found. |
| 15 | **PixelLab Chest** | A loot chest of assets. | Medium | Medium-high | "Chest" (5) fits | Generic. In English it also means the body part. |
| 16 | **PixelLab Album** | A photo-album metaphor. | High | Low | "Album" (5) fits | Reads as a built-in feature, like Photos albums. |
| 17 | **PixelLab Vault** | Secure storage of your assets. | Medium | Low-medium | "Vault" (5) fits | Gallery Vault and Locker are hidden-photo apps; HashiCorp Vault; several unrelated "Pixel Vault" products ([itch.io asset pack](https://indie-dev-nest.itch.io/the-pixel-vault)). Implies security or a paid storage tier. |
| 18 | **PixelLab Locker** | A personal locker. | Medium | Medium | "Locker" (6) fits | "Locker: Photo Vault" hidden-photo app ([App Store](https://apps.apple.com/us/app/-/id1254051789)). Suggests privacy/locking. |
| 19 | **PixelLab Lightbox** | A photographer's lightbox for reviewing images. | High (for photographers) | Medium | "Lightbox" (8) fits | Also a common UI-component name (the image-popup lightbox), so it reads as a feature. |
| 20 | **PixelLab Atlas** | A map of all your assets. | Medium | Low | "Atlas" (5) fits | In game dev, "atlas" means a packed sprite sheet, so it sounds like a PixelLab export feature. MongoDB Atlas. |
| 21 | **PixelLab Codex** | An RPG codex of everything you've made. | Medium | Medium | "Codex" (5) fits | OpenAI Codex, a coding agent that this coding-agent-using audience knows well. Strong confusion. |
| 22 | **PixelLab Explorer** | Explore your account. | Medium | **Low** | "Explorer" (8) fits | File Explorer / Internet Explorer. A pure function noun that reads as official. |
| 23 | **PixelLab Pocket** | Your art in your pocket. | Medium | **Low** | "Pocket" (6) fits | Sounds like an official mobile edition (compare "Minecraft: Pocket Edition"). Mozilla's Pocket, now shut down. |

## Top 5

**1. PixelLab Backpack**: *"PixelLab Backpack: an unofficial gallery for your PixelLab art"*

- Strongest at breaking PixelLab's own "PixelLab + tool" pattern. No company would call its asset page a backpack, so it reads as a fan-made companion.
- Game devs already know "backpack = inventory" from TF2/Steam, and backpack.tf is a long-running unofficial precedent.
- It gives a simple, ownable icon (a pixel backpack) that is nothing like PixelLab's logo, and the 8-character short name fits any home screen.
- Weakness: it says "my stuff" more than "gallery", so the subtitle has to carry the word "gallery". The Solana Backpack wallet is the main name neighbor, but it's in a different category.

**2. PixelLab Trove**: *"PixelLab Trove: your PixelLab art, all in one unofficial gallery"*

- Says "collection of treasures" more directly than Backpack, and the 5-character short name is the most compact on the list.
- Very unlikely to read as official, with no app-store art conflicts found.
- Slightly less playful and less iconic than Backpack (a treasure chest icon overlaps with "Chest"). Some users may not know the word "trove".

**3. PixelLab Satchel**: *"PixelLab Satchel: an unofficial gallery for your PixelLab sprites"*

- The same inventory idea as Backpack, with a crafted, RPG-adventurer feel that suits pixel art.
- Few conflicts (a UK school app, and an old 2009 iPhone client).
- Less universally understood than "backpack", and some people find it harder to say.

**4. PixelLab Binder**: *"PixelLab Binder: an unofficial gallery to sort and save your PixelLab art"*

- The best fit for the *organize* half of the app: folders, pages, favorites, like a trading-card binder. Collectors know the metaphor instantly.
- The conflicts (Jupyter's mybinder, Android IPC) are developer jargon, not consumer apps.
- It feels a bit office-supply. It says "organizer" more than "play animations".

**5. PixelLab Shelf**: *"PixelLab Shelf: an unofficial gallery for your PixelLab art"*

- The calmest, most iOS-like option, and the clearest "display" word. It matches the minimal UI direction.
- It reads slightly more like an official feature than 1 to 4 ("Shelf" is a common product-UI word).
- The Chrome extension "Pixel Shelf" is a close image-saving neighbor, so it needs more differentiation.

**About PixelLab Navigator (ranked 14):** it's the owner's idea, and it describes moving through your assets accurately. But it is the option most likely to be read as an official PixelLab tool. It sits right beside "PixelLab Editor / Game Builder / Map Workshop", and "Navigator" is already a zoom/pan panel name in image editors. It also says "tool" rather than "gallery". It's the right word for a feature *inside* the app (for example, a navigator sidebar), not for the product name.

## Recommendation

**#1: PixelLab Backpack**, with these settings:

- Subtitle: "an unofficial gallery for your PixelLab art"
- `short_name` / home-screen label: **Backpack**
- `<title>`: "PixelLab Backpack"
- An original backpack icon
- A footer: "Not made by, affiliated with, or endorsed by PixelLab"

Before any App Store or Play release, ask PixelLab for written permission to use the prefix. Apple 4.1(c) effectively requires it. If they decline, fall back to **"Backpack for PixelLab"**, which keeps the same identity.

Runner-up if you want a word that says "collection" more directly: **PixelLab Trove**.
