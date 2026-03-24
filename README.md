# Capsule Supply Co. — Order Portal

A single-page Next.js site that lets route operators browse your capsule-toy catalog, price cases with your 100% markup, and submit invoice requests that respect a $12,000 minimum order.

## Highlights

- **Data-driven catalog** – 549 SKUs parsed from the vendor spreadsheet with automatic 2× markup and case pricing (250 capsules per case).
- **Search + filters** – Query by SKU/name, filter by vendor category, and narrow by capsule fit.
- **Order builder** – Add full cases, edit quantities inline, and track progress toward the $12k minimum in real time.
- **Structured order form** – Capture business + logistics details, enforce the minimum, and POST to a serverless email handler.
- **Email notifications (Resend)** – Optional `/api/order` route sends order summaries to your inbox once environment variables are set.

## Tech Stack

- [Next.js 15 (App Router)](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org/)
- [Resend](https://resend.com) for transactional email (optional)
- Python + pandas for data ingestion

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Generate the product JSON (requires Python 3 + pandas)
npm run sync:data

# 3. Copy env template and add your keys
cp .env.example .env.local
# set RESEND_API_KEY and ORDER_NOTIFICATION_EMAIL inside .env.local

# 4. Run the dev server
npm run dev
# → http://localhost:3000
```

> **Python deps**: the ingestion script expects `pandas` and `openpyxl`. You can reuse the repo-level virtualenv you created earlier (`.venv`) or install them globally.

## Updating Product Data

1. Drop the latest vendor workbook into `data/raw/Toy_Vending_Supplies_USD.xlsx` (overwrite the existing file).
2. Run `npm run sync:data` to regenerate `src/data/products.json` with the 2× markup and 250-capsule case pricing.
3. Restart `npm run dev` if it was running.

## Email / Order Handling

- `/api/order` validates submissions, enforces the $12k minimum, and emails a summary via Resend.
- Configure the handler via environment variables:
  - `RESEND_API_KEY` – your API key from Resend.
  - `ORDER_NOTIFICATION_EMAIL` – comma-separated list of inboxes to notify.
  - `ORDER_FROM_EMAIL` (optional) – defaults to `Capsule Supply <onboarding@resend.dev>` until your domain is verified.
- Until the required variables are set, the API responds with a 500 so nothing gets sent accidentally.

## Deployment Notes

- The UI is fully static; only the `/api/order` route needs server execution (Vercel Edge/Node is fine).
- Remember to set `RESEND_API_KEY` and `ORDER_NOTIFICATION_EMAIL` in your production environment.
- If you prefer another email provider or CRM, replace the logic in `src/app/api/order/route.ts` but keep the schema + minimum-order guardrails.

## Next Steps / Ideas

- Add real branding assets (logo, typography tweaks, photography).
- Pipe successful requests into Airtable/HubSpot instead of email-only notifications.
- Surface inventory highlights (e.g., best sellers, seasonal mixes) near the top of the catalog.
- Add authentication if you need to hide pricing from the public web.
