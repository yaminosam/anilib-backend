/* ==========================================================================
   AniLib Redesign - Modern Frontend Application Controller
   ========================================================================== */

// 1. Determine API Endpoint (Fallback to local dev server when running locally)
const getApiUrl = () => {
    const host = window.location.hostname;
    // Handle localhost, 127.0.0.1, or running directly from file:/// (empty hostname)
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
        return 'http://localhost:5000/api';
    }
    return 'https://anilib-9ikc.onrender.com/api';
};
const API_URL = getApiUrl();
console.log(`📡 AniLib API URL configured to: ${API_URL}`);

// 2. Global State Storage
let currentTab = 'discover';
let currentFilter = 'all';
let watchlist = [];
let discoverResults = [];

// 3. Selectors
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const searchBtn = document.getElementById('search-btn');
const tabDiscover = document.getElementById('tab-discover');
const tabWatchlist = document.getElementById('tab-watchlist');
const watchlistFilters = document.getElementById('watchlist-filters');
const sectionTitle = document.getElementById('section-title');
const modal = document.getElementById('anime-modal');
const modalClose = document.querySelector('#anime-modal .close-btn');

// 4. Initial Window Load Handler
window.addEventListener('load', async () => {
    // Pre-cache watchlist data from server
    await loadWatchlist();

    // Load trending list
    fetchTopAnime();
});

// 5. Watchlist State Synchronization
async function loadWatchlist() {
    try {
        const res = await fetch(`${API_URL}/favorites`);
        if (res.ok) {
            watchlist = await res.json();
            updateWatchlistStats();
        } else {
            console.warn("Watchlist fetch request was not successful.");
        }
    } catch (error) {
        console.error("Failed to sync watchlist cache from server:", error);
    }
}

function updateWatchlistStats() {
    const countEl = document.getElementById('watchlist-count');
    if (countEl) {
        countEl.innerText = watchlist.length;
    }
}

// 6. Navigation Tabs Controllers
if (tabDiscover) {
    tabDiscover.addEventListener('click', () => {
        if (currentTab === 'discover') return;
        currentTab = 'discover';

        tabDiscover.classList.add('active');
        tabWatchlist.classList.remove('active');
        watchlistFilters.style.display = 'none';
        sectionTitle.innerText = searchInput.value.trim() ? `Search Results for "${searchInput.value.trim()}"` : 'Trending Anime';

        renderDiscoverGrid(discoverResults);
    });
}

if (tabWatchlist) {
    tabWatchlist.addEventListener('click', () => {
        if (currentTab === 'watchlist') return;
        currentTab = 'watchlist';

        tabWatchlist.classList.add('active');
        tabDiscover.classList.remove('active');
        watchlistFilters.style.display = 'flex';
        sectionTitle.innerText = 'My Watchlist';

        renderWatchlist();
    });
}

// Watchlist Filter Toggles
const filterBtns = document.querySelectorAll('.watchlist-filters-bar .filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderWatchlist();
    });
});

// 7. Search Input Logic & Controllers
if (searchInput) {
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim().length > 0) {
            searchClearBtn.style.display = 'block';
        } else {
            searchClearBtn.style.display = 'none';
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            triggerSearch();
        }
    });
}

if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        if (currentTab === 'discover') {
            sectionTitle.innerText = 'Trending Anime';
            fetchTopAnime();
        } else {
            renderWatchlist();
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerSearch();
    });
}

function triggerSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    if (currentTab === 'discover') {
        sectionTitle.innerText = `Search Results for "${query}"`;
        fetchSearchAnime(query);
    } else {
        renderWatchlist();
    }
}

// 8. API Fetching Logic
async function fetchTopAnime() {
    showSkeleton(12);
    try {
        const res = await fetch(`${API_URL}/top`);
        if (res.ok) {
            const result = await res.json();
            discoverResults = result.data || [];
            if (currentTab === 'discover') {
                renderDiscoverGrid(discoverResults);
            }
        } else {
            throw new Error("API returned non-200 status for top anime");
        }
    } catch (error) {
        console.error("Error loading top list:", error);
        showNetworkError("Failed to load trending anime. Please make sure the backend server is running.");
    }
}

