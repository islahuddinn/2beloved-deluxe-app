const mongoose = require("mongoose");

const savedSchema = new mongoose.Schema(
  {
    saved: {
      type: mongoose.Schema.ObjectId,
      refPath: "saved_model_type",
    },
    saved_model_type: {
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

savedSchema.pre(/^find/, function (next) {
  this.populate({
    path: "creator",
    select: "firstName lastName username image",
  });
  this.populate({
    path: "saved",
  });
  next();
});

const Saved = mongoose.model("Saved", savedSchema);

module.exports = Saved;
