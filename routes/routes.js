const express = require("express");
const userRoutes = require("./userRoutes");
const privacyRoutes = require("./privacyPolicyRoutes");
const termsandconditionRoutes = require("./termsAndConditionRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");
const interestRoutes = require("./interestRoutes");
const friendsRoutes = require("./friendsRoutes");
const likeRoutes = require("./likeRoutes");
const savedRoutes = require("./saveRoutes");
const commentRoutes = require("./commentRoutes");
const postRoutes = require("./postRoutes");
const storyRoutes = require("./storyRoutes");
const alertRoutes = require("./alertRoutes");

const setupRoutesV1 = () => {
  const router = express.Router();
  router.use("/user", userRoutes);
  router.use("/privacy", privacyRoutes);
  router.use("/termsandcondition", termsandconditionRoutes);
  router.use("/interests", interestRoutes);
  router.use("/follow", friendsRoutes);
  router.use("/like", likeRoutes);
  router.use("/saved", savedRoutes);
  router.use("/comment", commentRoutes);
  router.use("/post", postRoutes);
  router.use("/story", storyRoutes);
  router.use("/alert", alertRoutes);
  router.use("/subscription", subscriptionRoutes);

  return router;
};
module.exports = setupRoutesV1;
