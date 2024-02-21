const Notification = require("../models/notificationModel");
const Follow = require("../models/friendsModel");
const RefreshToken = require("../models/refreshTokenModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendNotification } = require("../utils/notification");
const factory = require("./handleFactory");

exports.follow = catchAsync(async (req, res, next) => {
  const followId = req.params.id;
  const userId = req.user.id;

  if (followId === userId)
    return next(new AppError("You cannot follow yourself", 400));

  const preFollow = await Follow.findOne({
    $and: [{ creator: userId }, { following: followId }],
  });

  if (preFollow) {
    await Follow.findByIdAndDelete(preFollow._id);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Unfollowed Successfully",
    });
  } else {
    await Follow.create({ creator: userId, following: followId });

    res.status(200).json({
      status: 200,
      success: true,
      message: "Followed Successfully",
    });
    if (req.query.notification) {
      await Notification.findByIdAndUpdate(req.query.notification, {
        isFollowAlert: false,
      });
    }
    ////Notifications
    const preFollowCheck = await Follow.findOne({
      $and: [{ creator: followId }, { following: userId }],
    });
    const isNotFollowing = preFollowCheck ? false : true;
    // console.log("pre", req.user.id, "postpreewr", post.creator.id);
    const user = await User.findOne({ _id: followId });
    await Notification.create({
      sender: userId,
      receiver: user._id,
      notifyType: "follow",
      title: `${req.user.firstName} ${req.user.lastName} Started Following you`,
      text: ``,
      isFollowAlert: isNotFollowing,
      data: { user: userId },
    });
    const tokens = JSON.parse(
      JSON.stringify(await RefreshToken.find({ user: user.id }))
    ).map(({ deviceToken }) => deviceToken);
    if (user.isNotification) {
      for (const deviceToken of tokens) {
        await sendNotification({
          token: deviceToken,
          title: `${req.user.firstName} ${req.user.lastName} Started Following you`,
          body: ``,
          data: {
            value: JSON.stringify({ user: userId }),
          },
        });
      }
    }
  }
  ////////////////////
});

exports.updateFollow = factory.updateOne(Follow);
exports.getallFollow = factory.getAll(Follow);
exports.getOneFollow = factory.getOne(Follow);
exports.deleteFollow = factory.deleteOne(Follow);
