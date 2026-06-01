import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  preheader: string;
  title: string;
  intro: string;
  content: string;
  action?: { label: string; href: string };
};

type OrderItem = {
  cantidad: number;
  precio: unknown;
  producto?: { nombre?: string; marca?: string };
};

type Customer = {
  nombre?: string | null;
  apellido?: string | null;
  email: string;
};

const brand = {
  blue: "#0B2C5F",
  red: "#D71920",
  yellow: "#FACC15",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f8fafc",
};

function money(value: unknown) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

function getTransporter() {
  const host = process.env.SMTP_SERVER;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.EMAIL_ADDRESS;
  const pass = process.env.EMAIL_PASSWORD;

  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}

function renderLayout(payload: MailPayload) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${payload.subject}</title>
      </head>
      <body style="margin:0;background:${brand.bg};font-family:Arial,Helvetica,sans-serif;color:${brand.text};">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${payload.preheader}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid ${brand.border};border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="background:${brand.blue};padding:24px 28px;color:#ffffff;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${brand.yellow};">La Casa del Computador</div>
                    <div style="font-size:26px;font-weight:900;margin-top:8px;line-height:1.15;">${payload.title}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:${brand.text};">${payload.intro}</p>
                    ${payload.content}
                    ${payload.action ? `
                      <div style="margin-top:26px;">
                        <a href="${payload.action.href}" style="display:inline-block;background:${brand.red};color:#ffffff;text-decoration:none;font-weight:800;padding:13px 18px;border-radius:8px;">${payload.action.label}</a>
                      </div>
                    ` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="background:#f3f4f6;padding:18px 28px;color:${brand.muted};font-size:12px;line-height:1.5;">
                    Este correo fue generado automáticamente. Para soporte escríbenos a info@lacasadelcomputador.ec.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function detailRows(rows: Array<[string, string]>) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${brand.border};border-radius:10px;overflow:hidden;margin:18px 0;">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid ${brand.border};background:#f9fafb;color:${brand.muted};font-size:13px;width:38%;">${label}</td>
          <td style="padding:12px 14px;border-bottom:1px solid ${brand.border};font-weight:700;font-size:13px;">${value}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function itemsTable(items: OrderItem[]) {
  if (!items.length) return "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr>
          <th align="left" style="padding:10px;border-bottom:2px solid ${brand.blue};font-size:12px;color:${brand.blue};">Producto</th>
          <th align="center" style="padding:10px;border-bottom:2px solid ${brand.blue};font-size:12px;color:${brand.blue};">Cant.</th>
          <th align="right" style="padding:10px;border-bottom:2px solid ${brand.blue};font-size:12px;color:${brand.blue};">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid ${brand.border};font-size:13px;">
              <strong>${item.producto?.nombre || "Producto"}</strong><br />
              <span style="color:${brand.muted};">${item.producto?.marca || ""}</span>
            </td>
            <td align="center" style="padding:10px;border-bottom:1px solid ${brand.border};font-size:13px;">${item.cantidad}</td>
            <td align="right" style="padding:10px;border-bottom:1px solid ${brand.border};font-size:13px;font-weight:700;">${money(Number(item.precio) * item.cantidad)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

export async function sendMail(payload: MailPayload) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("Email no enviado: configuración SMTP incompleta.");
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_SENDER || process.env.EMAIL_ADDRESS,
    to: payload.to,
    subject: payload.subject,
    html: renderLayout(payload),
  });
}

export async function sendMailSafe(payload: MailPayload) {
  try {
    await sendMail(payload);
  } catch (error) {
    console.error("Error enviando correo:", error);
  }
}

