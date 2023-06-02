const mongoose = require("mongoose");

const connectToMongo = async () => {
  try {
    await mongoose.connect("mongodb://localhost:30000/send_message_db", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectToMongo;
