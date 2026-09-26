const crypto = require("crypto");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const transporter = require("../config/NodemailerConfig");
const passwordUtils = require("../utils/Password-utils");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const registerUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      email,
      password: await passwordUtils.hashPassword(password),
      verified: true,
    });

    const token = generateToken(user._id);
    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const sendOTP = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    let user = await User.findOne({ email });
    if (user && user.verified) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await passwordUtils.hashPassword(password);

    if (!user) {
      user = new User({
        email,
        password: hashedPassword,
        otp,
        otpExpiry,
      });
    } else {
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpiry = otpExpiry;
    }

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.verified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({ message: "User verified successfully", token });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email or password missing" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValid = await passwordUtils.verifyPassword(password, user.password);

    if (!isValid) {
      const trimmedValid = await passwordUtils.verifyPassword(
        password.trim(),
        user.password,
      );

      if (!trimmedValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
    }

    const token = generateToken(user._id);
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.otp;
    delete safeUser.otpExpiry;
    delete safeUser.resetToken;
    delete safeUser.resetTokenExpiry;
    res.json({ user: safeUser, token });
  } catch (error) {
    console.error("\nError in login process:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomInt(100000, 999999).toString();
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Your password reset code is ${resetToken}. It expires in 10 minutes.`,
    });

    res.status(200).json({ message: "Reset code sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  try {
    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      !newPassword.trim()
    ) {
      return res.status(400).json({
        message: "New password is required and must be a non-empty string",
      });
    }

    const user = await User.findOne({
      email,
      resetToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password = await passwordUtils.hashPassword(newPassword);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  registerUser,
  sendOTP,
  verifyOTP,
  loginUser,
  forgotPassword,
  resetPassword,
};
