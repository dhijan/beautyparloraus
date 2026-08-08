const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  getConfig,
  getSlots,
  createBooking,
  lookupBooking,
  getMoveSlots,
  moveBooking,
  cancelBooking,
} = require("../controllers/bookingController");

const router = express.Router();

// Writing is far cheaper to abuse than reading: a script could otherwise hold
// every chair in the diary, or brute-force reference codes to cancel them.
const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  message: { error: "Too many booking changes. Please call the studio." },
});

router.get("/config", getConfig);
router.get("/slots", getSlots);
router.post("/", writeLimiter, createBooking);

// The reference code is the guest's only credential — there are no accounts.
router.get("/:ref", lookupBooking);
router.get("/:ref/slots", getMoveSlots);
router.patch("/:ref", writeLimiter, moveBooking);
router.delete("/:ref", writeLimiter, cancelBooking);

module.exports = router;
