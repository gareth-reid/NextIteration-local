# Next Iteration — Local AI Help

Single-page static site targeting local businesses and individuals on the Mornington Peninsula, Victoria.

**Live:** https://local.next-iteration.com

## What it is

Practical AI guidance and support for small businesses and individuals who want to understand what AI can do for them — without the jargon or hard sell. Offered by Gareth Reid, a Mornington local with a background in software engineering, automation, AI and data science.

## Stack

- Plain HTML/CSS/JS — no framework, no build step
- Formspree for form handling
- Google Fonts + Font Awesome (CDN)
- PWA-ready (manifest + service worker)
- GA4 analytics

## Structure

```
/
├── index.html          # Home page
├── services/
│   └── index.html      # Services overview (5 services)
├── assets/
│   ├── favicon.svg
│   ├── av.png          # Founder avatar
│   └── icons/          # PWA icons (192px, 512px)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── robots.txt
└── sitemap.xml
```

## Running locally

Any static file server works:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Deployment

Hosted as a static site. Intended for `local.next-iteration.com` subdomain.

## Related

Main lab consulting site: https://github.com/gareth-reid/NextIteration
