const Enquery = require('../models/enquery')

const createQuery = async (req, res) => {
  try {
    const query = new Enquery(req.body)
    await query.save()
    res.status(201).json(query)
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit query', error: err.message })
  }
}

const getUserQueries = async (req, res) => {
  try {
    const queries = await Enquery.find({ email: req.params.email })
    res.json(queries)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get queries', error: err.message })
  }
}

const getAllQueries = async (req, res) => {
  try {
    const queries = await Enquery.find().sort({ createdAt: -1 })
    res.json(queries)
  } catch (err) {
    res.status(500).json({ message: 'Failed to get queries', error: err.message })
  }
}

const respondToQuery = async (req, res) => {
  try {
    const { response, status } = req.body
    const query = await Enquery.findByIdAndUpdate(
      req.params.id,
      { 
        response, 
        status, 
        resolvedAt: status === 'resolved' ? new Date() : null 
      },
      { new: true }
    )
    if (!query) return res.status(404).json({ message: 'Query not found' })
    res.json(query)
  } catch (err) {
    res.status(500).json({ message: 'Failed to respond to query', error: err.message })
  }
}

module.exports = { createQuery, getUserQueries, getAllQueries, respondToQuery }
