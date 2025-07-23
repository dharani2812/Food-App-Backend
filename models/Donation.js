const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  foodName: String,
  quantity: Number,
  expiry: Date,
  description: String,
  address: {
    street: String,
    city: String,
    pincode: String
  },
  location: {
    lat: Number,
    lng: Number
  },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Donation", donationSchema);
