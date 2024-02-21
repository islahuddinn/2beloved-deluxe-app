const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const followController = require("../controllers/friendController");
const router = express.Router();

router.get("/", followController.getallFollow);
router
  .route("/:id")
  .post(
    authController.protect,
    authController.restrictTo("user"),
    followController.follow
  )
  .get(followController.getOneFollow)
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    followController.updateFollow
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    followController.deleteFollow
  );

module.exports = router;
