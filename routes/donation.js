const express = require("express");
const router = express.Router();
const Donation = require("../models/Donation");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const {
      foodName,
      quantity,
      expiry,
      description,
      address,
      location
    } = req.body;

    const newDonation = new Donation({
      userId: req.user.id,
      foodName,
      quantity,
      expiry,
      description,
      address: JSON.parse(address),
      location: JSON.parse(location),
      imageUrl: req.file?.path
    });

    await newDonation.save();
    res.status(201).json({ msg: "Donation submitted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
});

module.exports = router;
