const jwt = require('jsonwebtoken')

// verifies token exists and is valid
const protect = (req, res, next) => {
  const token = req.cookies.token
  if (!token) return res.redirect('/login')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { id, email, role }
    next()
  } catch (err) {
    res.clearCookie('token')
    res.redirect('/login')
  }
}

// restricts to admin role only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' })
  }
  next()
}

const decodeUser = (req) => {
  try {
    const jwt = require('jsonwebtoken')
    return jwt.verify(req.cookies.token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

module.exports = { protect, adminOnly, decodeUser }