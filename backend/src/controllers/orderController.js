const pool = require("../config/db");
// Placeholder key so the server still boots when Stripe is not configured
// (local dev, CI). stripeWebhook refuses the request instead.
const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY || "sk_not_configured"
);
const { sendEmail } = require("../utils/emailService");
const {
  orderReceivedTemplate,
  orderStatusTemplate,
} = require("../utils/emailTemplates");


function generateOrderNumber() {
  return `BBH-${Date.now()}`;
}

function validateOrderPayload(body) {
  const { customer, items, subtotal, total } = body;

  if (!customer) {
    return "Customer details are required";
  }

  if (!customer.firstName || !customer.lastName || !customer.email) {
    return "Customer name and email are required";
  }

  if (!customer.address || !customer.city || !customer.postcode) {
    return "Delivery address, city, and postcode are required";
  }

  if (!Array.isArray(items) || items.length === 0) {
    return "Order must contain at least one item";
  }

  if (subtotal === undefined || total === undefined) {
    return "Subtotal and total are required";
  }

  return null;
}

async function createOrder(req, res, next) {
  const client = await pool.connect();

  try {
    const validationError = validateOrderPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    const { customer, items, subtotal, total } = req.body;
    const orderNumber = generateOrderNumber();

    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      INSERT INTO orders (
        order_number,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        postcode,
        notes,
        subtotal,
        total
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        orderNumber,
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone || null,
        customer.address,
        customer.city,
        customer.postcode,
        customer.notes || null,
        subtotal,
        total,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          price
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          order.id,
          item.id || null,
          item.name,
          item.qty,
          item.price,
        ]
      );
    }

    await client.query("COMMIT");

    const fullOrder = await getOrderWithItems(order.id);

    if (fullOrder) {
      await sendOrderReceivedEmail(fullOrder);
    }

    res.status(201).json({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      message: "Order placed successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

async function getAdminOrders(req, res, next) {
  try {
    const ordersResult = await pool.query(
      `
      SELECT *
      FROM orders
      ORDER BY created_at DESC
      `
    );

    const itemsResult = await pool.query(
      `
      SELECT *
      FROM order_items
      ORDER BY id ASC
      `
    );

    const orders = ordersResult.rows.map((order) => {
      const items = itemsResult.rows
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          id: item.product_id,
          name: item.product_name,
          qty: item.quantity,
          price: Number(item.price),
        }));

      return {
        id: order.id,
        orderNumber: order.order_number,
        customer: {
          firstName: order.first_name,
          lastName: order.last_name,
          email: order.email,
          phone: order.phone,
          address: order.address,
          city: order.city,
          postcode: order.postcode,
          notes: order.notes,
        },
        items,
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        status: order.status,
        createdAt: order.created_at,
      };
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid order status",
      });
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json({
      message: "Order status updated",
      order: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function sendOrderReceivedEmail(fullOrder) {
  const email = orderReceivedTemplate(fullOrder);

  try {
    const emailResult = await sendEmail({
      to: fullOrder.customer.email,
      subject: email.subject,
      html: email.html,
    });

    await logEmail({
      orderId: fullOrder.id,
      emailType: "order_received",
      toEmail: fullOrder.customer.email,
      subject: email.subject,
      status: "sent",
      providerMessageId: emailResult.id || emailResult.data?.id || null,
    });
  } catch (emailError) {
    await logEmail({
      orderId: fullOrder.id,
      emailType: "order_received",
      toEmail: fullOrder.customer.email,
      subject: email.subject,
      status: "failed",
      errorMessage: emailError.message,
    });

    console.error("Order confirmation email failed:", emailError.message);
  }
}

async function logEmail({
  orderId,
  emailType,
  toEmail,
  subject,
  status,
  providerMessageId,
  errorMessage,
}) {
  await pool.query(
    `
    INSERT INTO email_logs (
      order_id,
      email_type,
      to_email,
      subject,
      status,
      provider_message_id,
      error_message
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      orderId,
      emailType,
      toEmail,
      subject,
      status,
      providerMessageId || null,
      errorMessage || null,
    ]
  );
}

async function getOrderWithItems(orderId) {
  const orderResult = await pool.query(
    `
    SELECT *
    FROM orders
    WHERE id = $1
    `,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    return null;
  }

  const order = orderResult.rows[0];

  const itemsResult = await pool.query(
    `
    SELECT *
    FROM order_items
    WHERE order_id = $1
    ORDER BY id ASC
    `,
    [orderId]
  );

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    customer: {
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      postcode: order.postcode,
      notes: order.notes,
    },
    items: itemsResult.rows.map((item) => ({
      id: item.product_id,
      name: item.product_name,
      qty: item.quantity,
      price: Number(item.price),
    })),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    createdAt: order.created_at,
  };
}

async function notifyOrderStatus(req, res, next) {
  try {
    const { id } = req.params;

    const order = await getOrderWithItems(id);

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const email = orderStatusTemplate(order);

    const emailResult = await sendEmail({
      to: order.customer.email,
      subject: email.subject,
      html: email.html,
    });

    await logEmail({
      orderId: order.id,
      emailType: "order_status_update",
      toEmail: order.customer.email,
      subject: email.subject,
      status: "sent",
      providerMessageId: emailResult.id || emailResult.data?.id || null,
    });

    res.json({
      message: "Customer notified successfully",
    });
  } catch (error) {
    next(error);
  }
}

function splitName(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] || "Stripe",
    lastName: parts.slice(1).join(" ") || "Customer",
  };
}

// Stripe only sends the session; line items need a second call.
async function recordStripeOrder(session) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  });

  const details = session.customer_details || {};
  const shipping =
    session.collected_information?.shipping_details ||
    session.shipping_details ||
    {};
  const address = shipping.address || details.address || {};
  const { firstName, lastName } = splitName(shipping.name || details.name);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      INSERT INTO orders (
        order_number,
        stripe_session_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        postcode,
        subtotal,
        total,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed')
      ON CONFLICT (stripe_session_id) DO NOTHING
      RETURNING *
      `,
      [
        `BBH-${session.id.slice(-12).toUpperCase()}`,
        session.id,
        firstName,
        lastName,
        details.email || "",
        details.phone || null,
        [address.line1, address.line2].filter(Boolean).join(", ") ||
          "Not collected",
        address.city || "Not collected",
        address.postal_code || "Not collected",
        (session.amount_subtotal ?? session.amount_total ?? 0) / 100,
        (session.amount_total ?? 0) / 100,
      ]
    );

    // Stripe retries deliveries; a conflict means we already recorded this one.
    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const order = orderResult.rows[0];

    for (const item of lineItems.data) {
      // Product names in our DB match the Stripe product names (see
      // build-products.js). No match is fine — the name is still recorded.
      const match = await client.query(
        "SELECT id FROM products WHERE name = $1",
        [item.description]
      );

      const unitAmount =
        item.price?.unit_amount ??
        (item.quantity ? item.amount_total / item.quantity : item.amount_total);

      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          price
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          order.id,
          match.rows[0]?.id || null,
          item.description,
          item.quantity || 1,
          unitAmount / 100,
        ]
      );
    }

    await client.query("COMMIT");

    return getOrderWithItems(order.id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Mounted on the raw body in app.js — signature verification needs the exact
// bytes Stripe signed, so this route must sit before express.json().
async function stripeWebhook(req, res) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook hit but STRIPE_* env vars are not set");
    return res.status(503).json({ error: "Stripe is not configured" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe webhook signature rejected:", error.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  const session = event.data.object;

  if (
    event.type !== "checkout.session.completed" ||
    session.payment_status !== "paid"
  ) {
    return res.json({ received: true });
  }

  try {
    const order = await recordStripeOrder(session);

    if (order) {
      await sendOrderReceivedEmail(order);
    }
  } catch (error) {
    // 500 tells Stripe to retry, which is what a transient DB failure needs.
    console.error("Stripe webhook could not record order:", error);
    return res.status(500).json({ error: "Could not record order" });
  }

  res.json({ received: true });
}

module.exports = {
  createOrder,
  getAdminOrders,
  updateOrderStatus,
  notifyOrderStatus,
  stripeWebhook,
};