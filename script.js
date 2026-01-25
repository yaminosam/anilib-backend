// script.js
// We point this to YOUR backend now!
const API_URL = " https://anilib-9ikc.onrender.com";
const grid = document.getElementById('anime-grid');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const modal = document.getElementById('anime-modal');
const closeBtn = document.querySelector('.close-btn');

// 1. Fetch Top Anime on Load
window.addEventListener('load', () => {
    // OLD: getAnime(`${API_URL}/top/anime`);
    // NEW:
    getAnime(`${API_URL}/top`);
});

// 2. Search Functionality
searchBtn.addEventListener('click', () => {
    const query = searchInput.value;
    if(query) {
        document.getElementById('section-title').innerText = `Search Results for "${query}"`;
        // OLD: getAnime(`${API_URL}/anime?q=${query}&sfw`);
        // NEW:
        getAnime(`${API_URL}/search?q=${query}`);
    }
});

// 3. Fetch Data from API
async function getAnime(url) {
    grid.innerHTML = '<p>Loading...</p>';
    try {
        const res = await fetch(url);
        const data = await res.json();
        showAnime(data.data);
    } catch (error) {
        grid.innerHTML = '<p>Error fetching data. Please try again.</p>';
        console.error(error);
    }
}

// 4. Render Anime Cards
function showAnime(animeList) {
    grid.innerHTML = '';
    
    animeList.forEach(anime => {
        const { title, images, score, mal_id } = anime;
        
        const animeEl = document.createElement('div');
        animeEl.classList.add('card');
        
        animeEl.innerHTML = `
            <img src="${images.jpg.large_image_url}" alt="${title}">
            <div class="card-score">${score || 'N/A'}</div>
            <div class="card-content">
                <h3 class="card-title">${title}</h3>
            </div>
        `;
        
        // Add click event to open details
        animeEl.addEventListener('click', () => openModal(anime));
        
        grid.appendChild(animeEl);
    });
}

// 5. Modal Logic (Show Details)
function openModal(anime) {
    document.getElementById('modal-title').innerText = anime.title;
    document.getElementById('modal-img').src = anime.images.jpg.large_image_url;
    document.getElementById('modal-synopsis').innerText = anime.synopsis || "No description available.";
    document.getElementById('modal-rating').innerText = anime.score;
    document.getElementById('modal-episodes').innerText = anime.episodes || "Unknown";
    document.getElementById('modal-status').innerText = anime.status;
    document.getElementById('modal-link').href = anime.url;
    
    // Genres
    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = '';
    anime.genres.forEach(genre => {
        const tag = document.createElement('span');
        tag.innerText = genre.name;
        tagsContainer.appendChild(tag);
    });

    modal.style.display = 'flex';
}

// Close Modal
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.style.display = 'none';
    }
});