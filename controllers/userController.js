const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const factory = require("./handleFactory");
const cron = require("node-cron");
const Notification = require("../models/notificationModel");
const paginationQueryExtracter = require("../utils/paginationQueryExtractor");
const paginateArray = require("../utils/paginationHelper");
const RefreshToken = require("../models/refreshTokenModel");
const {
  followingsCheckArray,
  followingsCheckSingle,
} = require("../utils/helpers");
const chatModel = require("../models/chatModel");
const Message = require("../models/messageModel");
const Saved = require("../models/saveModel");
const Boost = require("../models/boostProfileModel");
const Post = require("../models/postModel");
const Follow = require("../models/friendsModel");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "email");
  if (req.file) filteredBody.photo = req.file.filename;

  // Check if profileSetup is false and update it to true
  if (!req.user.profileSetup) {
    filteredBody.profileSetup = true;
  }

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
  });

  res.status(200).json({
    status: 200,
    success: true,
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // await User.findByIdAndUpdate(req.user.id, { active: false });
  const user = await User.findOne({ _id: req.user._id });
  if (user.subscriptionId) {
    await stripe.subscriptions.del(user.subscriptionId);
  }
  await RefreshToken.deleteMany({ user: req.user._id });
  await Guardian.deleteMany({
    $or: [{ guardian: req.user._id }, { user: req.user._id }],
  });
  await User.findByIdAndDelete(req.user._id);
  res.status(200).json({
    status: 204,
    success: true,
    data: null,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No User Found With Given Id ", 404));
  }

  return res.status(200).json({
    status: 200,
    success: true,
    user,
  });
});
// exports.getAllUsers = factory.getAll(User);
//// get All user with boosted profiles

async function prioritizeBoostedProfiles() {
  // Fetch boosted profiles
  const boostedProfiles = await Boost.find();

  // Map boosted profile IDs to prioritize users
  const boostedProfileIds = boostedProfiles.map((profile) => profile.userId);

  // Update users to prioritize boosted profiles
  await User.updateMany(
    { _id: { $in: boostedProfileIds } }, // Query to find users with boosted profiles
    { $set: { priority: 1 } } // Set a priority field to prioritize these users
  );
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
  await prioritizeBoostedProfiles(); // Prioritize boosted profiles

  // Fetch all users, sorted by priority (boosted profiles first)
  const users = await User.find().sort({ priority: -1 });

  return res.status(200).json({
    status: 200,
    success: true,
    users,
  });
});

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

/////////// Notifications
exports.mynotifications = catchAsync(async (req, res, next) => {
  const notifictations = await Notification.find({
    $and: [{ notifyType: { $ne: "sendMessage" } }, { receiver: req.user.id }],
  }).sort("-createdAt");

  const notifictationsmulti = await Notification.find({
    $and: [
      { notifyType: { $ne: "sendMessage" } },
      { multireceiver: { $in: [req.user.id] } },
    ],
  }).sort("-createdAt");

  await Notification.updateMany(
    {
      $and: [
        { isSeen: { $not: { $elemMatch: { $eq: req.user.id } } } },
        { multireceiver: { $elemMatch: { $eq: req.user.id } } },
      ],
    },
    { $addToSet: { isSeen: req.user.id } }
  );

  //////////////////
  let records;
  records = JSON.parse(JSON.stringify(notifictationsmulti));
  console.log("RECORDS: ", records.length);
  for (let i = 0; i < records.length; i++) {
    if (records[i].isSeen && records[i].isSeen.length > 0) {
      if (records[i].isSeen.includes(JSON.parse(JSON.stringify(req.user.id)))) {
        records[i].actionTaken = true;
      } else {
        records[i].actionTaken = false;
      }
    } else {
      records[i].actionTaken = false;
    }
    console.log("A");
  }

  // records.push(JSON.parse(JSON.stringify(notifictations)));
  const mergedNotifications = records.concat(notifictations);
  // console.log(records);
  mergedNotifications.sort((a, b) => b.createdAt - a.createdAt);
  //////

  const filteredDocs = notifictations.filter((doc) => !doc.actionTaken);

  const ids = filteredDocs.map((doc) => doc._id);

  const update = {
    $set: {
      actionTaken: true,
    },
  };

  const filter = {
    _id: {
      $in: ids,
    },
  };

  await Notification.updateMany(filter, update);

  const data = paginateArray(
    mergedNotifications,
    req.query.page,
    req.query.limit
  );

  res.status(200).json({
    success: true,
    status: 200,
    size: mergedNotifications.length,
    data,
  });
});

////===User Search=====//////
exports.searchUsers = catchAsync(async (req, res, next) => {
  let condition;
  let data;
  let search;
  console.log("serach query", req.query.search);
  if (req.query.search) {
    const escapedSearch = escapeRegExp(req.query.search);
    search = {
      $or: [
        {
          username: {
            $regex: new RegExp(escapedSearch, "i"),
          },
        },
        {
          firstName: { $regex: new RegExp(escapedSearch, "i") },
        },
        {
          lastName: { $regex: new RegExp(escapedSearch, "i") },
        },
        // {
        //   tags: {
        //     $elemMatch: { $regex: new RegExp(req.query.search, "i") },
        //   },
        // }, // Case-insensitive search for tags array
      ],
    };
  }

  condition = {
    $and: [
      { ...search },
      { role: "user" },
      { verified: true },
      { isComplete: true },
    ],
  };
  console.log(condition);
  req.query.search = undefined;
  data = await paginationQueryExtracter(req, User, condition);
  const users = await followingsCheckArray(
    req.user.id,
    JSON.parse(JSON.stringify(data.data))
  );

  res.json({
    status: 200,
    success: true,
    message: "Data Retrieved Successfully",
    results: data.data.length,
    data: {
      data: users,
      totalPages: data.totalPages,
    },
  });
});

exports.userStats = catchAsync(async (req, res, next) => {
  const [user, followers, following, posts] = await Promise.all([
    User.findById(req.params.id).select(
      "name image location gender dateOfBirth"
    ),
    Follow.countDocuments({ following: req.params.id }),
    Follow.countDocuments({ creator: req.params.id }),
    Post.countDocuments({ creator: req.params.id }),
  ]);
  res.json({
    status: 200,
    success: true,
    message: "Data Retrieved Successfully",
    user,
    followers,
    following,
    posts,
  });
});

cron.schedule("0 */5 * * * *", async () => {
  try {
    await Notification.deleteMany({
      createdAt: { $lte: Date.now() - 7 * 24 * 60 * 60 * 1000 },
    });
  } catch (e) {
    console.log(e);
  }
});
