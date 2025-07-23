// models/Food.js
const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema(
  {
    foodName: String,
    quantity: Number,
    expiry: Date,
    description: String,
    image: String,
    location: {
      lat: Number,
      lng: Number,
    },
    address: {
      street: String,
      city: String,
      pincode: String,
    },
    status: {
      type: String,
      default: "available", // 'available', 'requested', 'pickedup'
    },
    requestedAt: { type: Date },
    pickedUpAt: { type: Date },
    requesterName: { type: String },
    requesterPhone: { type: String },

    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to user who donated
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to user who requested
    },
    imageUrl: String, // for rendering image
    donorId: mongoose.Schema.Types.ObjectId, // used to fetch donations
  },
  { timestamps: true }
);

module.exports = mongoose.model("Food", FoodSchema);
