const User = require('../models/user');
const bcrypt = require('bcrypt');

// Helper function to validate email format
const isValidEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

// Helper function to validate password strength
const isStrongPassword = (password) => {
    if (password.length < 6) return false;
    // Optional: Add more strength requirements
    // if (!/[A-Z]/.test(password)) return false; // Needs uppercase
    // if (!/[0-9]/.test(password)) return false; // Needs number
    return true;
};

// Helper to send consistent error responses
const sendError = (res, status, message, field = null) => {
    return res.status(status).json({
        success: false,
        error: message,
        field: field
    });
};

// Show login page
const getLogin = (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login', { error: null, formData: {} });
};

// Handle login
const postLogin = async (req, res) => {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email and password are required',
            field: !email ? 'email' : 'password'
        });
    }
    
    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please enter a valid email address',
            field: 'email'
        });
    }
    
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            // Don't reveal if email exists or not (security best practice)
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        // Store user in session (exclude sensitive data)
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        
        // Successful login
        return res.json({
            success: true,
            message: 'Login successful',
            redirect: '/'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'An internal error occurred. Please try again later.'
        });
    }
};

// Show register page
const getRegister = (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('register', { error: null, formData: {} });
};

// Handle registration
const postRegister = async (req, res) => {
    const { name, surname, email, phone, password, confirmPassword } = req.body;
    
    // Collect validation errors
    const errors = [];
    
    // Name validation
    if (!name || name.trim().length < 2) {
        errors.push({ field: 'name', message: 'First name must be at least 2 characters' });
    }
    
    if (!surname || surname.trim().length < 2) {
        errors.push({ field: 'surname', message: 'Last name must be at least 2 characters' });
    }
    
    // Email validation
    if (!email) {
        errors.push({ field: 'email', message: 'Email is required' });
    } else if (!isValidEmail(email)) {
        errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }
    
    // Phone validation
    if (!phone) {
        errors.push({ field: 'phone', message: 'Phone number is required' });
    } else if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone)) {
        errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
    }
    
    // Password validation
    if (!password) {
        errors.push({ field: 'password', message: 'Password is required' });
    } else if (!isStrongPassword(password)) {
        errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
    }
    
    if (password !== confirmPassword) {
        errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }
    
    // Return all validation errors
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }
    
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'An account with this email already exists',
                field: 'email'
            });
        }
        
        // Create new user
        const newUser = new User({
            name: name.trim(),
            surname: surname.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password: password
        });
        
        await newUser.save();
        
        return res.status(201).json({
            success: true,
            message: 'Registration successful! Please login.',
            redirect: '/auth/login'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'This email is already registered',
                field: 'email'
            });
        }
        
        return res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again later.'
        });
    }
};

// Handle logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                error: 'Logout failed. Please try again.'
            });
        }
        // Clear cookie and redirect to home
         res.redirect('/');
    });
};

// Get current user
const getCurrentUser = (req, res) => {
    if (req.session.user) {
        return res.json({
            success: true,
            user: req.session.user
        });
    }
    return res.json({
        success: true,
        user: null
    });
};

module.exports = {
    getLogin,
    postLogin,
    getRegister,
    postRegister,
    logout,
    getCurrentUser
};