const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  Pid: String,
  Name: String,
  Price: Number,
  Category: String,
  Food_Available: String,
  Imageid: String
});

module.exports = mongoose.model("Food", productSchema);
