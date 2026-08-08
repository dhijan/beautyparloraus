const express = require("express");
const {
  getDayView,
  getRequests,
  getBookingDetail,
  updateBooking,
  createWalkIn,
  getClients,
  getClient,
  addClientNote,
  getRoster,
  updateStaffHours,
  getMenu,
  updateTreatment,
  getBlocks,
  createBlock,
  deleteBlock,
  getReports,
  getStudios,
} = require("../controllers/studioController");
const {
  getInventory,
  adjustStock,
  setPar,
  createOrder,
  receiveOrder,
  cancelOrder,
} = require("../controllers/inventoryController");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Every studio-console route is staff-only.
router.use(adminAuth);

router.get("/context", getStudios);
router.get("/day", getDayView);
router.get("/requests", getRequests);

router.post("/bookings", createWalkIn);
router.get("/bookings/:ref", getBookingDetail);
router.patch("/bookings/:ref", updateBooking);

router.get("/clients", getClients);
router.get("/clients/:phone", getClient);
router.post("/clients/:phone/notes", addClientNote);

router.get("/roster", getRoster);
router.patch("/staff/:id", updateStaffHours);

router.get("/treatments", getMenu);
router.patch("/treatments/:number", updateTreatment);

router.get("/blocks", getBlocks);
router.post("/blocks", createBlock);
router.delete("/blocks/:id", deleteBlock);

router.get("/reports", getReports);

router.get("/inventory", getInventory);
router.post("/inventory/orders/:id/receive", receiveOrder);
router.delete("/inventory/orders/:id", cancelOrder);
router.post("/inventory/:id/move", adjustStock);
router.post("/inventory/:id/order", createOrder);
router.patch("/inventory/:id", setPar);

module.exports = router;
