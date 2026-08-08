function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatStatus(status) {
  return String(status || "pending")
    .replace(/_/g, " ")
    .toLowerCase();
}

function orderItemsHtml(items = []) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #f1d6df;">
            ${item.name}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #f1d6df; text-align:center;">
            ${item.qty}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #f1d6df; text-align:right;">
            ${formatMoney(Number(item.price) * Number(item.qty))}
          </td>
        </tr>
      `
    )
    .join("");
}

function baseEmailTemplate({ title, message, content }) {
  return `
    <div style="font-family: Arial, sans-serif; background:#fff8fb; padding:30px;">
      <div style="max-width:650px; margin:auto; background:white; border-radius:18px; overflow:hidden; border:1px solid #f1d6df;">
        <div style="background:#9e4f68; color:white; padding:24px;">
          <h1 style="margin:0; font-size:24px;">Brow Beauty Hub</h1>
          <p style="margin:6px 0 0;">${title}</p>
        </div>

        <div style="padding:28px; color:#2c2026;">
          <p style="font-size:16px; line-height:1.7;">${message}</p>
          ${content || ""}

          <p style="margin-top:28px; font-size:14px; color:#75656b;">
            Thank you,<br/>
            Brow Beauty Hub Team
          </p>
        </div>
      </div>
    </div>
  `;
}

function orderReceivedTemplate(order) {
  const message = `
    Hello ${order.customer.firstName}, your order <strong>${order.orderNumber}</strong>
    has been received successfully.
  `;

  const content = `
    <h2 style="font-size:18px;">Order Summary</h2>

    <table style="width:100%; border-collapse:collapse; margin-top:12px;">
      <thead>
        <tr style="background:#fff0f5;">
          <th style="padding:10px; text-align:left;">Product</th>
          <th style="padding:10px; text-align:center;">Qty</th>
          <th style="padding:10px; text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${orderItemsHtml(order.items)}
      </tbody>
    </table>

    <p style="text-align:right; font-size:18px; margin-top:18px;">
      <strong>Total: ${formatMoney(order.total)}</strong>
    </p>
  `;

  return {
    subject: `Order Received - ${order.orderNumber}`,
    html: baseEmailTemplate({
      title: "Order Confirmation",
      message,
      content,
    }),
  };
}

function orderStatusTemplate(order) {
  const status = formatStatus(order.status);

  const message = `
    Hello ${order.customer.firstName}, your order <strong>${order.orderNumber}</strong>
    has been updated to <strong>${status}</strong>.
  `;

  const content = `
    <p style="background:#fff0f5; padding:14px 18px; border-radius:12px;">
      Current status: <strong>${status}</strong>
    </p>
  `;

  return {
    subject: `Order Status Updated - ${order.orderNumber}`,
    html: baseEmailTemplate({
      title: "Order Status Update",
      message,
      content,
    }),
  };
}

module.exports = {
  orderReceivedTemplate,
  orderStatusTemplate,
};
