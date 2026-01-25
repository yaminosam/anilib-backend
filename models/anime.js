// models/Anime.js
const mongoose = require('mongoose');

// This defines the structure of a "Saved Anime"
const AnimeSchema = new mongoose.Schema({
    mal_id: { type: Number, required: true, unique: true }, // The unique ID from Jikan
    title: { type: String, required: true },
    image_url: { type: String },
    score: { type: Number },
    watched: { type: Boolean, default: false } // To track if you finished it
});

module.exports = mongoose.model('Anime', AnimeSchema);