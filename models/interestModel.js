const mongoose = require("mongoose");

const interestSchema = new mongoose.Schema({
  interests: {
    type: Array,
  },
});

const Interest = mongoose.model("Interest", interestSchema);

module.exports = Interest;
