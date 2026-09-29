# Amar Suleiman · Portfolio

The portfolio of Amar Mohammed Fadel Suleiman, Marketing & Brand Strategist, read like a printed magazine: a 26-page issue on a desk, with pages that turn in 3D as you scroll, paper sounds, and a tap-to-read mode on phones.

## Run locally

It is a static site with no build step. Serve the folder and open it:

```bash
python3 -m http.server 4321
```

Then visit http://localhost:4321. Add `#p=7` to the URL to open a specific spread.

## Structure

- `index.html`: the book (stage, page turns, smooth scroll, loader, intro)
- `shared/pages.js`: the 26 pages, in reading order
- `shared/tokens.css`: colours, type and page styles
- `shared/page-motion.css`: in-page animations when a spread opens
- `shared/reader.js`, `shared/reader.css`: phone tap-to-zoom reading mode
- `shared/paper-sound.js`: page-turn sounds, synthesised in the browser
- `assets/`: images, the tree artwork (`tree.webp`) and the Lottie loader

## Credits

- Type: Bodoni Moda, Newsreader, Jost and Noto Naskh Arabic via Google Fonts
- Smooth scrolling: [Lenis](https://github.com/darkroomengineering/lenis)
- Loader animation: "Turn page" by Orenda.dk on [LottieFiles](https://lottiefiles.com/free-animation/turn-page-8N5yCh1N4Y), used under the Lottie Simple License, played with lottie-web

© 2026 Amar Mohammed Fadel Suleiman
