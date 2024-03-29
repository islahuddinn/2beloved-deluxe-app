const express = require("express");
const authController = require("../controllers/authController");
const alertController = require("../controllers/alertController");
const router = express.Router();

router.post(
  "/send",
  authController.protect,
  // authController.restrictTo("admin"),
  alertController.sendAlert
);

module.exports = router;