async function fetchSearchAnime(query) {
    showSkeleton(12);
    try {
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
            const result = await res.json();
            discoverResults = result.data || [];
            if (currentTab === 'discover') {
                renderDiscoverGrid(discoverResults);
            }
        } else {
            throw new Error("API returned non-200 status for search query");
        }
    } catch (error) {
        console.error("Error searching anime:", error);
        showNetworkError("Failed to search anime. Please check your network connection.");
    }
}

// 9. Card Rendering and Template Construction
function createAnimeCard(anime, isWatchlistCard = false) {
    const malId = Number(anime.mal_id);
    const title = anime.title;
    const score = anime.score || anime.rating || 'N/A';
    const image = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image_url || '';

    // Query watchlist state cache
    const watchlistEntry = watchlist.find(item => item.mal_id === malId);
    const isSaved = !!watchlistEntry;
    const isWatched = watchlistEntry ? watchlistEntry.watched : false;

    const card = document.createElement('div');
    card.className = 'anime-card';

    let badgesHtml = '';
    if (score && score !== 'N/A') {
        badgesHtml += `<div class="card-score-badge"><i class="fas fa-star"></i> ${score}</div>`;
    }

    if (isSaved) {
        if (isWatched) {
            badgesHtml += `<div class="card-watchlist-badge completed"><i class="fas fa-check"></i> Completed</div>`;
        } else {
            badgesHtml += `<div class="card-watchlist-badge plan"><i class="far fa-bookmark"></i> Plan</div>`;
        }
    }

    let overlayHtml = '';
    if (isWatchlistCard) {
        overlayHtml = `
            <div class="card-overlay">
                <button class="card-action-btn remove" data-id="${malId}">
                    <i class="fas fa-trash-alt"></i> Remove
                </button>
            </div>
        `;
    } else {
        overlayHtml = `
            <div class="card-overlay">
                <button class="card-action-btn">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="anime-card-img-wrapper">
            <img src="${image}" alt="${title}" loading="lazy">
            ${badgesHtml}
            ${overlayHtml}
        </div>
        <div class="anime-card-info">
            <h3 class="anime-card-title" title="${title}">${title}</h3>
            <div class="anime-card-meta">
                <span>⭐ ${score}</span>
                <span>MAL ID: ${malId}</span>
            </div>
        </div>
    `;

    // Attach card event listeners
    card.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.card-action-btn.remove');
        if (removeBtn) {
            e.stopPropagation();
            const id = removeBtn.dataset.id;
            deleteWatchlistItem(id, false, e);
        } else {
            openAnimeModal(anime);
        }
    });

    return card;
}

function renderDiscoverGrid(animeList) {
    const grid = document.getElementById('anime-list');
    if (!grid) return;

    grid.innerHTML = '';

    if (!animeList || animeList.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; color: var(--border-color);"></i>
                <p>No results found.</p>
            </div>
        `;
        return;
    }

    animeList.forEach((anime, index) => {
        const card = createAnimeCard(anime, false);
        card.style.animationDelay = `${index * 0.03}s`;
        grid.appendChild(card);
    });
}

function renderWatchlist() {
    const grid = document.getElementById('anime-list');
    if (!grid) return;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // Status and query filtration
    let filtered = watchlist;
    if (currentFilter === 'plan') {
        filtered = watchlist.filter(item => !item.watched);
    } else if (currentFilter === 'completed') {
        filtered = watchlist.filter(item => item.watched);
    }

    if (query) {
        filtered = filtered.filter(item => item.title.toLowerCase().includes(query));
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; color: var(--border-color);"></i>
                <p>Your watchlist is empty for this filter.</p>
            </div>
        `;
        return;
    }

    filtered.forEach((anime, index) => {
        const card = createAnimeCard(anime, true);
        card.style.animationDelay = `${index * 0.03}s`;
        grid.appendChild(card);
    });
}

