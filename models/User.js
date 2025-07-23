const mongoose = require("mongoose"); // ✅ This line was missing

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String, // hashed
});

module.exports = mongoose.model("User", UserSchema);
