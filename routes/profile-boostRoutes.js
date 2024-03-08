const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const boostController = require("../controllers/profile-boostController");
const router = express.Router();

router.post("/create", authController.protect, boostController.boostProfile);

router.get("/", boostController.getallBoostedProfiles);
router.get("/", boostController.getBoostedProfileStatus);
router
  .route("/:id")
  .get(boostController.getOneBoostedProfile)
  .patch(authController.protect, boostController.cancelProfileBoost);

module.exports = router;
