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
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

followSchema.pre(/^find/, function (next) {
  this.populate({
    path: "creator",
    select: "name username image email",
  });
  this.populate({
    path: "following",
    select: "name username image email",
  });
  next();
});

const Follow = mongoose.model("Follow", followSchema);

module.exports = Follow;
