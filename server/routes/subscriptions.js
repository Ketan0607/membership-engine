import express from "express";
import pool from "../db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Subscribe to a plan (simulated logic)
router.post("/subscribe/:planId", requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const planId = req.params.planId;

        // Check if plan exists
        const [plans] = await pool.query("SELECT * FROM plans WHERE id=?", [planId]);
        const plan = plans[0];

        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        // In a real app, process payment here before inserting

        // Calculate dates
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + plan.duration_days);

        // Expire any existing active subscriptions for this user
        await pool.query(
            "UPDATE subscriptions SET status='cancelled' WHERE user_id=? AND status='active'",
            [userId]
        );

        // Insert new subscription
        await pool.query(
            "INSERT INTO subscriptions (user_id, plan_id, start_date, end_date) VALUES (?, ?, ?, ?)",
            [userId, planId, start, end]
        );

        res.json({ success: true, message: `Subscribed to ${plan.name} successfully!` });
    } catch (error) {
        console.error("Subscribe Error:", error);
        res.status(500).json({ message: "Failed to process subscription" });
    }
});

// Get user's current ACTIVE subscription
router.get("/my", requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;

        // We check that end_date is realistically still active, but DB query will mostly rely on status
        const [rows] = await pool.query(`
      SELECT s.*, p.name, p.tier_level, p.price, p.description
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = ? AND s.status = 'active' AND s.end_date >= CURDATE()
      ORDER BY s.end_date DESC
      LIMIT 1
    `, [userId]);

        res.json(rows[0] || null);
    } catch (error) {
        console.error("Get Subscription Error:", error);
        res.status(500).json({ message: "Failed to load subscription info" });
    }
});

export default router;
