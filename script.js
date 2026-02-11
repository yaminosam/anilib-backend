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

// 4. Render Anime Cards
function showAnime(animeList) {
    grid.innerHTML = '';
    
    animeList.forEach(anime => {
        const { title, images, score, mal_id } = anime;
        
        const animeEl = document.createElement('div');
        // FIXED: Changed 'card' to 'anime-card' so your CSS styling works
        animeEl.classList.add('anime-card');
        
        animeEl.innerHTML = `
            <img src="${images.jpg.large_image_url}" alt="${title}">
            <div class="card-content">
                <h3 class="card-title">${title}</h3>
                <p style="color: #bbb; font-size: 0.9rem;">⭐ ${score || 'N/A'}</p>
            </div>
        `;
        
        // Add click event to open details
        // Note: Ensure your HTML has a modal div for this to work!
        if(typeof openModal === "function") {
             animeEl.addEventListener('click', () => openModal(anime));
        }
        
        grid.appendChild(animeEl);
    });
}

// 5. Modal Logic (Show Details)
function openModal(anime) {
    const modal = document.getElementById('anime-modal');
    const modalTitle = document.getElementById('modal-title');
    // --- THE CRUNCHYROLL TRICK ---
    const watchLink = document.getElementById('modal-link');
    if (watchLink) {
        // encodeURIComponent makes sure spaces in titles (like "One Piece") become safe web links (like "One%20Piece")
        const safeTitle = encodeURIComponent(anime.title);
        
        // Build the Crunchyroll search URL
        watchLink.href = `https://www.crunchyroll.com/search?q=${safeTitle}`;
    }
    
    // Safety check: Does the modal exist in HTML?
    if (!modal || !modalTitle) {
        console.error("Modal HTML elements not found!"); 
        return; 
    }

    // FILL IN THE INFO
    modalTitle.innerText = anime.title; // Fixed: added 'anime.'
    
    const img = document.getElementById('modal-img');
    if (img) img.src = anime.images.jpg.large_image_url;

    const synopsis = document.getElementById('modal-synopsis');
    if (synopsis) synopsis.innerText = anime.synopsis || "No description available.";

    // SHOW THE MODAL
    modal.style.display = 'flex';
}


// Close Modal Logic
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.style.display = 'none';
    }
});