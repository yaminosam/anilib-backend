const API_URL = "https://anilib-9ikc.onrender.com/api";
// We use 'anime-list' to match your CSS. 
// If this is null, the code will alert you!
const grid = document.getElementById('anime-list');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');

// 1. Fetch Top Anime on Load
window.addEventListener('load', () => {
    if (!grid) {
        console.error("ERROR: Could not find <div id='anime-list'> in HTML!");
        return;
    }
    getAnime(`${API_URL}/top`);
});

// 2. Search Functionality
if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch();
    });
}

if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
}

function performSearch() {
    const query = searchInput.value;
    if(query) {
        const sectionTitle = document.getElementById('section-title');
        if (sectionTitle) sectionTitle.innerText = `Search Results for "${query}"`;
        getAnime(`${API_URL}/search?q=${query}`);
    }
}

// 3. Fetch Data
async function getAnime(url) {
    if (!grid) return;
    grid.innerHTML = '<p style="color:white;">Loading...</p>';
    try {
        const res = await fetch(url);
        const data = await res.json();
        showAnime(data.data);
    } catch (error) {
        grid.innerHTML = '<p style="color:red;">Error fetching data. Check Console.</p>';
        console.error(error);
    }
}

// 4. Render Cards (Safety Version)
function showAnime(animeList) {
    if (!grid) return;
    grid.innerHTML = '';
    
    if (!animeList || animeList.length === 0) {
        grid.innerHTML = '<p>No results found.</p>';
        return;
    }

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
        
        // Add click listener safely
        animeEl.addEventListener('click', () => openModal(anime));
        
        grid.appendChild(animeEl);
    });
}

// 5. Open Modal (Safety Version)
function openModal(anime) {
    const modal = document.getElementById('anime-modal');
    if (!modal) {
        // Fallback if modal is missing: Just open Crunchyroll directly
        window.open(`https://www.crunchyroll.com/search?q=${anime.title}`, '_blank');
        return;
    }

    const titleEl = document.getElementById('modal-title');
    const imgEl = document.getElementById('modal-img');
    const descEl = document.getElementById('modal-synopsis');
    const watchLink = document.getElementById('modal-watch-link');

    // Fill data only if elements exist
    if (titleEl) titleEl.innerText = anime.title;
    if (imgEl) imgEl.src = anime.images.jpg.large_image_url;
    if (descEl) descEl.innerText = anime.synopsis || "No description available.";
    
    // Update Watch Button
    if (watchLink) {
        watchLink.href = `https://www.crunchyroll.com/search?q=${anime.title}`;
    }

    modal.style.display = 'flex';
}

// Close Modal Logic
const closeBtn = document.querySelector('.close-btn');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        const modal = document.getElementById('anime-modal');
        if(modal) modal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('anime-modal');
    if (e.target == modal) {
        modal.style.display = 'none';
    }
});