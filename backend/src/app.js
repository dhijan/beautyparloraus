const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const adminRoutes = require("./routes/adminRoutes");
const homepageRoutes = require("./routes/homepageRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const studioRoutes = require("./routes/studioRoutes");

const { stripeWebhook } = require("./controllers/orderController");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

// Before express.json() and the rate limiter on purpose: Stripe signs the raw
// request bytes, and its delivery retries must not be throttled.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// FRONTEND_URL takes a comma-separated list so the built app and a local Vite
// dev server can both talk to the same API without editing this file.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
      error: "Too many requests. Please try again later.",
    },
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "Brow Beauty Hub API is running",
  });
});

app.use("/api/admin", adminRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/studio", studioRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api", orderRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
