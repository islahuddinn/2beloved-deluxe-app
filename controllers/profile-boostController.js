const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Boost = require("../models/boostProfileModel");
const BoostPosts = require("../utils/booster");

// Boost Functionality
exports.boostProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const currentDate = new Date();
  const boostEndDate = new Date(
    currentDate.setMonth(currentDate.getMonth() + 1)
  );

  // Check if the user has already boosted their profile
  const existingBoost = await Boost.findOne({ user: userId });
  if (existingBoost) {
    return next(new AppError("Your profile is already boosted.", 400));
  }

  // Create a new profile boost record
  const newBoost = await Boost.create({
    user: userId,
    boostStartDate: new Date(),
    boostEndDate: boostEndDate,
    boostActive: true,
  });

  res.status(200).json({
    status: 200,
    success: true,
    data: {
      boost: newBoost,
    },
  });
});

////Boosted Profile Staus
exports.getBoostedProfileStatus = catchAsync(async (req, res, next) => {
  // Extract user ID from request parameters
  const userId = req.params.userId;

  // Find the user based on the provided user ID
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: "User not found",
    });
  }

  // Find the boost record for the user
  const boost = await Boost.findOne({ user: userId });

  // If no boost record is found, return status indicating no boost
  if (!boost) {
    return res.status(200).json({
      status: 200,
      success: true,
      data: {
        boosted: false,
        remainingDays: 0,
      },
    });
  }

  // If boost record is found, check if it is active and not expired
  const currentDate = new Date();
  const remainingDays = Math.ceil(
    (boost.boostEndDate - currentDate) / (1000 * 60 * 60 * 24)
  );

  if (boost.boostActive && boost.boostEndDate > currentDate) {
    return res.status(200).json({
      status: 200,
      success: true,
      data: {
        boosted: true,
        remainingDays: remainingDays,
      },
    });
  }

  // If boost is not active or expired, return status indicating no boost
  return res.status(200).json({
    status: 200,
    success: true,
    data: {
      boosted: false,
      remainingDays: 0,
    },
  });
});
//// Cancel Boost of Profile

exports.cancelBoostProfile = catchAsync(async (req, res, next) => {
  // Extract user ID from request parameters
  const userId = req.params.userId;

  // Find the boost record for the user
  const boost = await Boost.findOne({ user: userId });

  // If no boost record is found, return status indicating no boost
  if (!boost) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: "Boosted profile not found",
    });
  }

  // Update the boost record to mark it as inactive
  boost.boostActive = false;
  await boost.save();

  res.status(200).json({
    status: 200,
    success: true,
    message: "Boost profile cancelled successfully",
  });
});

exports.getallBoostedProfiles = factory.getAll(Boost);
exports.getOneBoostedProfile = factory.getOne(Boost);
