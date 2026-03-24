import productsData from "@/data/products.json";
import { OrderExperience } from "@/components/OrderExperience";
import type { Product } from "@/types";

const products = productsData as Product[];
const categories = Array.from(new Set(products.map((product) => product.category))).sort();

const sellingPoints = [
  {
    title: "Direct-from-factory catalog",
    body: "549 capsule SKUs sourced from Panda Vending with your 2× markup already applied.",
  },
  {
    title: "$12k minimum, no surprises",
    body: "Order builder enforces your threshold, so every submission is production-ready.",
  },
  {
    title: "Cases only",
    body: "Capsules ship in 250-count cases. Mix-and-match SKUs until the minimum is met.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Browse & shortlist",
    body: "Search SKUs, filter by capsule size, and add the cases you need. The summary keeps a running subtotal.",
  },
  {
    step: "02",
    title: "Submit order request",
    body: "Drop your business + logistics info, timeline, and any packing details. We confirm MOQs + transit windows.",
  },
  {
    step: "03",
    title: "Get invoiced",
    body: "You’ll receive a formal invoice (ACH / wire) with freight options and lead times before production kicks off.",
  },
];

const faqs = [
  {
    q: "Can I order less than $12,000?",
    a: "Not at the moment. The factory requires consolidated orders, and the tooling time only pencils out at $12k+ after markup.",
  },
  {
    q: "How fast do capsules ship?",
    a: "Standard production is 20-30 days plus ocean transit. If you note a tight deadline, we’ll advise on current vessel schedules or air-freight options.",
  },
  {
    q: "Do you handle customs + freight?",
    a: "Yes. Orders are FOB China by default, but we can quote door-to-door delivery or work with your forwarder.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-night via-slate-900 to-brand-ink px-4 py-12 text-white sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-24">
        <Hero />

        <section className="grid gap-4 md:grid-cols-3">
          {sellingPoints.map((point) => (
            <article key={point.title} className="glass-panel p-6">
              <h3 className="text-xl font-semibold">{point.title}</h3>
              <p className="mt-2 text-sm text-white/70">{point.body}</p>
            </article>
          ))}
        </section>

        <OrderExperience products={products} categories={categories} />

        <section className="grid gap-6 lg:grid-cols-3">
          {howItWorks.map((item) => (
            <article key={item.title} className="section-shell p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-white/40">{item.step}</p>
              <h3 className="mt-3 text-2xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-white/70">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="section-shell p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.q} className="glass-panel bg-black/30 p-6">
                <h4 className="text-lg font-semibold">{faq.q}</h4>
                <p className="mt-2 text-sm text-white/70">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-panel flex flex-col gap-6 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Ready when you are</p>
          <h3 className="text-3xl font-semibold">Need custom mixes or blind-bag projects?</h3>
          <p className="text-white/70">
            Mention it in the notes field when you submit an order request. We can quote specialty packaging, blind assortments,
            and private-label plush drops in the same workflow.
          </p>
          <a
            className="mx-auto rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-brand-primary hover:bg-brand-primary hover:text-black"
            href="#"
          >
            Get in touch
          </a>
        </section>
      </div>
    </main>
  );
}

function Hero() {
  return (
    <section className="section-shell p-8 sm:p-12">
      <p className="text-sm uppercase tracking-[0.3em] text-white/50">Capsule Supply Co.</p>
      <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
        Bulk capsule refills, priced per case, ready for your routes.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-white/70">
        Transparent pricing, factory-direct catalog, and an order form built for operators. Add cases, hit the $12k minimum,
        and get invoiced without a back-and-forth email chain.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="rounded-2xl border border-white/10 px-6 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Minimum order</p>
          <p className="text-3xl font-semibold text-brand-primary">$12K</p>
          <p className="text-xs text-white/60">250-unit cases · 100% markup included</p>
        </div>
        <div className="rounded-2xl border border-white/10 px-6 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Catalog size</p>
          <p className="text-3xl font-semibold">{products.length}</p>
          <p className="text-xs text-white/60">SKUs live today</p>
        </div>
      </div>
    </section>
  );
}
