import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get all plans (Public - shown on landing and dashboard)
router.get("/", async (req, res) => {
    try {
        const [plans] = await pool.query("SELECT * FROM plans ORDER BY price ASC");
        res.json(plans);
    } catch (error) {
        console.error("Fetch Plans Error:", error);
        res.status(500).json({ message: "Failed to fetch plans" });
    }
});

export default router;
