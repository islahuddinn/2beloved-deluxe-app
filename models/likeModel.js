const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    like: {
      type: mongoose.Schema.ObjectId,
      refPath: "like_model_type",
    },
    like_model_type: {
      type: String,
      enum: ["Post"],
      default: "Post",
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

likeSchema.pre(/^find/, function (next) {
  this.populate({
    path: "creator",
    select: "name image email",
  });
  next();
});

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
