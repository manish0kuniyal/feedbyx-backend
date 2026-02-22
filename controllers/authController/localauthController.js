import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../../models/user.js";


export const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId: new mongoose.Types.ObjectId().toString(),
      name,
      email,
      password: hashedPassword,
      provider: "local",
    });

    const jwtToken = jwt.sign(
      { uid: user.userId },
      process.env.JWT_SECRET || "123jwt",
      { expiresIn: "7d" }
    );

   const isProd = process.env.NODE_ENV === "production";

res.cookie("token", jwtToken, {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

    res.status(201).json({ user });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.provider !== "local") {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const jwtToken = jwt.sign(
      { uid: user.userId },
      process.env.JWT_SECRET || "123jwt",
      { expiresIn: "7d" }
    );

  const isProd = process.env.NODE_ENV === "production";

res.cookie("token", jwtToken, {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

    res.json({ user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};