const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const isAdmin = (user) => user?.role === "Admin";

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({ name, email, password, role: "Elderly" });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ message: "User registered successfully", user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "This account is deactivated. Contact an administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const listUsersByRole = async (req, res) => {
  try {
    const role = req.query.role;
    const query = role ? { role } : {};
    const users = await User.find(query).select("name email role");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listUsersForAdmin = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const role = req.query.role;
    const active = req.query.active;
    const q = (req.query.q || "").trim();

    const query = {};
    if (role) query.role = role;
    if (active === "true") query.isActive = true;
    if (active === "false") query.isActive = false;
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email role isActive createdAt updatedAt")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setUserActiveStatus = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can update user status" });
    }

    const { isActive } = req.body || {};
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive (boolean) is required" });
    }

    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (target._id.toString() === req.user?.id?.toString() && !isActive) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }

    target.isActive = isActive;
    await target.save();

    res.json({
      message: `User ${isActive ? "activated" : "deactivated"}`,
      user: {
        _id: target._id,
        name: target.name,
        email: target.email,
        role: target.role,
        isActive: target.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUserAccount = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Only admins can delete users" });
    }

    const target = await User.findById(req.params.id).select("_id");
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (target._id.toString() === req.user?.id?.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(userId).select("name email role createdAt updatedAt");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { name, currentPassword, newPassword } = req.body || {};
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "currentPassword is required to set a new password" });
      }
      const matches = await bcrypt.compare(currentPassword, user.password);
      if (!matches) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      message: "Profile updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  listUsersByRole,
  listUsersForAdmin,
  setUserActiveStatus,
  deleteUserAccount,
  getCurrentUser,
  updateCurrentUser,
};
