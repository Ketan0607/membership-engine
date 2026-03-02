import express from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Register Action
router.post("/register", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user already exists
        const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user (default role 'member')
        await pool.query(
            "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
            [fullName, email, hashedPassword]
        );

        res.status(201).json({ success: true, message: "Registration successful. You can log in now." });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// Login Action
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare passwords
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Set session
        req.session.user = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role
        };

        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ message: "Session save failed" });
            }
            res.json({ success: true, message: "Logged in successfully", user: req.session.user });
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
});

// Logout Action
router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Could not log out" });
        }
        res.clearCookie("connect.sid"); // Adjust cookie name if using a different one
        res.json({ success: true, message: "Logged out successfully" });
    });
});

// Get Current User (to check session state on page load)
router.get("/me", (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.json({ user: null });
    }
});

// Update Profile
import { requireAuth } from "../middleware/authMiddleware.js";
router.put("/profile", requireAuth, async (req, res) => {
    try {
        const { fullName } = req.body;
        const userId = req.session.user.id;

        if (!fullName) {
            return res.status(400).json({ message: "Full name is required" });
        }

        await pool.query("UPDATE users SET full_name = ? WHERE id = ?", [fullName, userId]);

        // Update session
        req.session.user.fullName = fullName;

        res.json({ success: true, message: "Profile updated successfully", user: req.session.user });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

export default router;
