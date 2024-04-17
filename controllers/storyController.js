const Follow = require("../models/friendsModel");
const Seen = require("../models/seenModel");
const Story = require("../models/storyModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { commentsCheck, storiesViewCheck } = require("../utils/helpers");
const paginationQueryExtracter = require("../utils/paginationQueryExtractor");
const factory = require("./handleFactory");

exports.viewStory = catchAsync(async (req, res, next) => {
  const storyId = req.params.id;
  const userId = req.user.id;

  await Seen.create({ creator: userId, seen: storyId });

  return res.status(200).json({
    status: 200,
    success: true,
    message: "Seen Successfully",
  });
});

exports.createStory = catchAsync(async (req, res, next) => {
  const { content, thumbnail, type } = req.body;
  const userId = req.user.id;

  const story = await Story.create({
    creator: userId,
    content: content,
    thumbnail: thumbnail,
    type: type,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  let mystories = await Story.find({
    creator: req.user.id,
    expiresAt: { $gt: Date.now() },
  }).sort("-createdAt");

  mystories = storiesViewCheck(
    req.user.id,
    JSON.parse(JSON.stringify(mystories))
  );

  return res.status(200).json({
    status: 200,
    success: true,
    message: "Story Created Successfully",
  });
});

exports.getMyStories = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  let followings = await Follow.find({ creator: req.user.id });
  followings = followings.map((follow) => follow.following._id);

  condition = {
    $and: [
      {
        creator: {
          $in: followings,
        },
      },
      {
        expiresAt: { $gt: Date.now() },
      },
    ],
  };

  let stories = await Story.find({
    $and: [
      {
        creator: {
          $in: followings,
        },
      },
      {
        expiresAt: { $gt: Date.now() },
      },
    ],
  }).sort("-createdAt");

  stories = storiesViewCheck(req.user.id, JSON.parse(JSON.stringify(stories)));

  let mystories = await Story.find({
    creator: req.user.id,
    expiresAt: { $gt: Date.now() },
  }).sort("-createdAt");

  mystories = storiesViewCheck(
    req.user.id,
    JSON.parse(JSON.stringify(mystories))
  );

  const groupedData = {};

  stories.forEach((item) => {
    const creatorId = item.creator._id;
    if (!groupedData[creatorId]) {
      groupedData[creatorId] = {
        creator: item.creator,
        stories: [],
      };
    }
    groupedData[creatorId].stories.push(item);
  });

  // Sort posts within each creator object by createdAt in descending order
  for (const creatorId in groupedData) {
    groupedData[creatorId].stories.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  const result = Object.values(groupedData);

  // Sort the result array by the createdAt of the 0 index post in each creator
  result.sort(
    (a, b) =>
      new Date(b.stories[0].createdAt) - new Date(a.stories[0].createdAt)
  );

  res.json({
    status: 200,
    success: true,
    message: "Data Retrieved Successfully",
    mystory: mystories,
    otherstories: result,
  });
});

exports.updateStory = factory.updateOne(Story);
exports.getallStory = factory.getAll(Story);
exports.getOneStory = factory.getOne(Story);
exports.deleteStory = factory.deleteOne(Story);
