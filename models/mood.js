const mongoose = require("mongoose");

const moodSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  date: { type: String, required: true },
  mood: { type: String },
  journal: { type: String },
});

module.exports = mongoose.model("mood", moodSchema);
