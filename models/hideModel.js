const mongoose = require("mongoose");

const hideSchema = new mongoose.Schema(
  {
    hide: {
      type: mongoose.Schema.ObjectId,
      refPath: "hide_model_type",
    },
    hide_model_type: {
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

hideSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "creator",
    select: "name email image",
  });
  next();
});

const Hide = mongoose.model("Hide", hideSchema);

module.exports = Hide;
