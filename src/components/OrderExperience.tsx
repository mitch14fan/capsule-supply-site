"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

import type { OrderItem, Product } from "@/types";

const ORDER_MINIMUM = 12_000;
const DEFAULT_VISIBLE = 60;

const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone number required"),
  city: z.string().min(2, "City required"),
  region: z.string().min(2, "State / region required"),
  timeline: z.string().optional(),
  notes: z.string().optional(),
  heardFrom: z.string().optional(),
  acceptedMinimum: z.boolean().refine((val) => val, "Please acknowledge the $12k minimum order."),
});

const initialFormState = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  region: "",
  timeline: "",
  notes: "",
  heardFrom: "",
  acceptedMinimum: false,
};

type Props = {
  products: Product[];
  categories: string[];
};

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
};

export function OrderExperience({ products, categories }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [capsuleFilter, setCapsuleFilter] = useState("all");
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem>>({});
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE);
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });

  const capsuleOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      product.capsuleTypes
        .split("/")
        .map((token) => token.trim())
        .filter(Boolean)
        .forEach((token) => set.add(token));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = [product.sku, product.name, product.remarks]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesCategory = category === "all" || product.category === category;

      const matchesCapsule =
        capsuleFilter === "all" || product.capsuleTypes.split("/").map((token) => token.trim()).includes(capsuleFilter);

      return matchesQuery && matchesCategory && matchesCapsule;
    });
  }, [products, query, category, capsuleFilter]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const orderList = Object.values(orderItems);
  const subtotal = orderList.reduce((acc, item) => acc + item.cases * item.product.casePrice, 0);
  const meetsMinimum = subtotal >= ORDER_MINIMUM;
  const shortage = Math.max(0, ORDER_MINIMUM - subtotal);

  const resetStatus = () => setStatus({ type: "idle" });

  const handleAdd = (product: Product, casesToAdd: number) => {
    if (!casesToAdd || casesToAdd < 1) return;
    resetStatus();
    setOrderItems((prev) => {
      const existing = prev[product.sku];
      const nextCases = (existing?.cases ?? 0) + casesToAdd;
      return {
        ...prev,
        [product.sku]: {
          product,
          cases: nextCases,
        },
      };
    });
  };

  const handleUpdate = (sku: string, value: number) => {
    if (value < 1 || Number.isNaN(value)) return;
    resetStatus();
    setOrderItems((prev) => ({
      ...prev,
      [sku]: {
        product: prev[sku].product,
        cases: value,
      },
    }));
  };

  const handleRemove = (sku: string) => {
    resetStatus();
    setOrderItems((prev) => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value, type } = target;
    const nextValue = target instanceof HTMLInputElement && type === "checkbox" ? target.checked : value;

    setFormState((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();

    if (!orderList.length) {
      setStatus({ type: "error", message: "Add at least one case to your order before submitting." });
      return;
    }

    if (!meetsMinimum) {
      setStatus({
        type: "error",
        message: `You still need $${shortage.toLocaleString()} to meet the $${ORDER_MINIMUM.toLocaleString()} minimum order.`,
      });
      return;
    }

    const parsed = formSchema.safeParse(formState);
    if (!parsed.success) {
      setStatus({ type: "error", message: parsed.error.issues[0]?.message ?? "Double-check the form." });
      return;
    }

    setStatus({ type: "loading", message: "Sending your order request..." });

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: {
            businessName: formState.businessName,
            contactName: formState.contactName,
            email: formState.email,
            phone: formState.phone,
          },
          logistics: {
            city: formState.city,
            region: formState.region,
            timeline: formState.timeline,
            notes: formState.notes,
            heardFrom: formState.heardFrom,
          },
          items: orderList.map((item) => ({
            sku: item.product.sku,
            name: item.product.name,
            cases: item.cases,
            casePrice: item.product.casePrice,
            lineTotal: item.cases * item.product.casePrice,
          })),
          subtotal,
          minimumAcknowledged: formState.acceptedMinimum,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Unable to send order. Try again.");
      }

      setStatus({ type: "success", message: "Request sent! Watch your inbox for the invoice follow-up." });
      setOrderItems({});
      setFormState(initialFormState);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unexpected error. Please try again.",
      });
    }
  };

  const orderTotalLabel = `$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className="section-shell p-6 sm:p-10 space-y-10">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white">Build your order</h2>
          <p className="mt-2 text-base text-white/70">
            Search the catalog, add full cases, and submit an order request in minutes. We review every request before
            invoicing to confirm stock and transit times.
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-sm uppercase tracking-wide text-white/60">Order minimum</p>
          <p className="text-3xl font-semibold text-brand-primary">${ORDER_MINIMUM.toLocaleString()}</p>
          <p className="text-sm text-white/70">Per order (after markup) · 250 capsules per case</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-white/80">
          Search products
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(DEFAULT_VISIBLE);
            }}
            placeholder="Search by SKU, name, or note"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-brand-primary focus:ring-brand-primary"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/80">
          Capsule category
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setVisibleCount(DEFAULT_VISIBLE);
            }}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white focus:border-brand-primary focus:ring-brand-primary"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-white/80">
          Capsule fit
          <select
            value={capsuleFilter}
            onChange={(event) => {
              setCapsuleFilter(event.target.value);
              setVisibleCount(DEFAULT_VISIBLE);
            }}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white focus:border-brand-primary focus:ring-brand-primary"
          >
            <option value="all">All capsule sizes</option>
            {capsuleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white font-semibold">
              Showing {visibleProducts.length} of {filteredProducts.length} products
            </p>
            {query && (
              <p className="text-sm text-white/60">Filtered by “{query}”</p>
            )}
          </div>
          {filteredProducts.length > visibleCount && (
            <button
              type="button"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-brand-primary"
              onClick={() => setVisibleCount((count) => count + DEFAULT_VISIBLE)}
            >
              Load {Math.min(DEFAULT_VISIBLE, filteredProducts.length - visibleCount)} more
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.sku} product={product} onAdd={handleAdd} />
          ))}
        </div>

        {!visibleProducts.length && (
          <p className="text-white/70">No products match your filters yet. Try clearing one of the filters.</p>
        )}
      </div>

      <OrderSummary
        items={orderList}
        meetsMinimum={meetsMinimum}
        shortage={shortage}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
        displayTotal={orderTotalLabel}
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Business name" required>
            <input
              name="businessName"
              value={formState.businessName}
              onChange={handleFormChange}
              className="input"
              placeholder="e.g., Pacific Capsule Routes"
            />
          </Field>
          <Field label="Contact name" required>
            <input
              name="contactName"
              value={formState.contactName}
              onChange={handleFormChange}
              className="input"
              placeholder="Full name"
            />
          </Field>
          <Field label="Email" required>
            <input name="email" type="email" value={formState.email} onChange={handleFormChange} className="input" />
          </Field>
          <Field label="Phone" required>
            <input name="phone" value={formState.phone} onChange={handleFormChange} className="input" placeholder="(555) 123-4567" />
          </Field>
          <Field label="Shipping city" required>
            <input name="city" value={formState.city} onChange={handleFormChange} className="input" placeholder="City" />
          </Field>
          <Field label="State / region" required>
            <input name="region" value={formState.region} onChange={handleFormChange} className="input" placeholder="State or region" />
          </Field>
          <Field label="Delivery window">
            <input
              name="timeline"
              value={formState.timeline}
              onChange={handleFormChange}
              className="input"
              placeholder="e.g., Need on route by May 10"
            />
          </Field>
          <Field label="How did you hear about us?">
            <input
              name="heardFrom"
              value={formState.heardFrom}
              onChange={handleFormChange}
              className="input"
              placeholder="Referral, show, etc."
            />
          </Field>
        </div>
        <Field label="Notes or special instructions">
          <textarea
            name="notes"
            value={formState.notes}
            onChange={handleFormChange}
            rows={4}
            className="input resize-none"
            placeholder="Share route details, capsule mix preferences, FOB info, etc."
          />
        </Field>

        <label className="flex items-start gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            name="acceptedMinimum"
            checked={formState.acceptedMinimum}
            onChange={handleFormChange}
            className="mt-1 rounded border-white/20 bg-black/40 text-brand-primary focus:ring-brand-primary"
          />
          <span>
            I understand Capsule Supply Co. invoices in USD, sells full cases of 250 capsules, and enforces a
            ${ORDER_MINIMUM.toLocaleString()} order minimum.
          </span>
        </label>

        {status.type !== "idle" && (
          <p
            className={`text-sm ${
              status.type === "success" ? "text-emerald-400" : status.type === "error" ? "text-red-400" : "text-white/70"
            }`}
          >
            {status.message}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-primary px-4 py-4 text-lg font-semibold text-black shadow-glow transition hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:opacity-70"
          disabled={status.type === "loading"}
        >
          {status.type === "loading" ? "Sending order request..." : `Submit order request (${orderTotalLabel})`}
        </button>
      </form>
    </section>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({ label, required, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span>
        {label}
        {required && <span className="text-brand-primary">*</span>}
      </span>
      {children}
    </label>
  );
}

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product, cases: number) => void;
};

function ProductCard({ product, onAdd }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAdd(product, quantity);
    setQuantity(1);
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/50">{product.category}</p>
          <h3 className="text-xl font-semibold text-white">{product.name}</h3>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80">{product.sku}</span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm text-white/70">
        <div>
          <dt className="text-white/50">Case price</dt>
          <dd className="text-lg font-semibold text-brand-primary">
            ${product.casePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </dd>
        </div>
        <div>
          <dt className="text-white/50">MOQ</dt>
          <dd>{product.moqCases ? `${product.moqCases} cases (${product.moqUnits?.toLocaleString()} pcs)` : "Factory MOQ applies"}</dd>
        </div>
        <div>
          <dt className="text-white/50">Capsule fit</dt>
          <dd>{product.capsuleTypes || "—"}</dd>
        </div>
        <div>
          <dt className="text-white/50">Models / colors</dt>
          <dd>
            {[product.varieties.models, product.varieties.colors].filter(Boolean).join(" · ") || "Assorted"}
          </dd>
        </div>
      </dl>

      {product.remarks && <p className="text-sm text-white/70">{product.remarks}</p>}

      <form className="flex items-center gap-3" onSubmit={handleSubmit}>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            setQuantity(Number.isNaN(nextValue) ? 1 : nextValue);
          }}
          className="w-20 rounded-2xl border border-white/15 bg-black/30 px-3 py-2 text-center text-white"
        />
        <button
          type="submit"
          className="flex-1 rounded-2xl bg-white/10 px-3 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary hover:text-black"
        >
          Add to order
        </button>
      </form>
    </div>
  );
}

type OrderSummaryProps = {
  items: OrderItem[];
  meetsMinimum: boolean;
  shortage: number;
  onUpdate: (sku: string, value: number) => void;
  onRemove: (sku: string) => void;
  displayTotal: string;
};

function OrderSummary({ items, meetsMinimum, shortage, onUpdate, onRemove, displayTotal }: OrderSummaryProps) {
  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-white/50">Order summary</p>
          <p className="text-2xl font-semibold text-white">{displayTotal}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${meetsMinimum ? "text-emerald-400" : "text-amber-400"}`}>
            {meetsMinimum ? "Minimum met" : `Need $${shortage.toLocaleString(undefined, { maximumFractionDigits: 0 })} more`}
          </p>
          <p className="text-xs text-white/60">$12k minimum order</p>
        </div>
      </div>

      {!items.length ? (
        <p className="text-white/70">No cases added yet. Use the catalog above to add products.</p>
      ) : (
        <div className="overflow-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm text-white/80">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Cases</th>
                <th className="px-4 py-3">Case price</th>
                <th className="px-4 py-3">Line total</th>
                <th className="px-4 py-3 sr-only">Remove</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.product.sku} className="border-t border-white/5">
                  <td className="px-4 py-3 font-semibold text-white">{item.product.sku}</td>
                  <td className="px-4 py-3">{item.product.name}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      value={item.cases}
                      onChange={(event) => onUpdate(item.product.sku, Number(event.target.value))}
                      className="w-20 rounded-xl border border-white/15 bg-black/30 px-3 py-1 text-center"
                    />
                  </td>
                  <td className="px-4 py-3">
                    ${item.product.casePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">
                    ${(item.cases * item.product.casePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(item.product.sku)}
                      className="text-white/50 transition hover:text-red-400"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
