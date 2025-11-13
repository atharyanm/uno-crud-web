// dashboard.js - Dashboard functionality
var winrateFormInitialized = false; // DIUBAH
var currentRecentGamesPage = 1; // DIUBAH
var recentGamesPerPage = 10; // DIUBAH

// Global function to load dashboard content
window.loadDashboardContent = async () => {
    try {
        // Load best player
        await loadBestPlayer();

        // Load worst player (handled inside loadBestPlayer)

        // Load recent games with pagination
        await loadRecentGames();

        // Setup modal functionality for add winrate
        const addWinrateModal = new bootstrap.Modal(document.getElementById('add-winrate-modal'));

        if (!winrateFormInitialized) {
            $('#add-winrate-btn').on('click', async () => {
                await loadPlayersAndPlaces();
                addWinrateModal.show();
            });

            $('#add-winrate-form').on('submit', async (e) => {
                e.preventDefault();

                const submitBtn = document.querySelector('#add-winrate-modal button[type="submit"]');
                if (submitBtn.disabled) return;

                submitBtn.disabled = true;
                submitBtn.textContent = 'Adding...';

                try {
                    const playerIds = window.selectedPlayers.map(p => p.id_player);
                    const loserId = document.getElementById('winrate-loser').value;
                    const placeId = document.getElementById('winrate-place').value;
                    const gameId = document.getElementById('winrate-game').value;
                    const datetime = document.getElementById('winrate-datetime').value;

                    if (playerIds.length === 0) {
                        alert('Please select at least one player.');
                        return;
                    }
                    if (!loserId) {
                        alert('Please select the loser.');
                        return;
                    }
                    if (!playerIds.includes(loserId)) {
                        alert('Loser must be one of the selected players.');
                        return;
                    }
                    if (!placeId) {
                        alert('Please select a place.');
                        return;
                    }
                    if (!gameId) {
                        alert('Please select a game.');
                        return;
                    }
                    if (!datetime) {
                        alert('Please enter date and time.');
                        return;
                    }

                    // Get player, place, and game details
                    const players = await fetchData('Player');
                    const places = await fetchData('Place');
                    const games = await fetchData('Game');
                    const place = places.find(p => p.id_place === placeId);
                    const game = games.find(g => g.id_game === gameId);

                    if (!place) {
                        alert('Invalid place selected.');
                        return;
                    }
                    if (!game) {
                        alert('Invalid game selected.');
                        return;
                    }

                    const wibDate = new Date(datetime);
                    const dateStr = `${wibDate.getFullYear()}-${String(wibDate.getMonth() + 1).padStart(2, '0')}-${String(wibDate.getDate()).padStart(2, '0')} ${String(wibDate.getHours()).padStart(2, '0')}:${String(wibDate.getMinutes()).padStart(2, '0')}:${String(wibDate.getSeconds()).padStart(2, '0')}`;

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
                            id_player: playerId,
                            name_game: game.name_game
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
                    await loadDashboardContent();
                } catch (error) {
                    console.error('Error adding winrate:', error);
                    alert('Error adding winrate. Please try again.');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Add Winrate';
                }
            });

            winrateFormInitialized = true; // Prevent re-initialization
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        $('#overall-win-rate').text('Error loading data');
    }
};

// DIUBAH: Tambahkan "window."
window.loadBestPlayer = async function(gameFilter = 'all') {
    try {
        const data = await fetchData('Data');
        const players = await fetchData('Player');
        const games = await fetchData('Game');

        // Populate game filter dropdowns
        const leaderboardFilter = document.getElementById('leaderboard-game-filter');
        const rankingFilter = document.getElementById('ranking-game-filter');

        // Clear existing options except "All Games"
        while (leaderboardFilter.children.length > 1) {
            leaderboardFilter.removeChild(leaderboardFilter.lastChild);
        }
        while (rankingFilter.children.length > 1) {
            rankingFilter.removeChild(rankingFilter.lastChild);
        }

        // Add game options
        games.forEach(game => {
            const option1 = document.createElement('option');
            option1.value = game.id_game;
            option1.textContent = game.name_game;
            leaderboardFilter.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = game.id_game;
            option2.textContent = game.name_game;
            rankingFilter.appendChild(option2);
        });

        // Set current filter values
        leaderboardFilter.value = gameFilter;
        rankingFilter.value = gameFilter;

        // Filter data based on selected game
        const filteredData = gameFilter === 'all' ? data : data.filter(game => game.name_game === games.find(g => g.id_game === gameFilter)?.name_game);

        const playerStats = {};
        players.forEach(player => {
            playerStats[player.id_player] = { name: player.name, wins: 0, losses: 0, points: 0 };
        });

        filteredData.forEach(game => {
            if (playerStats[game.id_player]) {
                if (game.lose === '0' || game.lose === 0) {
                    playerStats[game.id_player].wins++;
                    playerStats[game.id_player].points += 3;
                } else {
                    playerStats[game.id_player].losses++;
                }
            }
        });

        const leaderboard = Object.values(playerStats).map(stat => {
            const total = stat.wins + stat.losses;
            const winrate = total > 0 ? (stat.wins / total) * 100 : 0;
            return {
                ...stat,
                total,
                winrate
            };
        });

        leaderboard.sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            return b.winrate - a.winrate;
        });

        const tbody = document.querySelector('#leaderboard-table tbody');
        tbody.innerHTML = '';

        leaderboard.forEach((player, index) => {
            const rank = index + 1;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rank}</td>
                <td>${player.name}</td>
                <td>${player.points}</td>
                <td>${player.wins}</td>
                <td>${player.losses}</td>
                <td>${player.winrate.toFixed(2)}%</td>
                <td>${player.total}</td>
            `;
            tbody.appendChild(row);
        });

        // Update best and worst player display
        let bestPlayer = null;
        let worstPlayer = null;
        if (leaderboard.length > 0) {
            bestPlayer = leaderboard[0];
            worstPlayer = leaderboard[leaderboard.length - 1];

            // Handle ties for worst player
            const lowestPoints = worstPlayer.points;
            const tiedPlayers = leaderboard.filter(p => p.points === lowestPoints);
            if (tiedPlayers.length > 1) {
                tiedPlayers.sort((a, b) => b.losses - a.losses);
                worstPlayer = tiedPlayers[0];
            }
        }

        const displayElement = document.getElementById('best-worst-player');
        if (bestPlayer && worstPlayer) {
            displayElement.textContent = `Best: ${bestPlayer.name} - ${bestPlayer.points} pts | Worst: ${worstPlayer.name} - ${worstPlayer.points} pts`;
        } else {
            displayElement.textContent = 'No data available';
        }

        // Add event listeners for filters
        leaderboardFilter.addEventListener('change', () => {
            loadBestPlayer(leaderboardFilter.value);
        });

        rankingFilter.addEventListener('change', () => {
            loadBestPlayer(rankingFilter.value);
        });

    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('best-worst-player').textContent = 'Error loading data';
    }
}

// DIUBAH: Tambahkan "window."
window.loadRecentGames = async function(page = 1, limit = 10) {
    console.log(`[PAGINATION DEBUG] loadRecentGames function called with page=${page}, limit=${limit}`);
    try {
        console.log(`[Pagination] Loading recent games - Page: ${page}, Limit: ${limit}`);
        const data = await fetchData('Data');
        const players = await fetchData('Player');
        const places = await fetchData('Place');
        const games = await fetchData('Game');

        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));

        const totalGames = sortedData.length;
        const totalPages = Math.ceil(totalGames / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedGames = sortedData.slice(startIndex, endIndex);

        console.log(`[Pagination] Total games: ${totalGames}, Total pages: ${totalPages}, Current page: ${page}, Showing games ${startIndex + 1}-${Math.min(endIndex, totalGames)}`);

        const tbody = document.querySelector('#recent-games-table tbody');
        tbody.innerHTML = '';

        paginatedGames.forEach(game => {
            const player = players.find(p => p.id_player === game.id_player);
            const place = places.find(p => p.id_place === game.id_place);
            const gameType = games.find(g => g.name_game === game.name_game);
            const result = game.lose === '1' || game.lose === 1 ? 'Lose' : 'Win';

            let formattedDate = 'Unknown';
            if (game.date) {
                try {
                    const dateMatch = game.date.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
                    if (!dateMatch) {
                        console.warn('Invalid date format for game:', game.date);
                        formattedDate = 'Invalid Date';
                    } else {
                        const dateStr = dateMatch[1]; 
                        const timeStr = dateMatch[2]; 

                        const [year, month, day] = dateStr.split('-').map(Number);
                        const [hour, minute, second] = timeStr.split(':').map(Number);

                        formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}, ${String(hour).padStart(2, '0')}.${String(minute).padStart(2, '0')}.${String(second).padStart(2, '0')}`;
                    }
                } catch (error) {
                    console.error('Error parsing date for game:', game, error);
                    formattedDate = 'Invalid Date';
                }
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${player ? player.name : 'Unknown'}</td>
                <td>${place ? place.name : 'Unknown'}</td>
                <td>${gameType ? gameType.name_game : 'Unknown'}</td>
                <td>${result}</td>
            `;
            tbody.appendChild(row);
        });

        renderRecentGamesPagination(totalPages, page);
        console.log(`[Pagination] Successfully rendered ${paginatedGames.length} games for page ${page}`);
    } catch (error) {
        console.error('[Pagination] Error loading recent games:', error);
    }
}

// DIUBAH: Tambahkan "window."
window.loadPlayersAndPlaces = async function() {
    try {
        const players = await fetchData('Player');
        const places = await fetchData('Place');
        const games = await fetchData('Game');

        const playerSelect = document.getElementById('winrate-players');
        const loserSelect = document.getElementById('winrate-loser');
        const placeSelect = document.getElementById('winrate-place');
        const gameSelect = document.getElementById('winrate-game');
        const selectedPlayersDiv = document.getElementById('selected-players');

        playerSelect.innerHTML = '<option value="">Select Player</option>';
        loserSelect.innerHTML = '<option value="">Select Loser</option>';
        placeSelect.innerHTML = '<option value="">Select Place</option>';
        gameSelect.innerHTML = '<option value="">Select Game</option>';
        selectedPlayersDiv.innerHTML = '';

        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id_player;
            option.textContent = player.name;
            playerSelect.appendChild(option);
        });

        places.forEach(place => {
            const option = document.createElement('option');
            option.value = place.id_place;
            option.textContent = place.name;
            placeSelect.appendChild(option);
        });

        games.forEach(game => {
            const option = document.createElement('option');
            option.value = game.id_game;
            option.textContent = game.name_game;
            gameSelect.appendChild(option);
        });

        const now = new Date();
        const localDatetime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        document.getElementById('winrate-datetime').value = localDatetime;

        let selectedPlayers = [];

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

            loserSelect.innerHTML = '<option value="">Select Loser</option>';
            selectedPlayers.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id_player;
                option.textContent = player.name;
                loserSelect.appendChild(option);
            });
        }

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

        selectedPlayersDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-close')) {
                const playerId = e.target.getAttribute('data-player-id');
                selectedPlayers = selectedPlayers.filter(p => p.id_player !== playerId);
                updateSelectedPlayersDisplay();
            }
        });

        window.selectedPlayers = selectedPlayers;
    } catch (error) {
        console.error('Error loading players and places:', error);
    }
}

// DIUBAH: Tambahkan "window."
window.renderRecentGamesPagination = function(totalPages, currentPage) {
    console.log(`[PAGINATION DEBUG] renderRecentGamesPagination called with totalPages=${totalPages}, currentPage=${currentPage}`);
    const paginationContainer = document.getElementById('recent-games-pagination');
    if (!paginationContainer) {
        console.error('[Pagination] Pagination container not found!');
        return;
    }
    paginationContainer.innerHTML = '';

    if (totalPages <= 0) {
        console.log('[Pagination] No pagination needed - no pages to display');
        return;
    }

    console.log(`[Pagination] Rendering pagination - Total pages: ${totalPages}, Current page: ${currentPage}`);

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changeRecentGamesPage(${currentPage - 1})">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers - show only 5 pages centered around current page
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeRecentGamesPage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changeRecentGamesPage(${currentPage + 1})">Next</a>`;
    paginationContainer.appendChild(nextLi);

    console.log('[Pagination] Pagination rendered successfully');
}

window.changeRecentGamesPage = (page) => {
    console.log(`[PAGINATION DEBUG] changeRecentGamesPage called with page=${page}`);
    console.log(`[Pagination] Changing to page ${page}`);
    loadRecentGames(page);
}