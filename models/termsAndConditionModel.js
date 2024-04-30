const mongoose = require("mongoose");

const termsandconditionSchema = mongoose.Schema(
  {
    data: String,
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

termsandconditionSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "creator",
  });
  next();
});

const TermsandCondition = mongoose.model(
  "TermsandCondition",
  termsandconditionSchema
);

module.exports = TermsandCondition;
