const express = require("express");
const userRoutes = require("./userRoutes");
const privacyRoutes = require("./privacyPolicyRoutes");
const termsandconditionRoutes = require("./termsAndConditionRoutes");

const setupRoutesV1 = () => {
  const router = express.Router();
  router.use("/user", userRoutes);
  router.use("/privacy", privacyRoutes);
  router.use("/termsandcondition", termsandconditionRoutes);

  return router;
};
module.exports = setupRoutesV1;
