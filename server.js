// server.js
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose'); // <--- IMPORT MONGOOSE
const Anime = require('./models/anime.js'); // <--- IMPORT YOUR MODEL
const path = require('path'); // <--- IMPORT PATH
const fs = require('fs'); // <--- IMPORT FS

const app = express();
const PORT = 5000;

// Local DB Fallback Setup
const LOCAL_DB_PATH = path.join(__dirname, 'local_db.json');
if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify([], null, 2));
}

let dbMode = 'mongodb';

// Local DB utility functions
const readLocalDB = () => {
    try {
        const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading local DB:", err);
        return [];
    }
};

const writeLocalDB = (data) => {
    try {
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error("Error writing to local DB:", err);
        return false;
    }
};

// Middleware
app.use(cors());
app.use(express.json()); // Allows server to read JSON data sent from frontend

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Connect to MongoDB with local DB fallback
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB Atlas");
        dbMode = 'mongodb';
    })
    .catch(err => {
        console.error("❌ MongoDB connection error:", err.message);
        console.log("⚠️ Falling back to Local File DB storage (local_db.json)");
        dbMode = 'local';
    });

// --- API ROUTES ---

// Get Top Anime (Proxy)
app.get('/api/top', async (req, res) => {
    try {
        const response = await axios.get('https://api.jikan.moe/v4/top/anime');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching top anime' });
    }
});

// Search Anime (Proxy)
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${q}&sfw`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error searching anime' });
    }
});

// Get Anime Detail by MAL ID (Proxy)
app.get('/api/anime/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime/${id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching anime details' });
    }
});

// Add Anime to Watchlist
app.post('/api/favorites', async (req, res) => {
    const { mal_id, title, image_url, score } = req.body;

    if (dbMode === 'local') {
        const favorites = readLocalDB();
        const existing = favorites.find(item => item.mal_id === Number(mal_id));
        if (existing) {
            return res.status(400).json({ message: 'Anime already in watchlist!' });
        }
        const newAnime = { mal_id: Number(mal_id), title, image_url, score, watched: false };
        favorites.push(newAnime);
        writeLocalDB(favorites);
        return res.status(201).json({ message: 'Anime added to Watchlist!', data: newAnime });
    }

    try {
        // Check if already exists in MongoDB
        const existingAnime = await Anime.findOne({ mal_id });
        if (existingAnime) {
            return res.status(400).json({ message: 'Anime already in watchlist!' });
        }

        // Save new anime
        const newAnime = new Anime({ mal_id, title, image_url, score });
        await newAnime.save();

        res.status(201).json({ message: 'Anime added to Watchlist!' });
    } catch (error) {
        res.status(500).json({ error: 'Error saving anime' });
    }
});

// Get My Watchlist
app.get('/api/favorites', async (req, res) => {
    if (dbMode === 'local') {
        const favorites = readLocalDB();
        return res.json(favorites);
    }

    try {
        const favorites = await Anime.find();
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching watchlist' });
    }
});

// Remove Anime from Watchlist
app.delete('/api/favorites/:mal_id', async (req, res) => {
    const { mal_id } = req.params;

    if (dbMode === 'local') {
        const favorites = readLocalDB();
        const updated = favorites.filter(item => item.mal_id !== Number(mal_id));
        if (favorites.length === updated.length) {
            return res.status(404).json({ message: 'Anime not found in watchlist!' });
        }
        writeLocalDB(updated);
        return res.json({ message: 'Anime removed from Watchlist!' });
    }

    try {
        const deletedAnime = await Anime.findOneAndDelete({ mal_id: Number(mal_id) });
        if (!deletedAnime) {
            return res.status(404).json({ message: 'Anime not found in watchlist!' });
        }
        res.json({ message: 'Anime removed from Watchlist!' });
    } catch (error) {
        res.status(500).json({ error: 'Error removing anime' });
    }
});

// Toggle/Update watched status of Anime in Watchlist
app.patch('/api/favorites/:mal_id', async (req, res) => {
    const { mal_id } = req.params;
    const { watched } = req.body;

    if (dbMode === 'local') {
        const favorites = readLocalDB();
        const idx = favorites.findIndex(item => item.mal_id === Number(mal_id));
        if (idx === -1) {
            return res.status(404).json({ message: 'Anime not found in watchlist!' });
        }
        favorites[idx].watched = Boolean(watched);
        writeLocalDB(favorites);
        return res.json({ message: 'Watchlist status updated!', data: favorites[idx] });
    }

    try {
        const updatedAnime = await Anime.findOneAndUpdate(
            { mal_id: Number(mal_id) },
            { $set: { watched: Boolean(watched) } },
            { new: true }
        );
        if (!updatedAnime) {
            return res.status(404).json({ message: 'Anime not found in watchlist!' });
        }
        res.json({ message: 'Watchlist status updated!', data: updatedAnime });
    } catch (error) {
        res.status(500).json({ error: 'Error updating watchlist status' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
