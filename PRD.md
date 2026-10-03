# ADE Foot Wear — Product Requirements Document
​
**Document status:** Draft for owner review  
**Version:** 1.0  
**HNG demo deadline:** 2 October 2026  
**Production launch:** To be agreed after owner review and testing  
**Owner:** ADE Foot Wear  
**Developer:** Umar Olowonyo
​
## 1. Product Summary
​
ADE Foot Wear is a Nigerian handcrafted-footwear brand that currently uses
Instagram as its main online presence. This project will create its first
website: a polished online shop where customers can discover products, review
product details, add items to a cart, sign in, complete checkout, receive an
order-confirmation email, and review previous orders.
​
The initial release must satisfy the HNG Lesson 2 assignment while remaining
useful to the business afterward. It will not process online payments in v1.
An order recorded at checkout is an order request that the business can fulfil
through its existing process.
​
## 2. Background
​
The owner of ADE Foot Wear agreed to have the website built at no development
charge. The project gives the business a professional online presence and gives
the developer experience delivering a real client project.
​
Free development does not include recurring third-party costs. Domain
registration, paid hosting, email-service charges, payment-provider charges,
and other ongoing business expenses remain the owner's responsibility unless
separately agreed.
​
## 3. Goals
​
### Business goals
​
- Give ADE Foot Wear a credible website beyond its Instagram presence.
- Present real products and brand information professionally.
- Make it easy for customers to browse footwear and submit orders.
- Store customer orders reliably for later fulfilment.
- Give returning customers access to their order history.
- Create a foundation the business can continue using and improving.
​
### Project goals
​
- Deliver the HNG-required shopping, authentication, database, email, and
  order-history flows by 2 October 2026.
- Build a maintainable application with clear frontend/backend boundaries.
- Use owner-approved branding, photographs, product information, and copy.
- Keep the first release focused enough to deliver and test reliably.
​
### Success criteria
​
The release is successful when:
​
1. A visitor can browse real ADE Foot Wear products and view product details.
2. A visitor can choose a size and add a product to the cart.
3. A customer can sign in with Google.
4. A signed-in customer can complete checkout.
5. The backend validates the customer and recalculates all prices from the
   database.
6. The order and its line items are saved in Supabase.
7. The customer receives a correctly formatted confirmation email.
8. The customer can sign out, return, sign in again, and still see the order.
<!-- 9. The deployed site works on current mobile and desktop browsers. -->
9. The owner approves the branding, product content, and ordering workflow.
​
## 4. Users
​
### Customer
​
A person who wants to discover ADE Foot Wear products, check available options,
place an order, and review previous orders.
​
### Business owner
​
The person who supplies approved business content and fulfils submitted orders.
An owner-facing administration dashboard is not included in v1. Initial product
data may be managed directly in Supabase by the developer or owner.
​
## 5. Product Principles
<!-- ​
- **Real content only:** Do not invent products, prices, reviews, delivery
  promises, statistics, or business claims.
- **Mobile first:** The primary audience is expected to include mobile and
  social-media visitors. -->
- **Simple ordering:** Checkout must be understandable and require only
  necessary information.
- **Trustworthy:** Clearly communicate that v1 submits an order request and
  does not collect online payment.
- **Accessible:** Navigation, forms, controls, focus states, text contrast, and
  reduced-motion behaviour must be usable.
- **Focused scope:** Do not build features outside this document without owner
  and developer approval.
​
## 6. Scope
​
### Included in v1
​
- Responsive marketing homepage
- Product catalogue
- Product-detail pages
- Size selection
- Local cart
- Checkout
- Google authentication through Supabase
- Supabase product and order storage
- FastAPI order API
- Mailgun order-confirmation email
- Customer order history
- Business information, delivery information, contact details, and Instagram
  link
