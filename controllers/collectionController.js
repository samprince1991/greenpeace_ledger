const collectionService = require('../models/collectionService');

/**
 * Get all collections
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getCollections(req, res) {
  try {
    const { month } = req.query;
    const collections = await collectionService.getAll(month);
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
}

/**
 * Create a new collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createCollection(req, res) {
  try {
    const collection = await collectionService.create(req.body);
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    if (error.message.includes('required')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create collection' });
  }
}

/**
 * Delete a collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteCollection(req, res) {
  try {
    const { id } = req.params;
    const deleted = await collectionService.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
}

module.exports = {
  getCollections,
  createCollection,
  deleteCollection
};

