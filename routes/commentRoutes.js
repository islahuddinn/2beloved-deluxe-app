const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const commentController = require("../controllers/commentController");
const router = express.Router();
router.post(
  "/create/:id",
  authController.protect,
  authController.restrictTo("user"),
  commentController.createComment
);
router.get("/", commentController.getallComment);

router.get("/post", authController.protect, commentController.getPostComments);
router
  .route("/:id")
  .get(commentController.getOneComment)
  .patch(
    authController.protect,
    authController.restrictTo("user", "admin"),
    commentController.updateComment
  )
  .delete(
    authController.protect,
    authController.restrictTo("user", "admin"),
    commentController.deleteComment
  );

module.exports = router;
