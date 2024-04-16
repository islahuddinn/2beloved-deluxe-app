const mongoose = require("mongoose");

const seenSchema = new mongoose.Schema(
  {
    seen: {
      type: mongoose.Schema.ObjectId,
      refPath: "seen_model_type",
    },
    seen_model_type: {
      type: String,
      enum: ["Story"],
      default: "Story",
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

seenSchema.pre(/^find/, function (next) {
  this.populate({
    path: "creator",
    select: "name image email",
  });
  next();
});

const Seen = mongoose.model("Seen", seenSchema);

module.exports = Seen;
