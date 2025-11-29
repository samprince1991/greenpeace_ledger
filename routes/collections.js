const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorize');

// Get all collections (requires view_all permission)
router.get('/', requireAuth, requirePermission('view_all'), collectionController.getCollections);

// Create a new collection (requires add_collection permission)
router.post('/', requireAuth, requirePermission('add_collection'), collectionController.createCollection);

// Delete a collection (requires delete_collection permission)
router.delete('/:id', requireAuth, requirePermission('delete_collection'), collectionController.deleteCollection);

module.exports = router;