export function purchasePendingAdminEmail(input: {
  compraId: string;
  cliente: Customer;
  total: unknown;
  comprobantePath?: string;
}) {
  return {
    to: process.env.MAIL_RECIPIENT || "",
    subject: `Nueva compra por transferencia #${input.compraId.slice(-8)}`,
    preheader: "Hay un comprobante pendiente de validación en el panel admin.",
    title: "Nueva transferencia por validar",
    intro: `${input.cliente.nombre || "Un cliente"} realizó una compra por transferencia bancaria. Revisa el comprobante en el panel administrativo.`,
    content: detailRows([
      ["Compra", `#${input.compraId.slice(-8)}`],
      ["Cliente", `${input.cliente.nombre || ""} ${input.cliente.apellido || ""}`.trim()],
      ["Correo", input.cliente.email],
      ["Total", money(input.total)],
    ]),
    action: { label: "Validar comprobante", href: `${getBaseUrl()}/admin/comprobantes` },
  };
}

export function purchasePendingCustomerEmail(input: {
  compraId: string;
  cliente: Customer;
  total: unknown;
  items: OrderItem[];
}) {
  return {
    to: input.cliente.email,
    subject: `Tu compra #${input.compraId.slice(-8)} está en validación`,
    preheader: "Recibimos tu comprobante de transferencia.",
    title: "Compra en espera de validación",
    intro: `Hola ${input.cliente.nombre || ""}, recibimos tu compra y el comprobante de transferencia. Tu pedido se creará cuando el comprobante sea aprobado.`,
    content: `
      ${detailRows([
        ["Compra", `#${input.compraId.slice(-8)}`],
        ["Estado", "Pendiente de validación de comprobante"],
        ["Total", money(input.total)],
      ])}
      ${itemsTable(input.items)}
    `,
  };
}

export function receiptApprovedEmail(input: {
  pedidoId?: string;
  compraId: string;
  cliente: Customer;
  total: unknown;
}) {
  return {
    to: input.cliente.email,
    subject: `Comprobante aprobado #${input.compraId.slice(-8)}`,
    preheader: "Tu comprobante fue aprobado y tu pedido está pendiente de envío.",
    title: "Comprobante aprobado",
    intro: `Hola ${input.cliente.nombre || ""}, aprobamos tu comprobante. Tu pedido está pendiente de envío y te avisaremos cuando sea entregado.`,
    content: detailRows([
      ["Compra", `#${input.compraId.slice(-8)}`],
      ["Pedido", input.pedidoId ? `#${input.pedidoId.slice(-8)}` : "Creado"],
      ["Estado del pedido", "Pendiente de envío"],
      ["Total", money(input.total)],
    ]),
    action: { label: "Ver mis pedidos", href: `${getBaseUrl().replace(":3001", ":5173")}/mi-cuenta/pedidos` },
  };
}

export function receiptRejectedEmail(input: {
  compraId: string;
  cliente: Customer;
  total: unknown;
  motivo: string;
}) {
  return {
    to: input.cliente.email,
    subject: `Comprobante rechazado #${input.compraId.slice(-8)}`,
    preheader: "Tu comprobante de transferencia fue rechazado.",
    title: "Comprobante rechazado",
    intro: `Hola ${input.cliente.nombre || ""}, revisamos tu comprobante y no pudimos aprobarlo.`,
    content: detailRows([
      ["Compra", `#${input.compraId.slice(-8)}`],
      ["Estado", "Comprobante rechazado"],
      ["Motivo", input.motivo],
      ["Total", money(input.total)],
    ]),
    action: { label: "Contáctanos por WhatsApp", href: "https://wa.me/593989955400" },
  };
}

export function orderDeliveredEmail(input: {
  pedidoId: string;
  cliente: Customer;
  total: unknown;
}) {
  return {
    to: input.cliente.email,
    subject: `Tu pedido #${input.pedidoId.slice(-8)} fue entregado`,
    preheader: "Gracias por comprar en La Casa del Computador.",
    title: "Pedido entregado",
    intro: `Hola ${input.cliente.nombre || ""}, tu pedido fue marcado como entregado. Gracias por confiar en La Casa del Computador.`,
    content: detailRows([
      ["Pedido", `#${input.pedidoId.slice(-8)}`],
      ["Estado", "Entregado"],
      ["Total", money(input.total)],
    ]),
    action: { label: "Volver a comprar", href: `${getBaseUrl().replace(":3001", ":5173")}/tienda` },
  };
}
