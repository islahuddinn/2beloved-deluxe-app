const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const Interest = require("../models/interestModel");
const Factory = require("./handleFactory");

////======= Function to create social links for the current user========////
exports.createSocialLinks = catchAsync(async (req, res, next) => {
  const { whatsapp, facebook, instagram, tiktok, spotify, website } = req.body;
  const userId = req.user._id; // Assuming req.user contains the current user's ID
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

// exports.getSocialLinks = async (req, res, next) => {
//   try {
//     const userId = req.user._id; // Assuming userId is used to identify the user
//     const user = await User.findById(userId); // Retrieve the user from the database

//     console.log(user);

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     const socialLinks = await Social.findOne({ user: user._id }); // Assuming socialLinks is the field containing the social links
//     console.log(socialLinks);
//     return res.status(200).json({ success: true, data: socialLinks });
//   } catch (error) {
//     console.error("Error fetching social links:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// };

//////=====User Interests APIs=========/////
exports.createInterests = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const interests = req.body;

  try {
    // Find the user by userId
    const user = await User.findById(userId);

    // If user not found, return an error
    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found",
      });
    }

    // Create a new interest object
    const newInterest = new Interest({
      userId: userId,
      cricket: interests.cricket || false,
      entertainment: interests.entertainment || false,
      tv: interests.tv || false,
      videos: interests.videos || false,
      openingLine: interests.openingLine || "",
      character: interests.character || "",
      genre: interests.genre || "",
      protagonist: interests.protagonist || "",
      antagonist: interests.antagonist || "",
      narrator: interests.narrator || "",
      outline: interests.outline || "",
      purpose: interests.purpose || "",
      focusedDirection: interests.focusedDirection || "",
      narrateVoice: interests.narrateVoice || "",
      characters: interests.characters || "",
      chord: interests.chord || "",
      basicChord: interests.basicChord || "",
      chordProgression: interests.chordProgression || "",
      commonChordProgressions: interests.commonChordProgressions || "",
      preferredGenre: interests.preferredGenre || "",
    });

    // Save the interest object
    const savedInterest = await newInterest.save();

    // Return success response
    res.status(201).json({
      success: true,
      status: 201,
      message: "Interests created successfully",
      data: savedInterest,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error",
    });
  }
});
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
exports.updateInterest = Factory.updateOne(Interest);
// exports.deleteInterest = Factory.deleteOne(Interest);
