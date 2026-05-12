const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../models/User')

const register = async (req, res) => {
  try {
    const user = new User(req.body)
    await user.save()
    res.status(201).json({ message: 'User registered successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' })

     const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

     res.cookie('token', token, {
      httpOnly: true,  // http only cookie
      maxAge: 24 * 60 * 60 * 1000 // 1 day in ms
    })

    res.json({ message: 'Login successful', user: { email: user.email, name: user.name, role: user.role } })
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
}

const getProfile = async (req, res) => {
  try {
    const email = req.query.email 
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get profile', error: err.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { email, ...updates } = req.body
    const user = await User.findOneAndUpdate({ email }, updates, { new: true })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message })
  }
}

const logout = (req, res) => {
  res.clearCookie('token') // Clear the JWT cookie
  res.redirect('/login')
}

module.exports = { register, login, getProfile, updateProfile, logout }
