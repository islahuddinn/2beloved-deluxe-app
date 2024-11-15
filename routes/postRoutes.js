const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const postController = require("../controllers/postController");
const router = express.Router();
router.post(
  "/create",
  authController.protect,
  authController.restrictTo("user"),
  postController.createPost
);

router.post(
  "/create/admin",
  authController.protect,
  authController.restrictTo("admin"),
  postController.createPostAdmin
);

router.patch(
  "/hide/:id",
  authController.protect,
  authController.restrictTo("user"),
  postController.hidePost
);

// router.route("/:id").get(postController.getAllPosts);
router.get("/get-posts/:id", authController.protect, postController.getAllPosts);
router.get('/get-all-posts', authController.protect, postController.getAllPostsAdmin)
//router.get("/", postController.getallPost);
router.get("/nearby", authController.protect, postController.nearbyPosts);
router.get("/explore", authController.protect, postController.explorePosts);
router.get("/search-posts", authController.protect, postController.searchPosts);
router
  .route("/user/:id")
  .get(authController.protect, postController.getUserposts);
router
  .route("/:id")
  .get(authController.protect, postController.getOnePost)
  .patch(
    authController.protect,
    authController.restrictTo("user", "admin"),
    postController.updatePost
  )
  .delete(
    authController.protect,
    authController.restrictTo("user", "admin"),
    postController.deletePost
  );

module.exports = router;
