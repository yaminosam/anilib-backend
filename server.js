// server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose'); // <--- IMPORT MONGOOSE
const Anime = require('./models/anime.js'); // <--- IMPORT YOUR MODEL

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // <--- IMPORTANT: Allows server to read JSON data sent from frontend

// 1. Connect to MongoDB (Local Database)
// Connect directly (No variable)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// --- ROUTES ---

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

// [NEW] Add Anime to Watchlist
app.post('/api/favorites', async (req, res) => {
    const { mal_id, title, image_url, score } = req.body; // Data sent from frontend

    try {
        // Check if already exists
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

// [NEW] Get My Watchlist
app.get('/api/favorites', async (req, res) => {
    try {
        const favorites = await Anime.find();
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching watchlist' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Replace <password> with the real password you created in Step 3!
const DB_URI = "mongodb+srv://sohamsonawane:soham@soham@anilib.8s2bfha.mongodb.net/?appName=AniLIB"; 