function refreshDiscoverGrid() {
    if (currentTab === 'discover') {
        renderDiscoverGrid(discoverResults);
    }
}

// 10. Detail Modal Logic
async function openAnimeModal(anime) {
    if (!modal) return;

    // Open Modal Overlay
    modal.classList.add('open');

    // Select dynamic elements
    const titleEl = document.getElementById('modal-title');
    const imgEl = document.getElementById('modal-img');
    const scoreEl = document.getElementById('modal-score');
    const typeEl = document.getElementById('modal-type');
    const epsEl = document.getElementById('modal-episodes');
    const statusEl = document.getElementById('modal-status');
    const genresEl = document.getElementById('modal-genres');
    const synopsisEl = document.getElementById('modal-synopsis');
    const watchLinkEl = document.getElementById('modal-watch-link');

    // Set temporary loading state
    titleEl.innerText = anime.title || 'Loading...';
    imgEl.src = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image_url || '';
    scoreEl.innerHTML = `<i class="fas fa-star"></i> ${anime.score || anime.rating || 'N/A'}`;
    typeEl.innerText = anime.type || 'N/A';
    epsEl.innerText = anime.episodes ? `${anime.episodes} Episodes` : 'Episodes Unknown';
    statusEl.innerText = anime.status || 'Status Unknown';
    genresEl.innerHTML = '';
    synopsisEl.innerText = 'Loading description from server...';
    watchLinkEl.href = `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`;

    // Update Add/Remove Watchlist and Status Controls
    updateModalWatchlistState(anime);

    // Render detailed elements
    if (anime.synopsis || anime.genres) {
        renderModalInfo(anime);
    } else {
        // Fetch detailed record from server proxy
        try {
            const res = await fetch(`${API_URL}/anime/${anime.mal_id}`);
            if (res.ok) {
                const detailData = await res.json();
                const fullAnime = detailData.data;
                renderModalInfo(fullAnime);
            } else {
                synopsisEl.innerText = anime.synopsis || "No description available for this anime.";
            }
        } catch (error) {
            console.error("Failed to load details via MAL Proxy:", error);
            synopsisEl.innerText = "No synopsis available (Network Connection Issue).";
        }
    }
}

function renderModalInfo(anime) {
    const scoreEl = document.getElementById('modal-score');
    const typeEl = document.getElementById('modal-type');
    const epsEl = document.getElementById('modal-episodes');
    const statusEl = document.getElementById('modal-status');
    const genresEl = document.getElementById('modal-genres');
    const synopsisEl = document.getElementById('modal-synopsis');

    scoreEl.innerHTML = `<i class="fas fa-star"></i> ${anime.score || 'N/A'}`;
    typeEl.innerText = anime.type || 'N/A';
    epsEl.innerText = anime.episodes ? `${anime.episodes} Episodes` : 'Episodes Unknown';
    statusEl.innerText = anime.status || 'Status Unknown';
    synopsisEl.innerText = anime.synopsis || "No synopsis available.";

    genresEl.innerHTML = '';
    if (anime.genres) {
        anime.genres.forEach(genre => {
            const span = document.createElement('span');
            span.innerText = genre.name;
            genresEl.appendChild(span);
        });
    }
}

