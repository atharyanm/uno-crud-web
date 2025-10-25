// dashboard.js - Dashboard functionality (same as homepage.js)
document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        window.location.href = '../index.html';
        return;
    }

    // Logout functionality
    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = '../index.html';
    });

    // Load win rate summary
    await loadWinRateSummary();

    // Load recent games
    await loadRecentGames();

    // Modal functionality for add winrate
    const addWinrateModal = new bootstrap.Modal(document.getElementById('add-winrate-modal'));
    document.getElementById('add-winrate-btn').addEventListener('click', async () => {
        await loadPlayersAndPlaces();
        addWinrateModal.show();
    });

    // Add winrate form
    document.getElementById('add-winrate-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = document.getElementById('add-winrate-form');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        try {
            const playerId = document.getElementById('winrate-player').value;
            const placeId = document.getElementById('winrate-place').value;
            const lose = document.querySelector('input[name="winrate-result"]:checked').value;
            const date = document.getElementById('winrate-date').value;

            // Get player and place details
            const players = await fetchData('Player');
            const places = await fetchData('Place');
            const player = players.find(p => p.id_player === playerId);
            const place = places.find(p => p.id_place === placeId);

            if (!player || !place) {
                alert('Invalid player or place selected.');
                return;
            }

            const newData = {
                name_player: player.name,
                name_place: place.name,
                lose: parseInt(lose),
                date: date,
                id_place: placeId,
                id_player: playerId
            };

            const result = await insertData('Data', newData);
            if (result) {
                console.log('Winrate added successfully');
                document.getElementById('add-winrate-form').reset();
                addWinrateModal.hide();
                await loadWinRateSummary();
                await loadRecentGames();
            } else {
                console.error('Failed to add winrate');
                alert('Failed to add winrate. Please try again.');
            }
        } catch (error) {
            console.error('Error adding winrate:', error);
            alert('Error adding winrate. Please try again.');
        } finally {
            // Hide loading
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Winrate';
        }
    });
});

async function loadWinRateSummary() {
    try {
        const data = await fetchData('Data');
        const players = await fetchData('Player');

        let totalGames = data.length;
        let totalLosses = data.filter(d => d.lose === '1' || d.lose === 1).length;
        let totalWins = totalGames - totalLosses;
        let winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(2) : 0;

        document.getElementById('overall-win-rate').textContent = `${winRate}% (${totalWins} wins out of ${totalGames} games)`;
    } catch (error) {
        console.error('Error loading win rate summary:', error);
        document.getElementById('overall-win-rate').textContent = 'Error loading data';
    }
}

async function loadRecentGames() {
    try {
        const data = await fetchData('Data');
        const players = await fetchData('Player');
        const places = await fetchData('Place');

        const recentGames = data.slice(-10).reverse(); // Last 10 games, most recent first

        const tbody = document.querySelector('#recent-games-table tbody');
        tbody.innerHTML = '';

        recentGames.forEach(game => {
            const player = players.find(p => p.id_player === game.id_player);
            const place = places.find(p => p.id_place === game.id_place);
            const result = game.lose === '1' || game.lose === 1 ? 'Lose' : 'Win';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${game.date}</td>
                <td>${player ? player.name : 'Unknown'}</td>
                <td>${place ? place.name : 'Unknown'}</td>
                <td>${result}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading recent games:', error);
    }
}

async function loadPlayersAndPlaces() {
    try {
        const players = await fetchData('Player');
        const places = await fetchData('Place');

        const playerSelect = document.getElementById('winrate-player');
        const placeSelect = document.getElementById('winrate-place');

        // Clear existing options except the first
        playerSelect.innerHTML = '<option value="">Select Player</option>';
        placeSelect.innerHTML = '<option value="">Select Place</option>';

        // Populate player options
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id_player;
            option.textContent = player.name;
            playerSelect.appendChild(option);
        });

        // Populate place options
        places.forEach(place => {
            const option = document.createElement('option');
            option.value = place.id_place;
            option.textContent = place.name;
            placeSelect.appendChild(option);
        });

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('winrate-date').value = today;
    } catch (error) {
        console.error('Error loading players and places:', error);
    }
}