- Deployment of the frontend to Vercel
- Deployment of the FastAPI backend to an approved host
​
### Not included in v1
​
- Online payment processing
- Automatic stock reservation
- Real-time inventory synchronisation
- Customer password registration
- Guest-to-user cart merging
- Database-backed carts
- Discount codes, gift cards, loyalty points, or referrals
- Product ratings or customer-submitted reviews
- Owner administration dashboard
- Automated shipping quotations or tracking
- Returns portal
- Multi-vendor functionality
- Multiple currencies or languages
- Native mobile application
​
Any excluded capability requires a later scope decision.
​
## 7. Information Architecture
​
### Routes
​
| Route | Purpose |
| --- | --- |
| `/` | Homepage and primary brand experience |
| `/shop` | Browse and filter products |
| `/products/:slug` | View one product and choose a size |
| `/cart` | Review and update selected items |
| `/checkout` | Sign in if needed and submit an order |
| `/orders` | View the signed-in customer's previous orders |
​
Delivery, About, and Contact are homepage/footer content rather than separate
routes in v1.
​
### Homepage sections
​
Build these sections in this order:
​
1. Navbar
2. Full-screen hero slideshow
3. Featured products
4. About ADE Foot Wear
5. Collections
6. Why ADE
7. Delivery information
8. Owner-approved reviews
9. Product/lifestyle showcase
10. Final call to action
11. Footer
​
Sections without approved content or design assets must use a visible
`[PLACEHOLDER]` in development and must not invent final content.
​
## 8. Functional Requirements
​
### 8.1 Homepage
​
- Show the approved logo, brand name, imagery, and copy.
- The navbar begins transparent over the hero.
- After the user scrolls, the navbar becomes fixed with a dark background and a
  smooth transition.
- The hero displays approved photography immediately on load.
- Featured-product and collection links lead to relevant shop results or
  product pages.
- Contact and social links use owner-provided details.
- The Instagram link points to
  <https://www.instagram.com/ade.footwear/>.
​
### 8.2 Shop
​
- Display active products using responsive cards.
- Each card shows an approved image, product name, formatted price, and
  availability state.
- Selecting a card opens its product-detail page.
- v1 may include category filtering if categories are supplied.
- Empty and loading states must be clear.
​
### 8.3 Product details
​
- Display the product name, images, description, price, category, and available
  sizes from the database.
- Require the customer to select a valid size before adding the item to the
  cart.
- Prevent adding unavailable products or unavailable sizes.
- Provide clear success feedback after adding an item.
​
### 8.4 Cart
​
- Store cart state with React Context and `useReducer`.
- Represent each line as `{ productId, size, quantity }`.
- Do not store product prices or full product objects in cart state.
- Derive names, images, availability, prices, and totals from current product
  data.
- Persist the v1 cart in `localStorage`.
- Allow customers to change quantities and remove items.
- Prevent quantities below one.
- Display subtotal and state clearly that final fulfilment/delivery details are
  confirmed by ADE Foot Wear.
- A cart containing unavailable or changed products must require correction
  before checkout.
​
### 8.5 Authentication
​
- Use Supabase authentication with Google sign-in.
- Require authentication before an order is submitted or order history is
  viewed.
- Preserve the local cart through the authentication redirect.
- Provide a clear sign-out action.
- Do not implement email/password authentication in v1.
​
### 8.6 Checkout
​
- Show a final order summary based on current server-backed product data.
- Collect only owner-approved fulfilment fields. Proposed fields:
  - Customer name
  - Email
  - Phone/WhatsApp number
  - Delivery address
  - City/state
  - Optional order note
- Require the customer to confirm that the submitted information is correct.
- Submit product IDs, selected sizes, quantities, and fulfilment information to
  the FastAPI backend.
- Never submit or trust client-calculated prices as the order authority.
- Disable duplicate submission while the request is processing.
- Show a clear confirmation containing the created order reference.
- Clearly state that no online payment was collected in v1.
- Clear the cart only after the order has been saved successfully.
​
The final fulfilment fields and order-status wording require owner approval.
​
### 8.7 Orders
​
- Show only orders belonging to the authenticated customer.
- Display order reference, creation date, status, items, quantities, selected
  sizes, and server-calculated total.
