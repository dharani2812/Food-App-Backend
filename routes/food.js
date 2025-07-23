import express from "express";
import Food from "../models/Food.js";
import upload from "../middleware/upload.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { sendEmail } from "../utils/mailer.js";
import cron from "node-cron";


const router = express.Router();

// ✅ POST a new food donation
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const donorId = req.user.id;
    const { foodName, quantity, expiry, description } = req.body;
    const address = JSON.parse(req.body.address);
    const location = JSON.parse(req.body.location);

    const food = new Food({
      donorId,
      foodName,
      quantity,
      expiry,
      description,
      address,
      location,
      image: req.file.filename,
    });

    await food.save();

    // ✅ Send email to admin or notify volunteers here
    await sendEmail(
      "admin@example.com",
      "New Food Donation",
      `
    <h3>🍱 New Donation Received</h3>
    <p><strong>Donor ID:</strong> ${donorId}</p>
    <p><strong>Food:</strong> ${foodName}</p>
    <p><strong>Quantity:</strong> ${quantity}</p>
    <p><strong>Expires at:</strong> ${expiry}</p>
    <p><strong>Description:</strong> ${description}</p>
    <p><strong>Address:</strong> ${address.street}, ${address.city}, ${address.pincode}</p>
  `
    );

    res.status(201).json({ msg: "Donation submitted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ✅ GET /api/food - fetch all food donations
router.get("/", async (req, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) {
    console.error("❌ Error fetching foods:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET /api/food/requested
router.get("/requested", async (req, res) => {
  try {
    const requestedFoods = await Food.find({ status: "Requested" });
    res.json(requestedFoods);
  } catch (err) {
    console.error("❌ Error fetching requested foods:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ PUT /api/food/request/:id
// ✅ PUT /api/food/request/:id
router.put("/request/:id", async (req, res) => {
  try {
    const { requesterId, requesterName, requesterPhone } = req.body;
    console.log("🔍 Incoming request for food ID:", req.params.id);
    console.log("📥 Request body:", req.body);

    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    if (food.status.toLowerCase() !== "available") {
      console.error(
        "❌ Food already requested or picked up. Status:",
        food.status
      );
      return res
        .status(400)
        .json({ message: "Food already requested or picked up" });
    }

    // ✅ Update food item
    food.status = "Requested";
    food.requesterId = requesterId;
    food.requesterName = requesterName;
    food.requesterPhone = requesterPhone;
    food.requestedAt = new Date();
    await food.save();

    // ✅ Fetch donor using donorId
    const donor = await User.findById(food.donorId); // fixed here
    if (donor && donor.email) {
      const subject = `🍱 Your food "${food.foodName}" has been requested!`;
      const message = `
Hello ${donor.name},

Your food donation "${food.foodName}" has been requested!

Requester Details:
📛 Name: ${requesterName}
📞 Phone: ${requesterPhone}

Please get in touch with them to arrange pickup.

Thank you for contributing to reduce food waste! 🙏
      `;

      await sendEmail(donor.email, subject, message);
      console.log("📧 Email sent to:", donor.email);
    } else {
      console.warn("⚠️ Donor or donor email not found.");
    }

    res.json({ message: "Request submitted and email sent to donor." });
  } catch (err) {
    console.error("❌ Error in request route:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT /api/food/pickup/:id
// PUT /api/food/pickup/:id
router.put("/pickup/:id", async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ msg: "Food not found" });
    }

    if (food.pickedUp) {
      return res.status(400).json({ msg: "Food already picked up" });
    }

    food.pickedUp = true;
    food.pickedUpAt = new Date();

    await food.save();

    res.status(200).json({ msg: "Marked as picked up", food });
  } catch (err) {
    console.error("❌ Pickup error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});


router.get("/test-email", async (req, res) => {
  try {
    await sendEmail(
      "youremail@gmail.com",
      "Test Subject",
      "This is a test email from Food App"
    );
    res.send("✅ Test email sent.");
  } catch (error) {
    console.error("❌ Test email failed:", error);
    res.status(500).send("❌ Failed to send test email.");
  }
});

// Run every minute to clean up expired or old picked-up food
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // 1. Delete expired food
    const expiredResult = await Food.deleteMany({
      expiry: { $lt: now },
    });

    // 2. Delete picked up food older than 1 hour
    const pickedUpResult = await Food.deleteMany({
      pickedUp: true,
      pickedUpAt: { $lt: new Date(now.getTime() - 60 * 60 * 1000) }, // 1 hour ago
    });

    if (expiredResult.deletedCount > 0 || pickedUpResult.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${expiredResult.deletedCount + pickedUpResult.deletedCount} old food items`);
    }
  } catch (err) {
    console.error("❌ Error cleaning food items:", err.message);
  }
});

// Cancel the request and make food available again
// Cancel food request (make it available again)
router.put("/cancel/:id", async (req, res) => {
  try {
    const foodId = req.params.id;
    const food = await Food.findById(foodId);

    if (!food) return res.status(404).json({ error: "Food not found" });

    // Reset request info
    food.status = "available";
    food.requesterId = null;
    food.requesterName = null;
    food.requesterPhone = null;
    food.requestedAt = null;

    await food.save();
    res.json({ message: "Request cancelled", food });
  } catch (err) {
    console.error("❌ Cancel request error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET donations by donor ID
// ✅ Get all donations by a donor
router.get("/donations", async (req, res) => {
  try {
    const { donorId } = req.query;
    if (!donorId) {
      return res.status(400).json({ msg: "Missing donorId" });
    }

    const donations = await Food.find({ donorId }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    console.error("❌ Error fetching donations:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ DELETE /api/food/:id - Delete a food item
router.delete("/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) {
      return res.status(404).json({ msg: "Food not found" });
    }
    res.json({ msg: "Food deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting food:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const foodId = req.params.id;
    const updates = {
      foodName: req.body.foodName,
      quantity: req.body.quantity,
      expiry: req.body.expiry,
      description: req.body.description,
      location: JSON.parse(req.body.location),
      address: JSON.parse(req.body.address),
    };

    if (req.file) {
      updates.image = req.file.filename;
    }

    const updatedFood = await Food.findByIdAndUpdate(foodId, updates, { new: true });

    if (!updatedFood) {
      return res.status(404).json({ msg: "Food not found" });
    }

    res.json({ msg: "Food updated successfully", updatedFood });
  } catch (err) {
    console.error("❌ Update error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});


export default router;
