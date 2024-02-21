const Comment = require("../models/commentModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { commentsCheck } = require("../utils/helpers");
const paginationQueryExtracter = require("../utils/paginationQueryExtractor");
const factory = require("./handleFactory");
const { sendNotification } = require("../utils/notification");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const RefreshToken = require("../models/refreshTokenModel");

exports.createComment = catchAsync(async (req, res, next) => {
  const { comment } = req.body;
  const postId = req.params.id;
  const userId = req.user.id;

  const comment1 = await Comment.create({
    creator: userId,
    post: postId,
    comment: comment,
  });

  const postcomment = await Comment.findById(comment1._id);

  res.status(200).json({
    status: 200,
    success: true,
    message: "Comment Created Successfully",
    comment: postcomment,
  });

  ////Notifications
  let str = comment;
  if (str.length > 25) str = str.substring(0, 25);
  const post = await Post.findById(postId);
  if (req.user.id != post?.creator?.id) {
    const user = await User.findOne({ _id: post?.creator?.id });
    await Notification.create({
      sender: req.user.id,
      receiver: user._id,
      notifyType: "post-comment",
      title: `${req?.user?.firstName} ${req?.user?.lastName} Comment on your ${post?.content[0]?.type}`,
      text: `${str}`,
      data: { post: postId },
    });
    const tokens = JSON.parse(
      JSON.stringify(await RefreshToken.find({ user: user?.id }))
    ).map(({ deviceToken }) => deviceToken);
    if (user.isNotification) {
      for (const deviceToken of tokens) {
        await sendNotification({
          token: deviceToken,
          title: `${req?.user?.firstName} ${req?.user?.lastName} Comment on your ${post?.content[0]?.type}`,
          body: `${str}`,
          data: {
            value: JSON.stringify({ post: postId }),
          },
        });
      }
    }
  }
  ////////////////////
});

exports.getPostComments = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  data = await paginationQueryExtracter(req, Comment, null);

  const comments = await commentsCheck(
    userId,
    JSON.parse(JSON.stringify(data?.data))
  );

  res.json({
    status: 200,
    success: true,
    message: "Data Retrieved Successfully",
    results: data.data.length,
    data: {
      data: comments,
      totalPages: data.totalPages,
    },
  });
});

exports.updateComment = factory.updateOne(Comment);
exports.getallComment = factory.getAll(Comment);
exports.getOneComment = factory.getOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
