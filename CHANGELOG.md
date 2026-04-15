# Changelog

All notable changes to Carbide will be documented here.

## [v0.1.0] — 2026-04-15

### Initial Release

- **VIN Decoding**: Integration with NHTSA free API to decode VIN into make, model, year, trim, engine, drivetrain, and fuel type
- **AI Report Generation**: Full ownership cost analysis powered by Claude claude-sonnet-4-6 via Anthropic API
- **Report Sections**: 9-section comprehensive report including vehicle summary, purchase price context, financing estimates, insurance estimate, fuel costs, maintenance & reliability, depreciation projections, total cost of ownership, and bottom-line verdict
- **Loading State**: Animated cycling loading messages with automotive-themed wit
- **Three-Tab Navigation**: Search (VIN input + report), History (localStorage), Compare (side-by-side comparison table)
- **History Tab**: Stores up to 20 previously viewed cars in localStorage with make, model, year, date viewed
- **Compare Tab**: Side-by-side comparison of any two cars from history across 14 key metrics
- **Manufacturer Logo Watermark**: Subtle 6% opacity logo behind report using Clearbit Logo API
- **Email Capture**: Optional non-intrusive prompt to save/share report (stored in localStorage)
- **Affiliate CTAs**: Insurance quote button (The Zebra) and loan rate button (LendingTree) with click tracking via console
- **Dark/Light Mode**: Full support for both modes, defaults to dark, persists in localStorage
- **Progressive Web App**: manifest.json + service worker for installable PWA on iOS and Android
- **Mobile-First Design**: 375px baseline, full Tailwind responsive classes, no horizontal scrolling
