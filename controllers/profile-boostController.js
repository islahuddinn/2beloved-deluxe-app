const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Boost Functionality
exports.boostProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { boostEndDate } = req.body;

  // Check if the user has already boosted their profile
  const existingBoost = await User.findOne({ user: userId });
  if (existingBoost) {
    return next(new AppError("Your profile is already boosted.", 400));
  }

  // Create a new profile boost record
  const newBoost = await User.create({
    user: userId,
    boostStartDate: new Date(),
    boostEndDate: boostEndDate,
    boostActive: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      boost: newBoost,
    },
  });
});
