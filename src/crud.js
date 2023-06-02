const Contact = require("./schema");

const insertMessages = async (contacts) => {
  try {
    const result = await Contact.bulkWrite(
      contacts.map((message) => ({
        insertOne: {
          document: message,
        },
      })),
      { ordered: true, w: 1 }
    );
    console.log(`${result.insertedCount} messages inserted`);
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  insertMessages,
};
