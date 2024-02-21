const Saved = require("../models/saveModel");
const Post = require("../models/postModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handleFactory");
const { PostChecksArray } = require("../utils/helpers");
const paginationQueryExtracter = require("../utils/paginationQueryExtractor");

exports.save = catchAsync(async (req, res, next) => {
  const savedId = req.params.id;
  const userId = req.user.id;
  const preSaved = await Saved.findOne({
    $and: [{ creator: userId }, { saved: savedId }],
  });

  if (preSaved) {
    await Saved.findByIdAndDelete(preSaved._id);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "UnSaved Successfully",
    });
  } else {
    await Saved.create({ creator: userId, saved: savedId });

    res.status(200).json({
      status: 200,
      success: true,
      message: "Saved Successfully",
    });
  }
});

exports.updateSave = factory.updateOne(Saved);
exports.getallSave = catchAsync(async (req, res, next) => {
  data = await paginationQueryExtracter(req, Saved, null);
  let posts = data.data.map((post) => post.saved);
  posts = await PostChecksArray(req.user.id, JSON.parse(JSON.stringify(posts)));
  res.json({
    status: 200,
    success: true,
    message: "Data Retrieved Successfully",
    results: data.data.length,
    data: {
      data: posts,
      totalPages: data.totalPages,
    },
  });
});
exports.getOneSave = factory.getOne(Saved);
exports.deleteSave = factory.deleteOne(Saved);
