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

    // Load best player
    await loadBestPlayer();

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
            const playerIds = window.selectedPlayers.map(p => p.id_player);
            const loserId = document.getElementById('winrate-loser').value;
            const placeId = document.getElementById('winrate-place').value;
            const datetime = document.getElementById('winrate-datetime').value;

            if (playerIds.length === 0 || !loserId || !placeId || !datetime) {
                alert('Please fill all fields.');
                return;
            }

            if (!playerIds.includes(loserId)) {
                alert('Loser must be one of the selected players.');
                return;
            }

            // Get player and place details
            const players = await fetchData('Player');
            const places = await fetchData('Place');
            const place = places.find(p => p.id_place === placeId);

            if (!place) {
                alert('Invalid place selected.');
                return;
            }

            // Convert datetime to UTC+7
            const localDate = new Date(datetime);
            const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));
            const wibDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours for WIB
            const dateStr = wibDate.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');

            // Insert data for each player
            for (const playerId of playerIds) {
                const player = players.find(p => p.id_player === playerId);
                if (!player) continue;

                const lose = (playerId === loserId) ? 1 : 0;

                const newData = {
                    name_player: player.name,
                    name_place: place.name,
                    lose: lose,
                    date: dateStr,
                    id_place: placeId,
                    id_player: playerId
                };

                const result = await insertData('Data', newData);
                if (!result) {
                    console.error('Failed to add winrate for player:', player.name);
                    alert('Failed to add winrate for some players. Please try again.');
                    return;
                }
            }

            console.log('Winrate added successfully');
            document.getElementById('add-winrate-form').reset();
            addWinrateModal.hide();
            await loadBestPlayer();
            await loadRecentGames();
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

async function loadBestPlayer() {
    try {
        const data = await fetchData('Data');
        const players = await fetchData('Player');

        // Calculate win rates for each player
        const playerStats = {};
        players.forEach(player => {
            playerStats[player.id_player] = { name: player.name, wins: 0, total: 0 };
        });

        data.forEach(game => {
            if (playerStats[game.id_player]) {
                playerStats[game.id_player].total++;
                if (game.lose === '0' || game.lose === 0) {
                    playerStats[game.id_player].wins++;
                }
            }
        });

        // Find the player with the highest win rate
        let bestPlayer = null;
        let highestWinRate = -1;
        Object.values(playerStats).forEach(stat => {
            if (stat.total > 0) {
                const winRate = stat.wins / stat.total;
                if (winRate > highestWinRate) {
                    highestWinRate = winRate;
                    bestPlayer = stat;
                }
            }
        });

        if (bestPlayer) {
            const winRatePercent = (highestWinRate * 100).toFixed(2);
            document.getElementById('best-player').textContent = `${bestPlayer.name} - ${winRatePercent}% (${bestPlayer.wins} wins out of ${bestPlayer.total} games)`;
        } else {
            document.getElementById('best-player').textContent = 'No data available';
        }
    } catch (error) {
        console.error('Error loading best player:', error);
        document.getElementById('best-player').textContent = 'Error loading data';
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

            // Convert WIB date to local timezone
            // Parse date manually since it's in "YYYY-MM-DD HH:MM:SS" format
            const dateParts = game.date.split(' ');
            const dateStr = dateParts[0]; // YYYY-MM-DD
            const timeStr = dateParts[1]; // HH:MM:SS

            const [year, month, day] = dateStr.split('-').map(Number);
            const [hour, minute, second] = timeStr.split(':').map(Number);

            // Create date in WIB timezone (UTC+7)
            const wibDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
            wibDate.setHours(wibDate.getHours() + 7); // Add 7 hours for WIB

            const formattedDate = wibDate.toLocaleString('id-ID', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formattedDate}</td>
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

        const playerSelect = document.getElementById('winrate-players');
        const loserSelect = document.getElementById('winrate-loser');
        const placeSelect = document.getElementById('winrate-place');
        const selectedPlayersDiv = document.getElementById('selected-players');

        // Clear existing options
        playerSelect.innerHTML = '<option value="">Select Player</option>';
        loserSelect.innerHTML = '<option value="">Select Loser</option>';
        placeSelect.innerHTML = '<option value="">Select Place</option>';
        selectedPlayersDiv.innerHTML = '';

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

        // Set default datetime to now
        const now = new Date();
        const localDatetime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        document.getElementById('winrate-datetime').value = localDatetime;

        // Selected players array
        let selectedPlayers = [];

        // Function to update selected players display
        function updateSelectedPlayersDisplay() {
            selectedPlayersDiv.innerHTML = '';
            selectedPlayers.forEach(player => {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'd-inline-block me-2 mb-2';
                playerDiv.innerHTML = `
                    <span class="badge bg-primary">${player.name} <button type="button" class="btn-close btn-close-white ms-1" aria-label="Remove" data-player-id="${player.id_player}"></button></span>
                `;
                selectedPlayersDiv.appendChild(playerDiv);
            });

            // Update loser options
            loserSelect.innerHTML = '<option value="">Select Loser</option>';
            selectedPlayers.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id_player;
                option.textContent = player.name;
                loserSelect.appendChild(option);
            });
        }

        // Add player on select
        playerSelect.addEventListener('change', () => {
            const selectedValue = playerSelect.value;
            if (selectedValue && !selectedPlayers.find(p => p.id_player === selectedValue)) {
                const player = players.find(p => p.id_player === selectedValue);
                if (player) {
                    selectedPlayers.push(player);
                    updateSelectedPlayersDisplay();
                }
            }
            playerSelect.value = '';
        });

        // Remove player on button click
        selectedPlayersDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-close')) {
                const playerId = e.target.getAttribute('data-player-id');
                selectedPlayers = selectedPlayers.filter(p => p.id_player !== playerId);
                updateSelectedPlayersDisplay();
            }
        });

        // Store selected players for form submission
        window.selectedPlayers = selectedPlayers;
    } catch (error) {
        console.error('Error loading players and places:', error);
    }
}