- Provide useful loading, empty, and error states.
- A customer must not be able to access another customer's order.
​
### 8.8 Confirmation email
​
- Send through Mailgun only after the order is saved.
- Include:
  - ADE Foot Wear identity
  - Order reference
  - Ordered items, sizes, quantities, and prices
  - Server-calculated total
  - Submitted fulfilment details
  - Owner-approved next-step wording
  - Business contact information
- Do not include secrets or internal database identifiers.
- Email-delivery failure must be logged safely and must not create a duplicate
  order if retried.
​
### 8.9 Contact and ordering support
​
- Display the owner-approved phone/WhatsApp number and Instagram account.
- If the owner wants WhatsApp support, links should open a prepared message
  without exposing sensitive customer data in the URL.
- WhatsApp is a support/follow-up channel, not a substitute for the required
  database checkout flow.
​
## 9. Order Lifecycle
​
Proposed v1 statuses:
​
- `submitted`
- `confirmed`
- `in_progress`
- `ready`
- `dispatched`
- `completed`
- `cancelled`
​
The owner must approve this list. New orders begin as `submitted`. Because v1
has no owner dashboard, status updates may initially be made directly in
Supabase by an authorised person.
​
## 10. Data Requirements
​
### Product
​
- ID
- Slug
- Name
- Description
- Category
- Price in Nigerian naira, stored as an integer in kobo
- Approved image URLs
- Available sizes
- Active/available state
- Featured state
- Created and updated timestamps
​
### Order
​
- ID
- Human-readable order reference
- Authenticated Supabase user ID
- Customer email
- Customer name
- Phone/WhatsApp number
- Delivery address fields
- Optional note
- Status
- Server-calculated subtotal
- Delivery fee, if approved and known
- Server-calculated total
- Created and updated timestamps
​
### Order item
​
- Order ID
- Product ID
- Product-name snapshot
- Selected size
- Quantity
- Server-verified unit-price snapshot
- Line total
​
Order items retain product-name and verified-price snapshots so historical
orders remain accurate if the catalogue later changes.
​
## 11. Backend and API Requirements
​
- Build the backend with FastAPI.
- Verify the Supabase access token on every protected order request.
- Derive the authenticated user ID from the verified token; never trust a
  `user_id` supplied by the browser.
- Query the database for every product and current price during checkout.
- Reject missing, inactive, or invalid products and sizes.
- Calculate every line total and order total on the server.
- Save the order and all order items atomically.
- Return safe, actionable validation errors.
- Restrict order-history queries to the authenticated user.
- Keep the Supabase service-role and Mailgun keys only in the backend
  environment.
- Configure CORS only for approved local and production frontend origins.
​
Proposed API surface:
​
| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Deployment health check |
| `GET` | `/products` | List active products |
| `GET` | `/products/{slug}` | Retrieve one active product |
| `POST` | `/orders` | Validate and create an authenticated order |
| `GET` | `/orders` | List the authenticated customer's orders |
| `GET` | `/orders/{id}` | Retrieve one order owned by the customer |
​
Exact paths may change during implementation if behaviour remains consistent
with this PRD.
​
## 12. Visual Design
​
- Read and follow the assets and mockups in `design/` before building UI.
- Use near-black backgrounds, white type, the approved ADE yellow/gold accent,
  and warm leather/wood tones.
- Use strong editorial typography and authentic product photography.
- Do not add unapproved colours, gradients, glow effects, or generic
  luxury-template styling.
- Do not invent visual branding where owner input or a mockup is missing.
- Build and review one homepage section at a time.
​
## 13. Motion
​
- Use one shared `IntersectionObserver`-based reveal component or hook for
  homepage sections and card grids.
