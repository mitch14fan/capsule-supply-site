import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const ORDER_MINIMUM = 12_000;

const orderSchema = z.object({
  contact: z.object({
    businessName: z.string().min(2),
    contactName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(5),
  }),
  logistics: z.object({
    city: z.string().min(2),
    region: z.string().min(2),
    timeline: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    heardFrom: z.string().optional().nullable(),
  }),
  items: z
    .array(
      z.object({
        sku: z.string(),
        name: z.string(),
        cases: z.number().int().positive(),
        casePrice: z.number().positive(),
        lineTotal: z.number().positive(),
      })
    )
    .min(1),
  subtotal: z.number().positive(),
  minimumAcknowledged: z.boolean(),
});

const resendApiKey = process.env.RESEND_API_KEY;
const recipient = process.env.ORDER_NOTIFICATION_EMAIL;
const fromAddress = process.env.ORDER_FROM_EMAIL?.trim() || "Capsule Supply <onboarding@resend.dev>";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  if (!parsed.data.minimumAcknowledged) {
    return NextResponse.json({ error: "Please acknowledge the order minimum." }, { status: 400 });
  }

  if (parsed.data.subtotal < ORDER_MINIMUM) {
    return NextResponse.json({ error: "Order total is below the $12k minimum." }, { status: 400 });
  }

  if (!resendApiKey || !recipient) {
    return NextResponse.json(
      {
        error: "Email notifications are not configured. Set RESEND_API_KEY and ORDER_NOTIFICATION_EMAIL.",
      },
      { status: 500 }
    );
  }

  const resend = new Resend(resendApiKey);

  const { contact, logistics, items, subtotal } = parsed.data;
  const subject = `New capsule order request · ${contact.businessName}`;

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">${item.sku}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.cases}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">$${item.casePrice.toFixed(2)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">$${item.lineTotal.toFixed(2)}</td>
        </tr>
      `
    )
    .join("\n");

  const html = `
    <h2 style="font-family:Inter,Arial,sans-serif;">New order request</h2>
    <p><strong>Business:</strong> ${contact.businessName}</p>
    <p><strong>Contact:</strong> ${contact.contactName} · ${contact.phone} · ${contact.email}</p>
    <p><strong>Ship to:</strong> ${logistics.city}, ${logistics.region}</p>
    ${logistics.timeline ? `<p><strong>Timeline:</strong> ${logistics.timeline}</p>` : ""}
    ${logistics.heardFrom ? `<p><strong>Referral:</strong> ${logistics.heardFrom}</p>` : ""}
    ${logistics.notes ? `<p><strong>Notes:</strong> ${logistics.notes}</p>` : ""}

    <table style="border-collapse:collapse;width:100%;margin-top:24px;">
      <thead>
        <tr style="background:#f7f7f9;text-align:left;">
          <th style="padding:8px 12px;">SKU</th>
          <th style="padding:8px 12px;">Product</th>
          <th style="padding:8px 12px;">Cases</th>
          <th style="padding:8px 12px;">Case</th>
          <th style="padding:8px 12px;">Line total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p style="margin-top:16px;font-size:18px;font-weight:600;">Subtotal: $${subtotal.toFixed(2)}</p>
  `;

  await resend.emails.send({
    from: fromAddress,
    to: recipient.split(",").map((email) => email.trim()),
    subject,
    html,
  });

  return NextResponse.json({ ok: true });
}
