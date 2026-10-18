## Codex Safety Instructions
If using Codex on this repository, follow the rules defined in `AGENTS.md`.
Do not install packages, modify system settings, or access files outside this project without explicit approval.

# CarbonLens (React Web Application)

A responsive React + Vite web application for verified sustainability actions and Green Points, rewritten from the original Flutter prototype.

## Features Ported

1. **Responsive Dashboard & Navigation**:
   - Desktop sidebar navigation (12 destinations) with icons and highlight states
   - Mobile top AppBar with user greeting ("Good Morning / Hello, John") and bottom navigation bar + "More" modal sheet
   - Demo mode indicator and account management

2. **Core Impact Modules**:
   - **Home**: Green Score gradient progress card (78/100), period switcher (Today / Week / Month), metric rows (walking, purchases, avoided CO2e, points earned), wallet balance, and AI insights.
   - **Scan**: Product and receipt scanning modes with camera viewfinder frame, evidence preview, sample demonstration scan, and full Carbon Footprint + Sustainability Score breakdown with "Add to My Impact" verification.
   - **Green Buy**: Sourced alternative product catalog across categories (Personal Care, Home, Food) with footprint ratings, lower emission percentages, and product details.
   - **Green Move**: Commute substitution tracking for Walk, Cycle, and Transit with route diagram and Health Connect evidence form.
   - **Grow Green**: Tree planting plot registration, "My Trees" tracker with verification state badges (PENDING, PROVISIONAL, VESTED), and 5-checkpoint persistence timeline.
   - **Recycle Red**: E-waste safe hand-off verification with certified recycler registry requirements and receipt upload.
   - **Rewards**: Wallet balance (1,420 GP vested, 100 GP provisional), reward ledger history, and earning action cards.
   - **CarbonLens AI**: Guidance prompts and scan ID factual explanations.
   - **Earth Intelligence**: Editorial landscape articles and environmental guidance.
   - **Reports**: Monthly avoided emissions breakdown with interactive weekly bar chart and category metrics.
   - **Community**: Leaderboard rankings with privacy protections.
   - **Settings**: Privacy and data consent toggles (camera, location, activity, microphone, personalization) and session management.

## Development

- Start local dev server: `npm run dev` (listens on `http://0.0.0.0:3000`)
- Build production bundle: `npm run build`

