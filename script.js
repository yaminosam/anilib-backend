// FIXED: Removed the space at the start of the URL
const API_URL = "https://anilib-9ikc.onrender.com/api";

// FIXED: Changed 'anime-grid' to 'anime-list' to match your CSS
const grid = document.getElementById('anime-list');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const modal = document.getElementById('anime-modal');
const closeBtn = document.querySelector('.close-btn');

// 1. Fetch Top Anime on Load
window.addEventListener('load', () => {
    getAnime(`${API_URL}/top`);
});

// 2. Search Functionality
// Allow clicking the button
searchBtn.addEventListener('click', (e) => {
    e.preventDefault(); // STOP the page from reloading
    performSearch();
});

// Allow pressing "Enter" key
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // STOP the page from reloading
        performSearch();
    }
});

// The actual search logic (moved to a function so we don't repeat code)
function performSearch() {
    const query = searchInput.value;
    if(query) {
        // Update the title to show what we are searching for
        const sectionTitle = document.getElementById('section-title');
        if (sectionTitle) sectionTitle.innerText = `Search Results for "${query}"`;
        
        getAnime(`${API_URL}/search?q=${query}`);
    }
}

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

// 4. Render Anime Cards (Click opens Modal)
function showAnime(animeList) {
    const grid = document.getElementById('anime-list');
    grid.innerHTML = '';
    
    animeList.forEach(anime => {
        const { title, images, score } = anime;
        
        const animeEl = document.createElement('div');
        animeEl.classList.add('anime-card');
        
        animeEl.innerHTML = `
            <img src="${images.jpg.large_image_url}" alt="${title}">
            <div class="card-content">
                <h3 class="card-title">${title}</h3>
                <p style="color: #bbb; font-size: 0.9rem;">⭐ ${score || 'N/A'}</p>
            </div>
        `;
        
        // CLICKING CARD OPENS MODAL
        animeEl.addEventListener('click', () => openModal(anime));
        
        grid.appendChild(animeEl);
    });
}

// 5. Modal Logic (With Watch Link!)
function openModal(anime) {
    const modal = document.getElementById('anime-modal');
    
    // Fill in the details
    document.getElementById('modal-title').innerText = anime.title;
    document.getElementById('modal-img').src = anime.images.jpg.large_image_url;
    document.getElementById('modal-synopsis').innerText = anime.synopsis || "No description available.";
    
    // 👇 UPDATE THE WATCH BUTTON LINK 👇
    const watchLink = document.getElementById('modal-watch-link');
    // Create a smart search link for Crunchyroll
    watchLink.href = `https://www.crunchyroll.com/search?q=${anime.title}`;
    
    // Show the modal
    modal.style.display = 'flex';
}

// Close Modal Logic (Keep this from before)
const closeBtn = document.querySelector('.close-btn');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('anime-modal').style.display = 'none';
    });
}
window.addEventListener('click', (e) => {
    const modal = document.getElementById('anime-modal');
    if (e.target == modal) {
        modal.style.display = 'none';
    }
});