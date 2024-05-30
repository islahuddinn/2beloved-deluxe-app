const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const friendController = require("../controllers/friendController");
const router = express.Router();





router.get('/friendlist', authController.protect, friendController.getMyFriends)
router.get('/check-friend-status/:userId',authController.protect, friendController.checkFriendStatus)
router.post('/unfriend/:friendId', authController.protect, friendController.unfriend)


// router.get("/",authController.protect, followController.getallFollow);
// // router.post(
// //   "/manage-friend-request/:id",
// //   authController.protect,
// //   authController.restrictTo("user"),
// //   followController.manageFriendRequest
// // );
// router
//   .route("/:id")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     followController.follow
//   )
//   .get(followController.getOneFollow)
//   .patch(
//     authController.protect,
//     // authController.restrictTo("admin"),
//     followController.updateFollow
//   )
//   .delete(
//     authController.protect,
//     // authController.restrictTo("admin"),
//     followController.deleteFollow
//   );

module.exports = router;
