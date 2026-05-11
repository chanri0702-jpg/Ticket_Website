const express = require('express')
const router = express.Router()
const enqueryController = require('../controllers/enqueryController')

router.post('/',enqueryController.createQuery)       // user submits a query
router.get('/user/:email',enqueryController.getUserQueries)    // user sees their queries
router.get('/',enqueryController.getAllQueries)      // admin sees all queries
router.put('/:id',enqueryController.respondToQuery)    // admin responds to query

module.exports = router