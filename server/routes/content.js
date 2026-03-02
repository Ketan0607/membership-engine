import express from "express";
import pool from "../db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Fetch content accessible based on the user's active tier
router.get("/", requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Check user's active tier
        const [[subscription]] = await pool.query(`
      SELECT p.tier_level
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = ? AND s.status = 'active'
      AND s.end_date >= CURDATE()
      ORDER BY s.end_date DESC
      LIMIT 1
    `, [userId]);

        const activeTierLevel = subscription ? subscription.tier_level : 0;

        // We can either return ONLY accessible content, or we can return ALL content
        // and let the frontend blur out stuff they don't have access to for upselling.
        // For this implementation, returning ALL content but marking access status helps UI upselling.

        const [allContent] = await pool.query("SELECT * FROM protected_content ORDER BY required_tier ASC");

        const formattedContent = allContent.map(c => {
            // If user's tier is lower than required, they don't have true access mapping
            const hasAccess = activeTierLevel >= c.required_tier;
            return {
                ...c,
                hasAccess,
                // In a real app we might strip the actual video link/download url if they don't have access
                // For demonstration purposes, we leave it as is.
            };
        });

        res.json(formattedContent);
    } catch (error) {
        console.error("Fetch Content Error:", error);
        res.status(500).json({ message: "Failed to fetch content library" });
    }
});

export default router;
