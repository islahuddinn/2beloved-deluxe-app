const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema(
  {
    title: String,
    type: {
      type: String,
      enum: ["Sports", "News", "Lifestyle", "Other"],
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

preferenceSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "creator",
  });
  next();
});

const Preference = mongoose.model("Preference", preferenceSchema);

module.exports = Preference;
