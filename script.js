// LINK TO YOUR RENDER BACKEND
const API_URL = "https://anilib-9ikc.onrender.com/api"; 

// 1. Search Anime Function
async function searchAnime() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    try {
        // Fetch data from YOUR backend (which talks to Jikan API)
        const response = await fetch(`${API_URL}/search?q=${query}`);
        const data = await response.json();
        
        displayAnime(data.data); // Show the results
    } catch (error) {
        console.error("Error searching:", error);
        alert("Something went wrong. Check the console!");
    }
}

// 2. Display Cards (Now with a SAVE button!)
function displayAnime(animeList) {
    const list = document.getElementById('anime-list');
    list.innerHTML = ''; // Clear old results

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';

        // We use backticks (`) to create the HTML card
        card.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="Anime Cover">
            <h3>${anime.title}</h3>
            <button onclick="saveToFavorites('${anime.title}', '${anime.images.jpg.image_url}')">
                ❤️ Save to List
            </button>
        `;
        list.appendChild(card);
    });
}

// 3. The "Save" Function (Talks to Database)
async function saveToFavorites(title, image) {
    // Prevent errors with special characters in titles
    const safeTitle = title.replace(/'/g, ""); 

    try {
        const response = await fetch(`${API_URL}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: safeTitle, image: image })
        });

        if (response.ok) {
            alert(`Saved: ${safeTitle}! ✅`);
        } else {
            alert("Error saving anime ❌");
        }
    } catch (error) {
        console.error("Error saving:", error);
    }
}

// Allow pressing "Enter" key to search
document.getElementById('search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') searchAnime();
});