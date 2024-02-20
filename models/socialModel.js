const mongoose = require("mongoose");

const socialSchema = new mongoose.Schema({
  whatsapp: {
    type: String,
    trim: true,
  },
  facebook: {
    type: String,
    trim: true,
  },
  instagram: {
    type: String,
    trim: true,
  },
  twitter: {
    type: String,
    trim: true,
  },
  tiktok: {
    type: String,
    trim: true,
  },
  spotify: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
});

const Social = mongoose.model("Social", socialSchema);

module.exports = Social;
