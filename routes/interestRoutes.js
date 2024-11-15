const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const interestController = require("../controllers/interestController");
const router = express.Router();

router.use(authController.protect);
router.post("/addSocialLinks", interestController.createSocialLinks);
router.get("/getSocialLinks", interestController.getSocialLinks);
router.get(
  "/getAllAvailableInterests",
  interestController.getAllAvailableInterests
);
router.post("/add", interestController.addUserInterests);

router.get("/", interestController.getAllInterest);
router
  .route("/:id")
  .get(interestController.getOneInterest)
  .patch(interestController.updateUserInterests)
  .delete(interestController.deleteInterest);

module.exports = router;