function updateModalWatchlistState(anime) {
    const watchlistBtn = document.getElementById('modal-watchlist-btn');
    const statusToggle = document.getElementById('modal-status-toggle');
    const btnPlan = document.getElementById('status-btn-plan');
    const btnCompleted = document.getElementById('status-btn-completed');

    if (!watchlistBtn) return;

    const malId = Number(anime.mal_id);
    const watchlistEntry = watchlist.find(item => item.mal_id === malId);
    const isSaved = !!watchlistEntry;

    // Remove existing event listeners by cloning
    const newWatchlistBtn = watchlistBtn.cloneNode(true);
    watchlistBtn.parentNode.replaceChild(newWatchlistBtn, watchlistBtn);

    const newBtnPlan = btnPlan.cloneNode(true);
    btnPlan.parentNode.replaceChild(newBtnPlan, btnPlan);

    const newBtnCompleted = btnCompleted.cloneNode(true);
    btnCompleted.parentNode.replaceChild(newBtnCompleted, btnCompleted);

    if (isSaved) {
        newWatchlistBtn.innerHTML = `<i class="fas fa-minus"></i> Remove from Watchlist`;
        newWatchlistBtn.className = "btn btn-danger btn-block";
        newWatchlistBtn.addEventListener('click', (e) => {
            deleteWatchlistItem(malId, true, e);
        });

        // Show Watch Status selectors
        statusToggle.style.display = 'flex';

        const isWatched = watchlistEntry.watched;
        if (isWatched) {
            newBtnCompleted.className = "status-option-btn active";
            newBtnPlan.className = "status-option-btn";
        } else {
            newBtnCompleted.className = "status-option-btn";
            newBtnPlan.className = "status-option-btn active";
        }

        newBtnPlan.addEventListener('click', (e) => {
            if (watchlistEntry.watched) {
                updateWatchlistWatchedStatus(malId, false, e);
            }
        });

        newBtnCompleted.addEventListener('click', (e) => {
            if (!watchlistEntry.watched) {
                updateWatchlistWatchedStatus(malId, true, e);
            }
        });
    } else {
        newWatchlistBtn.innerHTML = `<i class="fas fa-plus"></i> Add to Watchlist`;
        newWatchlistBtn.className = "btn btn-primary btn-block";
        newWatchlistBtn.addEventListener('click', (e) => {
            const image = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image_url || '';
            const score = anime.score || 0;
            addWatchlistItem({
                mal_id: malId,
                title: anime.title,
                image_url: image,
                score: score
            }, e);
        });

        statusToggle.style.display = 'none';
    }
}

// 11. Watchlist API Operations
async function addWatchlistItem(animeData, e = null) {
    try {
        const res = await fetch(`${API_URL}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(animeData)
        });
        const result = await res.json();
        if (res.ok || res.status === 201) {
            // Trigger particle animation burst
            if (e) createParticleBurst(e, 'var(--color-primary)');

            showToast(`Added "${animeData.title}" to Watchlist!`, 'success');
            await loadWatchlist();

            // Sync current active elements
            updateModalWatchlistState(animeData);
            if (currentTab === 'watchlist') {
                renderWatchlist();
            } else {
                refreshDiscoverGrid();
            }
        } else {
            showToast(result.message || 'Already added to watchlist', 'info');
        }
    } catch (error) {
        console.error("Error adding anime:", error);
        showToast('Connection failed. Server offline.', 'danger');
    }
}

async function deleteWatchlistItem(malId, fromModal = false, e = null) {
    const entry = watchlist.find(item => item.mal_id === Number(malId));
    const title = entry ? entry.title : 'Anime';
    try {
        const res = await fetch(`${API_URL}/favorites/${malId}`, {
            method: 'DELETE'
        });
        const result = await res.json();
        if (res.ok) {
            // Trigger particle animation burst (Danger red burst)
            if (e) createParticleBurst(e, 'var(--color-danger)');

            showToast(`Removed "${title}" from Watchlist.`, 'info');
            await loadWatchlist();

            if (fromModal) {
                updateModalWatchlistState(entry || { mal_id: malId });
            }
            if (currentTab === 'watchlist') {
                renderWatchlist();
            } else {
                refreshDiscoverGrid();
            }
        } else {
            showToast(result.message || 'Could not remove favorite.', 'danger');
        }
    } catch (error) {
        console.error("Error deleting anime:", error);
        showToast('Connection failed. Server offline.', 'danger');
    }
}

async function updateWatchlistWatchedStatus(malId, watched, e = null) {
    const entry = watchlist.find(item => item.mal_id === Number(malId));
    const title = entry ? entry.title : 'Anime';
    try {
        const res = await fetch(`${API_URL}/favorites/${malId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ watched })
        });
        const result = await res.json();
        if (res.ok) {
            // Trigger dynamic particle burst
            if (e) {
                const particleColor = watched ? 'var(--color-success)' : 'var(--color-secondary)';
                createParticleBurst(e, particleColor);
            }

            if (watched) {
                triggerConfetti();
            }

            const statusLabel = watched ? 'Completed' : 'Plan to Watch';
            showToast(`Marked "${title}" as ${statusLabel}!`, 'success');
            await loadWatchlist();

            updateModalWatchlistState(entry);
            if (currentTab === 'watchlist') {
                renderWatchlist();
            } else {
                refreshDiscoverGrid();
            }
        } else {
            showToast(result.message || 'Failed to update watch status.', 'danger');
        }
    } catch (error) {
        console.error("Error patching watch status:", error);
        showToast('Connection failed. Server offline.', 'danger');
    }
}

