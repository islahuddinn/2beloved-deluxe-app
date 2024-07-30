const ReportPost = require("../models/reportPostModel");
const User = require("../models/userModel");
const Post = require("../models/postModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.reportPost = catchAsync(async (req, res, next) => {
    console.log("API HIT")
  const { postId } = req.params;
  const { reason } = req.body;
  if (!postId) {
    return next(
      new AppError("Please select the post that you want to report", 400)
    );
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError("Post with this ID doesn't exist.", 404));
  }
  let existingReport = await ReportPost.findOne({ post: post._id });
  if (!existingReport) {
    console.log("EXISTING REPORT NOT FOUND. CREATING NEW REPORT")
    const report = await ReportPost.create({
      post: post._id,
    });

    report.reportedBy.push({ user: req.user._id, reason });
    report.reportCount = report.reportedBy.length;

    await report.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Your report has been submitted successfully.",
      report,
    });
  }
  console.log('--------------------------------------------------------')
  console.log("EXISTING_REPORT_IS:", existingReport)
  const alreadyReported = existingReport.reportedBy.some(
    (report) => report.user.toString() === req.user._id.toString()
  );

  if (alreadyReported) {
    return next(new AppError("You have already reported this post.", 400));
  }

  existingReport.reportedBy.push({ user: req.user._id, reason });
  existingReport.reportCount = existingReport.reportedBy.length;

  if (existingReport.reportCount >= 5) {
    existingReport.isReportExceeded = true;
  }

  await existingReport.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Your report has been submitted successfully.",
    report: existingReport,
  });
});




