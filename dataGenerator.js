const casual = require("casual");
const moment = require("moment");
const fs = require("fs");

const messages = [];

for (let i = 0; i < 100000; i++) {
  messages.push({
    message: casual.sentence,
    sender: casual.full_name,
    receiver: casual.full_name,
    phone: casual.phone,
    timestamp: moment(casual.date("YYYY-MM-DD")).toDate(),
  });
}

fs.writeFileSync("messages.json", JSON.stringify(messages));
console.log("Messages file generated successfully!");
