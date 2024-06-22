const mongoose = require("mongoose");

function connectDb(db) {
  mongoose
    .connect(`mongodb://127.0.0.1:27017/${db}`)
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.log(err);
    });
}

module.exports = connectDb;
