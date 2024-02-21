const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const saveController = require("../controllers/saveController");
const router = express.Router();

router.get("/", authController.protect, saveController.getallSave);
router
  .route("/:id")
  .post(
    authController.protect,
    authController.restrictTo("user"),
    saveController.save
  )
  .get(saveController.getOneSave)
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    saveController.updateSave
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    saveController.deleteSave
  );

module.exports = router;
