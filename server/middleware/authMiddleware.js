export const requireAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    return res.status(401).json({ message: "Login required" });
};

export const requireAdmin = (req, res, next) => {
    if (req.session.user?.role === "admin") {
        return next();
    }
    return res.status(403).json({ message: "Admin only" });
};
