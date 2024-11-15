const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const storyController = require("../controllers/storyController");
const router = express.Router();
router.post(
  "/create",
  authController.protect,
  authController.restrictTo("user"),
  storyController.createStory
);
router.get("/", storyController.getallStory);

router.get("/my", authController.protect, storyController.getMyStories);

router.patch("/view/:id", authController.protect, storyController.viewStory);

// router.get("/post", authController.protect, storyController.getPostStorys);
router
  .route("/:id")
  .get(storyController.getOneStory)
  .patch(
    authController.protect,
    authController.restrictTo("user", "admin"),
    storyController.updateStory
  )
  .delete(
    authController.protect,
    authController.restrictTo("user", "admin"),
    storyController.deleteStory
  );

module.exports = router;
