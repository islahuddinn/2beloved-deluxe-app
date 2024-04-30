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

followSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "creator",
  });
  this.populate({
    path: "following",
    select: "name email image",
  });
  next();
});

const Follow = mongoose.model("Follow", followSchema);

module.exports = Follow;
