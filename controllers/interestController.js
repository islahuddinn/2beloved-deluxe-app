const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const Interest = require("../models/interestModel");
const Factory = require("./handleFactory");
const uuid = require("uuid");
const slugify = require("slugify");
const _ = require("lodash");
const { default: mongoose } = require("mongoose");

////======= Function to create social links for the current user========////
exports.createSocialLinks = catchAsync(async (req, res, next) => {
  const { whatsapp, facebook, instagram, tiktok, spotify, website } = req.body;
  const userId = req.user._id;
  console.log(userId);

  // Create social links document
  const socialLinks = await User.findByIdAndUpdate(
    userId,
    {
      whatsapp,
      facebook,
      instagram,
      tiktok,
      spotify,
      website,
    },
    { new: true, upsert: true }
  );

  res.status(201).json({
    success: true,
    status: 201,
    message: "Social links created/updated successfully",
    data: socialLinks,
  });
});

//// Function to get social links of the current user

exports.getSocialLinks = async (req, res, next) => {
  try {
    // Find the social links document for the current user
    const socialLinks = await User.findById(req.user._id);

    if (!socialLinks) {
      // If social links not found, send a 404 error
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Social links not found for the current user",
      });
    }

    // Send the social links data in the response
    res.status(200).json({
      success: true,
      status: 200,
      data: socialLinks,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching social links:", error);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error",
    });
  }
};

//////=====User Interests APIs=========/////

const interestsData = [
  { title: "Cricket" },
  { title: "Entertainment" },
  { title: "TV" },
  { title: "Videos" },
  { title: "First/Opening Line" },
  { title: "Character" },
  { title: "Genre" },
  { title: "Protagonist" },
  { title: "Antagonist" },
  { title: "Narrator" },
  { title: "Outline" },
  { title: "Purpose" },
  { title: "Focused Direction" },
  { title: "Narrate Voice" },
  { title: "Characters" },
  { title: "Chord" },
  { title: "Basic Chords" },
  { title: "Chord Progression" },
  { title: "Common Chord Progressions" },
];

exports.getAllAvailableInterests = async (req, res) => {
  try {
    // Check if interests already exist
    const existingInterests = await Interest.find();
    if (existingInterests.length > 0) {
      // If interests already exist, return the first saved interest object
      return res.json(existingInterests[0]);
    }

    // If interests do not exist, create new interest objects
    const formattedData = new Interest({
      interests: interestsData.map((interest) => ({
        id: new mongoose.Types.ObjectId(),
        title: interest.title,
      })),
    });
    const savedInterest = await formattedData.save();
    res.json(savedInterest);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error",
    });
  }
};

// Function to generate a unique ID
// function generateUniqueId() {
//   return uuid.v4(); // Generate a version 4 UUID
// }
exports.addUserInterests = async (req, res) => {
  try {
    const userId = req.user.id;
    const chosenInterestIds = req.body.chosenInterestIds;

    // Validate chosenInterestIds
    if (!_.isArray(chosenInterestIds) || chosenInterestIds.length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Invalid chosen interest format",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found",
      });
    }
    // Check if profile setup is completed
    if (!user.profileSetup) {
      return res.status(400).json({
        success: false,
        status: 400,
        message:
          "Profile setup is not completed. Please complete profile setup before adding interests.",
      });
    }
    const allInterests = await Interest.find();

    // Filter chosen interests based on provided IDs
    const chosenInterests = allInterests.flatMap((interest) => {
      return interest.interests.filter((innerInterest) =>
        chosenInterestIds.includes(innerInterest.id.toString())
      );
    });
    console.log(chosenInterests, "yomolpo");
    // Ensure at least one chosen interest exists
    if (chosenInterests.length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "No chosen interests found in the database",
      });
    }
    const newInterests = await Interest.create({
      interests: chosenInterests,
      creator: req.user.id,
    });
    user.isInterests = true;

    console.log(newInterests, "salluu");

    await user.save();
    res.json({
      success: true,
      status: 200,
      message: "User interests updated successfully",
      data: newInterests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error",
    });
  }
};
/////Update user interests
exports.updateUserInterests = async (req, res) => {
  try {
    const userId = req.user.id;
    const chosenInterestIds = req.body.chosenInterestIds;

    // Validate chosenInterestIds
    if (!Array.isArray(chosenInterestIds) || chosenInterestIds.length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Invalid chosen interest format",
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found",
      });
    }

    // Fetch existing user interests
    const existingInterests = await Interest.find({ user: userId });

    // Get the IDs of existing interests
    const existingInterestIds = existingInterests.map(
      (interest) => interest.interests
    );

    // Filter chosen interests to exclude existing ones
    const newInterestIds = chosenInterestIds.filter(
      (id) => !existingInterestIds.includes(id)
    );

    // Create new interests for the user and associate them with the user
    const newInterests = await Interest.insertMany(
      newInterestIds.map((id) => ({ user: userId, interest: id }))
    );

    // Add the newly created interests to the user's interests list
    Interest.push(...newInterests.map((interest) => interest._id));

    // Save the user with updated interests
    await user.save();

    return res.json({
      success: true,
      status: 200,
      message: "User interests updated successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error",
    });
  }
};

//// in case we need to delte user interests
exports.deleteInterest = catchAsync(async (req, res, next) => {
  // Extract the interest ID from request parameters
  const { interestId } = req.params;
  console.log(interestId);
  // Find and delete the interest document by ID
  const deletedInterest = await Interest.findByIdAndDelete(interestId);

  if (!deletedInterest) {
    // If no interest found with the provided ID, send a 404 error
    return res.status(404).json({
      success: false,
      message: "Interest not found",
    });
  }

  // Send a success response
  res.status(200).json({
    success: true,
    message: "Interest deleted successfully",
    data: deletedInterest,
  });
});

exports.createInterest = Factory.creatOne(Interest);
exports.getAllInterest = Factory.getAll(Interest);
exports.getOneInterest = Factory.getOne(Interest);
// exports.updateInterest = Factory.updateOne(Interest);
exports.deleteInterest = Factory.deleteOne(Interest);
