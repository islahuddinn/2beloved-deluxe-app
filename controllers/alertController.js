const catchAsync = require("../utils/catchAsync");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const { sendNotificationMultiCast } = require("../utils/notification");
const RefreshToken = require("../models/refreshTokenModel");

exports.sendAlert = catchAsync(async (req, res, next) => {
  const { text, userId } = req.body;
  const users = await User.find({ _id: userId, role: { $ne: "admin" } });
  let tokens = [];
  const notificationData = [];
  for (let i = 0; i < users.length; i++) {
    const userTokens = JSON.parse(
      JSON.stringify(await RefreshToken.find({ user: users[i]?.id }))
    ).map(({ deviceToken }) => deviceToken);

    if (users[i].isNotification && userTokens.length > 0) {
      tokens.push(...userTokens);
      notificationData.push({ ...users[i] });
    }
  }

  tokens = tokens.filter((token) => token !== undefined);

  if (tokens.length > 0) {
    await sendNotificationMultiCast({
      tokens: tokens,
      title: "Alert",
      body: `${text}`,
      data: {},
    });
  }
  /////////////////////
  return res.status(200).json({
    status: 200,
    success: true,
    message: "Alert sent successfully",
  });
});
