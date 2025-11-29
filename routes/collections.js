const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');

// Get all collections
router.get('/', collectionController.getCollections);

// Create a new collection
router.post('/', collectionController.createCollection);

// Delete a collection
router.delete('/:id', collectionController.deleteCollection);

module.exports = router;