- Reveal content once and do not replay animations when scrolling upward.
- Animate only `opacity` and `transform`, including image scale.
- Stagger grid children with CSS delays.
- Keep durations approximately 400–700 ms with ease-out timing.
- Do not use bouncing motion.
- Display the hero immediately with its own load animation.
- Respect `prefers-reduced-motion` by showing content instantly.
- Do not add an animation library.
​
## 14. Technical Requirements
​
### Frontend
​
- React
- TypeScript in strict mode
- Vite
- React Router
- Tailwind CSS 3.4
- React Context and `useReducer` for cart state
- Vercel deployment
​
Tailwind CSS v4 and `@tailwindcss/vite` are explicitly excluded because of the
current Windows Application Control restriction.
​
### Backend and services
​
- FastAPI
- Supabase Postgres
- Supabase Google authentication
- Mailgun transactional email
- Approved FastAPI hosting provider
​
### Dependency rules
​
- Read `package.json` before suggesting packages.
- Ask before installing any dependency.
- Do not add Redux, Zustand, another state library, or an animation library
  without approval.
​
## 15. Security and Privacy
​
- Never commit `.env` files, tokens, or keys.
- The frontend may contain only public `VITE_` configuration and the Supabase
  anonymous key.
- Keep the Supabase service-role key and Mailgun key exclusively on the
  backend.
- Do not print secrets in logs, screenshots, chat messages, or error responses.
- Validate and normalise all checkout inputs.
- Apply Supabase Row Level Security where the frontend can access data.
- Enforce order ownership again in the backend.
- Avoid collecting information that is not needed for fulfilment.
- Do not place customer addresses, phone numbers, or order details in analytics
  or WhatsApp query strings.
​
## 16. Accessibility and Responsive Behaviour
​
- Support mobile, tablet, and desktop layouts.
- Use semantic headings, landmarks, labels, and buttons.
- Ensure all interactive controls work with a keyboard.
- Display visible focus states.
- Provide meaningful alternative text for product images.
- Maintain readable colour contrast.
- Announce significant cart and form feedback accessibly.
- Do not rely on colour alone to communicate status.
- Respect reduced-motion preferences.
​
## 17. Performance and Reliability
​
- Optimise and responsively serve product imagery.
- Lazy-load below-the-fold images without delaying the hero image.
- Avoid unnecessary frontend dependencies.
- Prevent layout shifts by reserving image dimensions.
- Keep the application functional on typical Nigerian mobile connections.
- Provide retryable error states for product and order requests.
- Prevent accidental duplicate orders.
- Keep the application building after each implementation step.
​
## 18. Analytics and SEO
​
For v1:
​
- Use unique page titles and descriptions.
- Add basic Open Graph metadata.
- Use meaningful product URLs.
- Add a favicon and owner-approved social preview image.
- Do not install behavioural analytics without owner approval and a privacy
  decision.
​
Structured product data and analytics may be considered after launch.
​
## 19. Testing and Acceptance
​
### Required end-to-end checks
​
- Browse from homepage to shop and product details.
- Add products with different sizes to the cart.
- Refresh and confirm that the local cart remains.
- Update quantities and remove items.
- Sign in with Google and return to checkout with the cart intact.
- Submit a valid order and receive a unique reference.
- Confirm the order and line items exist in Supabase.
- Confirm prices match database values rather than browser-supplied values.
- Receive a correctly formatted Mailgun email.
- Sign out, sign in again, and see the order under Orders.
- Attempt to access another user's order and confirm access is denied.
- Change a product price before checkout and confirm the server uses the new
  price.
