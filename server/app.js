import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/auth.js';
import plansRoutes from './routes/plans.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import contentRoutes from './routes/content.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'super_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/content', contentRoutes);

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../public')));

// Fallback logic for SPA-like behavior (optional, useful if we used window.history)
// Mostly we have discrete HTML files
app.get('*', (req, res) => {
    // If requesting a file that doesn't exist, just send them to index.html
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Membership Engine running at http://localhost:${PORT}`);
});
