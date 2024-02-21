const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const likeController = require("../controllers/likeController");
const router = express.Router();

router.get("/", likeController.getallLike);
router
  .route("/:id")
  .post(
    authController.protect,
    authController.restrictTo("user"),
    likeController.like
  )
  .get(likeController.getOneLike)
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    likeController.updateLike
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    likeController.deleteLike
  );

module.exports = router;