// 12. Modal Window Closers
if (modalClose) {
    modalClose.addEventListener('click', () => {
        modal.classList.remove('open');
    });
}

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('open');
    }
});

// 13. Skeletons and Message Alerts UI Elements
function showSkeleton(count = 10) {
    const grid = document.getElementById('anime-list');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-info">
                <div class="skeleton-title"></div>
                <div class="skeleton-meta"></div>
            </div>
        `;
        grid.appendChild(skeleton);
    }
}

function showNetworkError(message) {
    const grid = document.getElementById('anime-list');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--color-danger);">
            <i class="fas fa-exclamation-triangle" style="font-size: 3.5rem; margin-bottom: 1.25rem;"></i>
            <p style="font-size: 1.1rem; font-weight: 500; max-width: 500px; margin: 0 auto 1.5rem;">${message}</p>
            <button onclick="window.location.reload();" class="btn btn-primary" style="padding: 0.6rem 1.4rem;">
                <i class="fas fa-redo"></i> Reload Application
            </button>
        </div>
    `;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'danger') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Clean up toast element dynamically after animation fades
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 14. Confetti/Particle Burst Implementation
function createParticleBurst(e, color = 'var(--color-primary)') {
    // Determine click position
    let x = e.clientX;
    let y = e.clientY;

    // Fallback if event is not cursor-relative (e.g. keyboard trigger)
    if (!x && !y && e.target) {
        const rect = e.target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    }

    const particleCount = 24;
    const container = document.body;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'burst-particle';

        // Random dimensions and physics metrics
        const size = Math.random() * 8 + 4;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 80 + 50;

        const destX = Math.cos(angle) * distance;
        const destY = Math.sin(angle) * distance;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = color;
        particle.style.borderRadius = '50%';
        particle.style.position = 'fixed';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '99999';
        particle.style.boxShadow = `0 0 12px ${color}, 0 0 4px #ffffff`;

        // Dynamic float keyframe animate
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${destX}px, ${destY}px) scale(0)`, opacity: 0 }
        ], {
            duration: Math.random() * 700 + 450,
            easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
            fill: 'forwards'
        });

        container.appendChild(particle);

        // Release from DOM
        setTimeout(() => {
            particle.remove();
        }, 1200);
    }
}

// 15. Premium Confetti Rain Animation for Completed status
function triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const colors = ['#ff6b6b', '#f47521', '#ffbe0b', '#3a86c8', '#8338ec', '#ff006e', '#06d6a0'];
    const particles = [];

    // Create 120 confetti particles
    for (let i = 0; i < 120; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            r: Math.random() * 6 + 4,
            d: Math.random() * height,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0,
            speed: Math.random() * 3 + 2.5
        });
    }

    let animationFrameId;
    const startTime = Date.now();

    function draw() {
        ctx.clearRect(0, 0, width, height);
        let active = false;

        particles.forEach((p, index) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += p.speed;
            p.x += Math.sin(p.tiltAngle) * 0.5;
            p.tilt = Math.sin(p.tiltAngle - index / 3) * 12;

            if (p.y <= height) {
                active = true;
            }

            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();
        });

        if (active && Date.now() - startTime < 3000) {
            animationFrameId = requestAnimationFrame(draw);
        } else {
            cancelAnimationFrame(animationFrameId);
            canvas.remove();
        }
    }

    draw();
}