// middleware/auth.js
// This file provides functions for the ENTIRE TEAM to check user roles

// Check if user is admin
const isAdmin = (user) => {
    if (!user) return false;
    // Hardcoded for now - check by email
    return user.email === 'admin@ticketstream.com' || user.role === 'admin';
};

// Check if user is logged in
const isLoggedIn = (user) => {
    return user !== null && user !== undefined;
};

// Middleware to protect routes (only logged in users)
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Middleware to protect admin-only routes
const requireAdmin = (req, res, next) => {
    if (req.session.user && isAdmin(req.session.user)) {
        return next();
    }
    res.status(403).send('Admin access required');
};

// Make user available to all views (use in server.js)
const setUserLocals = (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAdmin = isAdmin;
    res.locals.isLoggedIn = isLoggedIn;
    next();
};

module.exports = {
    isAdmin,
    isLoggedIn,
    requireAuth,
    requireAdmin,
    setUserLocals
};