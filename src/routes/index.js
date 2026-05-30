const express = require('express');
const authRoutes = require('./auth');
const apiRoutes = require('./api');

const router = express.Router();

router.use('/', authRoutes);
router.use('/api', apiRoutes);

module.exports = router;
