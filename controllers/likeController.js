const Like = require("../models/likeModel");
const Post = require("../models/postModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handleFactory");
const Notification = require("../models/notificationModel");
const { sendNotification } = require("../utils/notification");
const User = require("../models/userModel");
const RefreshToken = require("../models/refreshTokenModel");

exports.like = catchAsync(async (req, res, next) => {
  const likeId = req.params.id;
  const userId = req.user.id;
  const preLike = await Like.findOne({
    $and: [{ creator: userId }, { like: likeId }],
  });

  if (preLike) {
    await Like.findByIdAndDelete(preLike._id);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Unliked Successfully",
    });
  } else {
    await Like.create({ creator: userId, like: likeId });

    res.status(200).json({
      status: 200,
      success: true,
      message: "Liked Successfully",
    });

    ////Notifications
    const post = await Post.findById(likeId);
    // console.log("pre", req.user.id, "postpreewr", post.creator.id);
    if (req.user.id != post.creator._id) {
      const user = await User.findOne({ _id: post.creator.id });
      await Notification.create({
        sender: req.user.id,
        receiver: user._id,
        notifyType: "post-like",
        title: `${req.user.firstName} ${req.user.lastName} Like your ${post.content[0].type}`,
        text: ``,
        data: { post: likeId },
      });
      const tokens = JSON.parse(
        JSON.stringify(await RefreshToken.find({ user: user.id }))
      ).map(({ deviceToken }) => deviceToken);
      if (user.isNotification) {
        for (const deviceToken of tokens) {
          await sendNotification({
            token: deviceToken,
            title: `${req.user.firstName} ${req.user.lastName} Like your ${post.content[0].type}`,
            body: ``,
            data: {
              value: JSON.stringify({ post: likeId }),
            },
          });
        }
      }
    }
    ////////////////////
  }
});

exports.updateLike = factory.updateOne(Like);
exports.getallLike = factory.getAll(Like);
exports.getOneLike = factory.getOne(Like);
exports.deleteLike = factory.deleteOne(Like);
