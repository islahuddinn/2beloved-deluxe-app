const mongoose = require("mongoose");

const interestSchema = new mongoose.Schema({
  cricket: {
    type: Boolean,
    default: false,
  },
  entertainment: {
    type: Boolean,
    default: false,
  },
  tv: {
    type: Boolean,
    default: false,
  },
  videos: {
    type: Boolean,
    default: false,
  },
  openingLine: {
    type: Boolean,
    default: false,
  },
  character: {
    type: Boolean,
    default: false,
  },
  genre: {
    type: Boolean,
    default: false,
  },
  protagonist: {
    type: Boolean,
    default: false,
  },
  antagonist: {
    type: Boolean,
    default: false,
  },
  narrator: {
    type: Boolean,
    default: false,
  },
  outline: {
    type: Boolean,
    default: false,
  },
  purpose: {
    type: Boolean,
    default: false,
  },
  focusedDirection: {
    type: Boolean,
    default: false,
  },
  narrate: {
    type: Boolean,
    default: false,
  },
  authenticVoice: {
    type: Boolean,
    default: false,
  },
  characters: {
    type: Boolean,
    default: false,
  },
  chord: {
    type: Boolean,
    default: false,
  },
  basicChord: {
    type: Boolean,
    default: false,
  },
  chordProgression: {
    type: Boolean,
    default: false,
  },
  commonChordProgressions: {
    type: Boolean,
    default: false,
  },
  favoridefualt: {
    type: Boolean,
    default: false,
  },
});

const Interest = mongoose.model("Interest", interestSchema);

module.exports = Interest;
