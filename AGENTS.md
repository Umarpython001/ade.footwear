# AGENTS.md

## Project
Online shop for ADE Foot Wear, a Nigerian handcrafted footwear brand. Built
for an HNG assignment due Friday 2 Oct 2026 and meant to be usable by the
owner afterward. Scope is defined in PRD.md. Do not build features outside
it.

## Stack
- React, TypeScript (strict), Vite, React Router
- Tailwind CSS v3.4. v4 is blocked on this machine by a Windows Application
  Control policy. Use tailwind.config.js, postcss.config.js, and the
  @tailwind base, components, and utilities directives in src/index.css.
  Do not install or switch to v4 or @tailwindcss/vite.
- Backend: FastAPI. Database and auth: Supabase (Google sign-in).
- Frontend deploys to Vercel.
- Read package.json before suggesting dependencies. Ask before installing
  anything. No state libraries (Redux, Zustand) and no animation libraries
  without asking.

## Routes (v1)
Home, Shop, Product Details, Cart, Checkout, Orders (order history).
Delivery, About, and Contact are homepage sections or footer content, not
separate pages.

## Design
- Read the design/ folder before building any UI. Match the mockups. If a
  section has no mockup, ask.
- Look: near-black backgrounds, white type, ADE yellow/gold accent, warm
  leather/wood tones, real product photography, strong editorial type.
- No new colors, gradients, glow effects, or generic luxury-template
  styling.
- Homepage sections, in order: navbar, full-screen hero slideshow, featured
  products, about, collections, why ADE, delivery, reviews, showcase, CTA,
  footer. Build one section at a time.
- Navbar is transparent over the hero and becomes fixed with a dark
  background after scrolling, with a smooth transition.
- Use real photos and copy only. Do not invent reviews, prices, delivery
  terms, or statistics. Mark missing content with [PLACEHOLDER].

## Motion
- Every homepage section and every card grid reveals as it scrolls into
  view, through ONE shared mechanism (a Reveal component or hook built on
  IntersectionObserver). No per-section animation code.
- Animate only opacity and transform (including image scale). Never animate
  width, height, top, left, or margin.
- Reveal once; do not replay when scrolling back up.
- Stagger children in grids with a CSS delay.
- Keep durations around 400-700ms with ease-out. Nothing bounces.
- The hero is visible immediately on load, with its own load animation.
  Never hide first-screen content waiting for a scroll.
- Respect prefers-reduced-motion: show content instantly with no movement.
- No animation library.

## Cart rules
- Global state via React Context + useReducer. Only components that need
  the cart should read it.
- A cart item is { productId, size, quantity }. Do not store prices or
  full product objects in the cart. Derive totals from current product
  data.
- v1 persists the cart in localStorage. No database cart and no guest/user
  merge in v1.
- Orders are saved to the database at checkout. The FastAPI backend
  recalculates every price from the database and never trusts prices from
  the browser.
- The FastAPI backend verifies the Supabase access token on every order
  request. It never trusts a user_id sent in the request body.

## Security
- Never commit .env files or print keys. The frontend may only use public
  VITE_ variables and the Supabase anon key. The service role key and the
  Mailgun key live only in the backend environment.

## Working rules
- On a new repo, first confirm `npm run build` passes with Tailwind v3
  before building any UI. If it fails with a Windows policy or blocked-file
  error, stop and report it instead of switching tools.
- Small steps. Keep the app building after each one.
- Explain what you plan to change before changing it.
- Only touch files related to the current task.
- Commit after each working feature.
- Run locally with `npm run dev`; check with `npm run build`.