const connectToMongo = require("./connect");
const Message = require("./schema");
const { insertMessages } = require("./crud");

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const main = async () => {
  const messages = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../messages.json"))
  );
  await connectToMongo();
  await insertMessages(messages);
  await mongoose.disconnect();
};

main();
