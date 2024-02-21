const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    following: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
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

followSchema.pre(/^find/, function (next) {
  this.populate({
    path: "creator",
    select: "firstName lastName username image",
  });
  this.populate({
    path: "following",
    select: "firstName lastName username image",
  });
  next();
});

const Follow = mongoose.model("Follow", followSchema);

module.exports = Follow;
