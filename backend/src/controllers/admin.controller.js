const User = require("../models/user.model");

async function getUsers(req, res) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ message: "Users fetched successfully", users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
}

module.exports = { getUsers };
