const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "video", "image"],
      default: "text",
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: "Post",
    },
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "creator",
    select: "name email image",
  });
  next();
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
