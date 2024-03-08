const mongoose = require("mongoose");

const boostSchema = new mongoose.Schema(
  {
    boostStartDate: {
      type: Date,
      required: true,
    },
    boostEndDate: {
      type: Date,
      required: true,
    },
    boostActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Boost = mongoose.model("Boost", boostSchema);

module.exports = Boost;
