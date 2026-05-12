const User = require('../models/user');
const bcrypt = require('bcrypt');

// Show registration page
const getRegister = (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('register', { error: null });
};

// Handle registration
const postRegister = async (req, res) => {
    const { name, surname, email, phone, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }
    
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email already in use' });
        }
        
        const newUser = new User({ name, surname, email, phone, password });
        await newUser.save();
        
        res.status(201).json({ success: true, message: 'Registration successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
};

// Show login page
const getLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
};

// Handle login
const postLogin = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
        
        req.session.user = {
            id: user._id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            phone: user.phone,
            role: user.role
        };
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            redirect: user.role === 'admin' ? '/dashboard' : '/'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};

// Handle logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out' });
    });
};

// Get current user
const getCurrentUser = (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.json({ user: null });
    }
};

// MAKE SURE ALL ARE EXPORTED
module.exports = {
    getRegister,
    postRegister,
    getLogin,
    postLogin,
    logout,
    getCurrentUser
};