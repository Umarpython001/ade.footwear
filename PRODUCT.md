# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nigerian customers who mostly discover ADE Foot Wear through its Instagram
(@ade.footwear). They browse on both phones and desktops, and both matter
equally. Their job: see the real handcrafted shoes, check sizes and prices,
add pairs to a cart, and submit an order request. Secondary user: the owner,
who fulfils submitted orders outside the site (no admin dashboard in v1).

## Product Purpose

ADE Foot Wear's first website, moving the brand beyond Instagram: a shop
where visitors browse products, view details, choose a size, keep a cart,
sign in with Google, check out, receive a confirmation email, and review
past orders. Also an HNG Lesson 2 assignment (demo due 2 Oct 2026) that must
remain usable by the business afterward. Full scope lives in PRD.md.

## Positioning

Nigerian-made, handcrafted leather footwear from a small workshop, shown
through the brand's own product photography rather than stock imagery.

## Operating Context

- Visitors arrive from Instagram links, often on mobile data connections.
- v1 does not take payment. Checkout records an order request the owner
  fulfils through the existing process; the site must say so plainly.
- WhatsApp/phone is a support channel, not a substitute for checkout.

## Capabilities and Constraints

- Routes: `/`, `/shop`, `/products/:slug`, `/cart`, `/checkout`, `/orders`.
  About, Delivery, Reviews, Contact are homepage sections, not pages.
- Current phase: frontend only, guest mode. No backend, auth, or database
  yet; the cart lives in localStorage; checkout submission is disabled.
- Stack is fixed by AGENTS.md: React, strict TypeScript, Vite, React Router,
  Tailwind CSS 3.4 (v4 blocked on the dev machine). No state or animation
  libraries without approval.
- Out of scope for v1: payments, ratings/customer reviews, colour variants,
  search, discount codes, admin dashboard (see PRD.md section 6).

## Brand Commitments

- Name as shown on packaging and logo: "Ade Foot Wear". Final public
  spelling is an open owner decision (PRD.md section 22).
- Logo: `frontend/src/assets/logo.png` (150x150 JPEG, black ground, yellow
  slash). A high-resolution or vector logo is still needed.
- Binding look from AGENTS.md: near-black backgrounds, white type, ADE
  yellow/gold accent, warm leather/wood tones, real product photography,
  strong editorial type. No new colours, gradients, glows, or generic
  luxury-template styling.
- Reference mockups: `designs/sections/` (dark full mockup is the
  direction; hero, featured, about section comps).

## Evidence on Hand

- Four real product photos (Instagram screenshots, portrait ~575x1010, with
  an Instagram mute icon bottom-right): `frontend/src/assets/img1-4.png`
  (woven derby, two-strap slides, plain derby, V-buckle mules).
- Contact details printed on packaging in img1: 08082475564,
  adefootwear9@gmail.com, @ade.footwear. Owner to confirm before launch.
- Not yet available: real product names, prices, sizes, categories,
  descriptions, reviews, delivery terms, brand story. Until launch the site
  uses dummy data marked [PLACEHOLDER]; the owner will supply real content
  before deployment.
- Mockup imagery and copy (product names, prices, ratings, reviewer names,
  delivery claims) are illustrative only and are not ADE facts.

## Product Principles

- Mobile first, desktop equal: layouts start at phone width and must be
  just as considered on desktop.
- Real products lead: the shoes and their photos carry the page.
- Honest ordering: always clear that v1 submits an order request with no
  online payment.
- No invented claims ship to production: dummy content is allowed during
  development only and must be visibly marked.
- Focused scope: nothing outside PRD.md without approval.

## Accessibility & Inclusion

Keyboard-operable controls, visible focus states, readable contrast, labelled
form fields, meaningful product alt text, accessible cart/form feedback,
status never conveyed by colour alone, and prefers-reduced-motion respected
(PRD.md section 16).
