const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  message: String,
  sender: String,
  receiver: String,
  phone: String,
  timestamp: Date,
});

module.exports = mongoose.model("Contact", contactSchema);