- Attempt checkout with an invalid product or size and confirm rejection.
- Test loading, empty, validation, network-error, and email-failure states.
- Test keyboard navigation, reduced motion, and common mobile widths.
- Run `npm run build` successfully before deployment.
​
## 20. Delivery Plan
​
### Phase 0 — Requirements and setup
​
- Obtain owner-approved content and assets.
- Confirm the v1 ordering and delivery process.
- Confirm service accounts and who pays future recurring costs.
- Create the repository and protect secrets.
- Verify a clean React/Vite/Tailwind 3.4 build before UI work.
​
### Phase 1 — Design foundation
​
- Review the complete `design/` folder.
- Implement global typography, colours, layout primitives, navbar, and hero.
- Build homepage sections one at a time.
​
### Phase 2 — Catalogue and cart
​
- Create the product data model and initial real products.
- Build Shop and Product Details.
- Build and persist the local cart.
​
### Phase 3 — Authentication and checkout
​
- Configure Supabase Google authentication.
- Build the checkout form and authenticated route behaviour.
- Implement FastAPI token verification and server-side order calculation.
- Save orders and order items.
​
### Phase 4 — Email and order history
​
- Configure Mailgun.
- Send and test order confirmations.
- Build protected order history.
​
### Phase 5 — QA and HNG delivery
​
- Complete acceptance tests.
- Fix critical defects.
- Deploy frontend and backend.
- Demonstrate required HNG flows by 2 October 2026.
​
### Phase 6 — Owner review and production continuation
​
- Collect structured feedback from the owner.
- Replace remaining placeholders.
- Apply agreed revisions.
- Agree on domain, operating costs, maintenance, and launch timing.
​
## 21. Owner Inputs Required
​
The following must be supplied or approved before final launch:
​
- [ ] Correct brand spelling and capitalisation
- [ ] Logo files
- [ ] Brand colours and fonts, if established
- [ ] Tagline
- [ ] Business description and brand story
- [ ] Product names and descriptions
- [ ] Product categories
- [ ] Current prices
- [ ] Available sizes
- [ ] Availability/stock approach
- [ ] High-quality product and lifestyle photographs
- [ ] Featured products and collections
- [ ] Real customer reviews with permission to publish
- [ ] Phone and WhatsApp number
- [ ] Business email
- [ ] Delivery locations, fees, and estimated timing
- [ ] Collection/pickup options
- [ ] Order-confirmation and fulfilment process
- [ ] Cancellation, exchange, and return policy
- [ ] Instagram and any other social links
- [ ] Domain preference
- [ ] Approval of recurring third-party costs
​
## 22. Open Decisions
​
These decisions block final production behaviour but do not prevent initial
development with clearly marked placeholders:
​
1. Is the approved public name “ADE Foot Wear,” “ADE Footwear,” or another
   spelling?
2. Are products ready-made, made-to-order, or both?
3. Which customer groups and product categories are served?
4. How will product availability and sizes be maintained?
5. What event makes an order accepted: website submission or later owner
   confirmation?
6. Which checkout fields are genuinely necessary?
7. How are delivery fees calculated, and can they be known at checkout?
8. Should the confirmation email describe the order as “received,” “pending,”
   or “confirmed”?
9. Who receives internal order notifications?
10. Which order statuses should customers see?
11. Should customers also be directed to WhatsApp after checkout?
12. Who will maintain products and orders after handover?
13. Which party will own and pay for the domain and paid service plans?
​
## 23. Change Control
​
- New requests must be classified as a clarification, replacement, defect, or
  new feature.
- Defects and necessary clarifications within this PRD remain in scope.
- New features enter a later version unless they replace an existing
  requirement without increasing effort.
- Material changes to authentication, payments, inventory, administration, or
  fulfilment require an explicit scope review.
- Because development is free, the project does not include unlimited revisions
  or indefinite maintenance.
​
## 24. Definition of Done
​
v1 is done when:
​
- All required routes and flows operate in the deployed environment.
- The required HNG authentication, database, email, persistence, and
  order-history tests pass.
- No production secrets are exposed.
- No unapproved claims or invented business content remain.
- Critical accessibility and responsive-layout checks pass.
- The owner has reviewed the site and approved the public content.
- Known limitations and maintenance instructions are documented.
​