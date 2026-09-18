const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Custom logging middleware
const logBookAccess = (req, res, next) => {
    console.log(`[BookAPI] ${req.method} request to ${req.originalUrl}`);
    next();
};

// GET /api/books - List all books
router.get('/api/books', logBookAccess, async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/books/:id - Get single book by ID
router.get('/api/books/:id', logBookAccess, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.status(200).json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/books - Create new book
router.post('/api/books', async (req, res) => {
    try {
        const { title, author, price, genre, inStock } = req.body;
        const newBook = new Book({
            title,
            author,
            price,
            genre,
            inStock
        });
        const saved = await newBook.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/books/:id - Update book
router.put('/api/books/:id', async (req, res) => {
    try {
        const { title, author, price, genre, inStock } = req.body;
        const updated = await Book.findByIdAndUpdate(
            req.params.id,
            { title, author, price, genre, inStock },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/books/:id - Delete book
router.delete('/api/books/:id', async (req, res) => {
    try {
        const deleted = await Book.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
