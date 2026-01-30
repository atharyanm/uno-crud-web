// dashboard.js - Dashboard functionality
var winrateFormInitialized = false; // DIUBAH
var currentRecentGamesPage = 1; // DIUBAH
var recentGamesPerPage = 10; // DIUBAH
var currentSearchType = 'place'; // Current search type
var currentSearchValue = ''; // Current search value

// Cache for performance optimization
var dataCache = {
    players: null,
    games: null,
    places: null,
    gameData: null,
    leaderboard: null,
    lastUpdated: null
};

// Cached fetch function
async function cachedFetchData(table) {
    const cacheKey = table.toLowerCase();
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes

    if (dataCache[cacheKey] && dataCache.lastUpdated && (now - dataCache.lastUpdated < cacheExpiry)) {
        console.log(`Using cached data for ${table}`);
        return dataCache[cacheKey];
    }

    console.log(`Fetching fresh data for ${table}`);
    const data = await fetchData(table);
    dataCache[cacheKey] = data;
    dataCache.lastUpdated = now;
    return data;
}

// Clear cache on page refresh
window.addEventListener('beforeunload', function() {
    dataCache = {
        players: null,
        games: null,
        places: null,
        gameData: null,
        leaderboard: null,
        lastUpdated: null
    };
});

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

                    // Parse the datetime as local time and convert to UTC for Supabase
                    const localDate = new Date(datetime + ':00'); // Add seconds if not present
                    const dateISO = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000)).toISOString();

                    // Check if a game session with same date, place, and game already exists
                    const existingData = await fetchData('Data');
                    const duplicateSession = existingData.find(d =>
                        d.date.startsWith(dateISO.substring(0, 19)) && // Compare date-time up to seconds
                        d.id_place === placeId &&
                        d.name_game === game.name_game
                    );
                    if (duplicateSession) {
                        alert('A game session with this date, place, and game already exists. Please choose a different date or modify the session details.');
                        return;
                    }

                    for (const playerId of playerIds) {
                        const player = players.find(p => p.id_player === playerId);
                        if (!player) continue;

                        const lose = (playerId === loserId) ? 1 : 0;

                        const newData = {
                            name_player: player.name,
                            name_place: place.name,
                            lose: lose,
                            date: dateISO,
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
                    // Clear cache to ensure fresh data reload
                    dataCache = {
                        players: null,
                        games: null,
                        places: null,
                        gameData: null,
                        leaderboard: null,
                        lastUpdated: null
                    };
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

        // Initialize filter functionality
        initializeFilters();

        // Initialize generate report functionality
        initializeGenerateReport();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        $('#overall-win-rate').text('Error loading data');
    }
};

// DIUBAH: Tambahkan "window."
window.loadBestPlayer = async function(yearFilter = new Date().getFullYear().toString(), gameFilter = 'all') {
    try {
        const data = await cachedFetchData('Data');
        const players = await cachedFetchData('Player');
        const games = await cachedFetchData('Game');

        // Populate year filter dropdowns
        const leaderboardYearFilter = document.getElementById('leaderboard-year-filter');
        const rankingYearFilter = document.getElementById('ranking-year-filter');

        // Clear existing options
        leaderboardYearFilter.innerHTML = '';
        rankingYearFilter.innerHTML = '';

        // Get unique years from data
        const yearsInData = [...new Set(data.map(d => new Date(d.date).getFullYear()))].sort((a, b) => a - b);
        const currentYear = new Date().getFullYear();
        const minYear = yearsInData.length > 0 ? Math.min(...yearsInData) : currentYear;
        const maxYear = Math.max(currentYear, yearsInData.length > 0 ? Math.max(...yearsInData) : currentYear);

        // Add year options from min year to max year
        for (let year = minYear; year <= maxYear; year++) {
            const option1 = document.createElement('option');
            option1.value = year.toString();
            option1.textContent = year.toString();
            leaderboardYearFilter.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = year.toString();
            option2.textContent = year.toString();
            rankingYearFilter.appendChild(option2);
        }

        // Add "All Time" option
        const allTimeOption1 = document.createElement('option');
        allTimeOption1.value = 'all';
        allTimeOption1.textContent = 'All Time';
        leaderboardYearFilter.appendChild(allTimeOption1);

        const allTimeOption2 = document.createElement('option');
        allTimeOption2.value = 'all';
        allTimeOption2.textContent = 'All Time';
        rankingYearFilter.appendChild(allTimeOption2);

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
        leaderboardYearFilter.value = yearFilter;
        rankingYearFilter.value = yearFilter;
        leaderboardFilter.value = gameFilter;
        rankingFilter.value = gameFilter;

        // Filter data based on selected year and game
        let filteredData = data;
        if (yearFilter !== 'all') {
            filteredData = filteredData.filter(game => {
                const gameYear = new Date(game.date).getFullYear().toString();
                return gameYear === yearFilter;
            });
        }
        if (gameFilter !== 'all') {
            filteredData = filteredData.filter(game => game.name_game === games.find(g => g.id_game === gameFilter)?.name_game);
        }

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
                    playerStats[game.id_player].points -= 1;
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

            // Filter out players with 0 matches for worst player calculation
            const playersWithMatches = leaderboard.filter(p => p.total > 0);
            if (playersWithMatches.length > 0) {
                worstPlayer = playersWithMatches[playersWithMatches.length - 1];

                // Handle ties for worst player
                const lowestPoints = worstPlayer.points;
                const tiedPlayers = playersWithMatches.filter(p => p.points === lowestPoints);
                if (tiedPlayers.length > 1) {
                    tiedPlayers.sort((a, b) => b.losses - a.losses);
                    worstPlayer = tiedPlayers[0];
                }
            }
        }

        // Update best player card
        if (bestPlayer) {
            document.getElementById('best-player-name').textContent = bestPlayer.name;
            document.getElementById('best-player-wins').textContent = bestPlayer.wins;
            document.getElementById('best-player-losses').textContent = bestPlayer.losses;
            document.getElementById('best-player-matches').textContent = bestPlayer.total;
            document.getElementById('best-player-points').textContent = bestPlayer.points;
        } else {
            document.getElementById('best-player-name').textContent = 'No data';
            document.getElementById('best-player-wins').textContent = '-';
            document.getElementById('best-player-losses').textContent = '-';
            document.getElementById('best-player-matches').textContent = '-';
            document.getElementById('best-player-points').textContent = '-';
        }

        // Update worst player card
        if (worstPlayer) {
            document.getElementById('worst-player-name').textContent = worstPlayer.name;
            document.getElementById('worst-player-wins').textContent = worstPlayer.wins;
            document.getElementById('worst-player-losses').textContent = worstPlayer.losses;
            document.getElementById('worst-player-matches').textContent = worstPlayer.total;
            document.getElementById('worst-player-points').textContent = worstPlayer.points;
        } else {
            document.getElementById('worst-player-name').textContent = 'No data';
            document.getElementById('worst-player-wins').textContent = '-';
            document.getElementById('worst-player-losses').textContent = '-';
            document.getElementById('worst-player-matches').textContent = '-';
            document.getElementById('worst-player-points').textContent = '-';
        }

        // Add event listeners for filters
        leaderboardYearFilter.addEventListener('change', () => {
            loadBestPlayer(leaderboardYearFilter.value, leaderboardFilter.value);
        });

        leaderboardFilter.addEventListener('change', () => {
            loadBestPlayer(leaderboardYearFilter.value, leaderboardFilter.value);
        });

        rankingYearFilter.addEventListener('change', () => {
            loadBestPlayer(rankingYearFilter.value, rankingFilter.value);
        });

        rankingFilter.addEventListener('change', () => {
            loadBestPlayer(rankingYearFilter.value, rankingFilter.value);
        });

        // Populate last loser game filter (no "All Games" option)
        const lastLoserGameFilter = document.getElementById('last-loser-game-filter');
        lastLoserGameFilter.innerHTML = '';
        games.forEach(game => {
            const option = document.createElement('option');
            option.value = game.id_game;
            option.textContent = game.name_game;
            lastLoserGameFilter.appendChild(option);
        });

        // Set default to Uno if available
        const unoGame = games.find(g => g.name_game.toLowerCase() === 'uno');
        if (unoGame) {
            lastLoserGameFilter.value = unoGame.id_game;
        }

        // Load last loser
        const lastLoserYearFilter = document.getElementById('last-loser-year-filter');
        await loadLastLoser(lastLoserYearFilter.value, lastLoserGameFilter.value);

        // Add event listeners for last loser filters
        lastLoserYearFilter.addEventListener('change', () => {
            loadLastLoser(lastLoserYearFilter.value, lastLoserGameFilter.value);
        });
        lastLoserGameFilter.addEventListener('change', () => {
            loadLastLoser(lastLoserYearFilter.value, lastLoserGameFilter.value);
        });

    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('best-worst-player').textContent = 'Error loading data';
    }
}

// DIUBAH: Tambahkan "window."
window.loadRecentGames = async function(page = 1, limit = 10, filters = {}) {
    console.log(`[PAGINATION DEBUG] loadRecentGames function called with page=${page}, limit=${limit}, filters=${JSON.stringify(filters)}`);
    try {
        console.log(`[Pagination] Loading recent games - Page: ${page}, Limit: ${limit}, Filters: ${JSON.stringify(filters)}`);
        const data = await cachedFetchData('Data');
        const players = await cachedFetchData('Player');
        const places = await cachedFetchData('Place');
        const games = await cachedFetchData('Game');

        let filteredData = data;

        // Apply combined filters
        if (filters.player && filters.player !== '') {
            filteredData = filteredData.filter(game => game.id_player === filters.player);
        }

        if (filters.place && filters.place !== '') {
            filteredData = filteredData.filter(game => game.id_place === filters.place);
        }

        if (filters.game && filters.game !== '') {
            filteredData = filteredData.filter(game => game.name_game === games.find(g => g.id_game === filters.game)?.name_game);
        }

        if (filters.startDate && filters.startDate !== '') {
            filteredData = filteredData.filter(game => {
                if (!game.date) return false;
                try {
                    const gameDate = new Date(game.date).toISOString().split('T')[0]; // YYYY-MM-DD format
                    return gameDate >= filters.startDate;
                } catch (error) {
                    console.error('Error parsing date for filtering:', game.date, error);
                    return false;
                }
            });
        }

        if (filters.endDate && filters.endDate !== '') {
            filteredData = filteredData.filter(game => {
                if (!game.date) return false;
                try {
                    const gameDate = new Date(game.date).toISOString().split('T')[0]; // YYYY-MM-DD format
                    return gameDate <= filters.endDate;
                } catch (error) {
                    console.error('Error parsing date for filtering:', game.date, error);
                    return false;
                }
            });
        }

        const sortedData = filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));

        const totalGames = sortedData.length;
        const totalPages = Math.ceil(totalGames / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedGames = sortedData.slice(startIndex, endIndex);

        console.log(`[Pagination] Total games: ${totalGames}, Total pages: ${totalPages}, Current page: ${page}, Showing games ${startIndex + 1}-${Math.min(endIndex, totalGames)}`);

        const tbody = document.querySelector('#recent-games-table tbody');
        tbody.innerHTML = '';

        if (paginatedGames.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" style="text-align: center;">Doesnt Exist</td>
            `;
            tbody.appendChild(row);
        } else {
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
        }

        renderRecentGamesPagination(totalPages, page);
        console.log(`[Pagination] Successfully rendered ${paginatedGames.length} games for page ${page}`);
    } catch (error) {
        console.error('[Pagination] Error loading recent games:', error);
    }
}

// DIUBAH: Tambahkan "window."
window.loadPlayersAndPlaces = async function() {
    try {
        const players = await cachedFetchData('Player');
        const places = await cachedFetchData('Place');
        const games = await cachedFetchData('Game');

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
    prevLi.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changeRecentGamesPage(${currentPage - 1})">Previous</a>`;
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
        pageLi.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changeRecentGamesPage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changeRecentGamesPage(${currentPage + 1})">Next</a>`;
    paginationContainer.appendChild(nextLi);

    console.log('[Pagination] Pagination rendered successfully');
}

window.changeRecentGamesPage = async (page) => {
    console.log(`[PAGINATION DEBUG] changeRecentGamesPage called with page=${page}`);
    console.log(`[Pagination] Changing to page ${page}`);
    const scrollY = window.scrollY;

    // Get current filter values
    const currentFilters = {
        player: document.getElementById('filter-player').value,
        place: document.getElementById('filter-place').value,
        game: document.getElementById('filter-game').value,
        startDate: document.getElementById('filter-start-date').value,
        endDate: document.getElementById('filter-end-date').value
    };

    await loadRecentGames(page, recentGamesPerPage, currentFilters);
    window.scrollTo(0, scrollY);
}

// Initialize filter functionality
async function initializeFilters() {
    try {
        const players = await cachedFetchData('Player');
        const places = await cachedFetchData('Place');
        const games = await cachedFetchData('Game');

        // Populate player filter
        const playerFilter = document.getElementById('filter-player');
        playerFilter.innerHTML = '<option value="">All Players</option>';
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id_player;
            option.textContent = player.name;
            playerFilter.appendChild(option);
        });

        // Populate place filter
        const placeFilter = document.getElementById('filter-place');
        placeFilter.innerHTML = '<option value="">All Places</option>';
        places.forEach(place => {
            const option = document.createElement('option');
            option.value = place.id_place;
            option.textContent = place.name;
            placeFilter.appendChild(option);
        });

        // Populate game filter
        const gameFilter = document.getElementById('filter-game');
        gameFilter.innerHTML = '<option value="">All Games</option>';
        games.forEach(game => {
            const option = document.createElement('option');
            option.value = game.id_game;
            option.textContent = game.name_game;
            gameFilter.appendChild(option);
        });

        // Event listeners for apply and clear buttons
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const clearFiltersBtn = document.getElementById('clear-filters-btn');

        applyFiltersBtn.addEventListener('click', async () => {
            const filters = {
                player: playerFilter.value,
                place: placeFilter.value,
                game: gameFilter.value,
                startDate: document.getElementById('filter-start-date').value,
                endDate: document.getElementById('filter-end-date').value
            };

            currentRecentGamesPage = 1; // Reset to first page
            await loadRecentGames(1, recentGamesPerPage, filters);
        });

        clearFiltersBtn.addEventListener('click', async () => {
            playerFilter.value = '';
            placeFilter.value = '';
            gameFilter.value = '';
            document.getElementById('filter-start-date').value = '';
            document.getElementById('filter-end-date').value = '';

            currentRecentGamesPage = 1; // Reset to first page
            await loadRecentGames(1, recentGamesPerPage, {});
        });

        // Add animation for filter toggle button
        const filterCollapse = document.getElementById('filterCollapse');
        const filterButton = document.querySelector('[data-bs-target="#filterCollapse"]');
        const chevronIcon = filterButton.querySelector('.fa-chevron-down');

        filterCollapse.addEventListener('show.bs.collapse', function () {
            chevronIcon.style.transform = 'rotate(180deg)';
        });

        filterCollapse.addEventListener('hide.bs.collapse', function () {
            chevronIcon.style.transform = 'rotate(0deg)';
        });

    } catch (error) {
        console.error('Error initializing filters:', error);
    }
}

// Initialize generate report functionality
function initializeGenerateReport() {
    const generateReportBtn = document.getElementById('generate-report-btn');
    const generateReportModal = new bootstrap.Modal(document.getElementById('generate-report-modal'));
    const generatePdfBtn = document.getElementById('generate-pdf-btn');

    // Handle generate report button click
    generateReportBtn.addEventListener('click', async () => {
        await populateReportModal();
        generateReportModal.show();
    });

    // Handle generate PDF button click
    generatePdfBtn.addEventListener('click', async () => {
        const playerId = document.getElementById('report-player').value;
        const year = document.getElementById('report-year').value;
        const gameId = document.getElementById('report-game').value;

        if (!playerId || !year) {
            alert('Please select a player and year.');
            return;
        }

        try {
            const players = await cachedFetchData('Player');
            const games = await cachedFetchData('Game');
            const data = await cachedFetchData('Data');

            const player = players.find(p => p.id_player === playerId);
            if (!player) {
                alert('Player not found');
                return;
            }

            let playerData = data.filter(d =>
                d.id_player === playerId &&
                (year === 'all' || new Date(d.date).getFullYear().toString() === year)
            );

            if (gameId !== 'all') {
                const game = games.find(g => g.id_game === gameId);
                if (game) {
                    playerData = playerData.filter(d => d.name_game === game.name_game);
                }
            }

            const wins = playerData.filter(d => d.lose == 0).length;
            const losses = playerData.filter(d => d.lose == 1).length;
            const totalGames = wins + losses;
            const winrate = totalGames ? ((wins / totalGames) * 100).toFixed(2) : 0;
            const points = wins * 3 - losses;

            /* ===== Ranking ===== */
            const stats = {};
            players.forEach(p => stats[p.id_player] = { name: p.name, wins: 0, losses: 0, points: 0 });

            data.forEach(d => {
                if (!stats[d.id_player]) return;
                if (year !== 'all' && new Date(d.date).getFullYear().toString() !== year) return;
                if (gameId !== 'all') {
                    const g = games.find(x => x.id_game === gameId);
                    if (g && d.name_game !== g.name_game) return;
                }

                if (d.lose == 0) {
                    stats[d.id_player].wins++;
                    stats[d.id_player].points += 3;
                } else {
                    stats[d.id_player].losses++;
                    stats[d.id_player].points -= 1;
                }
            });

            const leaderboard = Object.values(stats).map(s => {
                const t = s.wins + s.losses;
                return { ...s, total: t, winrate: t ? s.wins / t : 0 };
            });

            leaderboard.sort((a, b) =>
                b.points !== a.points ? b.points - a.points : b.winrate - a.winrate
            );

            const rank = leaderboard.findIndex(p => p.name === player.name) + 1;

            const gameText = gameId === 'all'
                ? 'All Games'
                : games.find(g => g.id_game === gameId)?.name_game || 'Unknown';

            let level = 'PARTICIPANT';
            if (winrate >= 80) {
                level = 'MASTER PLAYER';
            } else if (winrate >= 60) {
                level = 'SKILLED PLAYER';
            } else if (winrate >= 40) {
                level = 'APPRENTICE PLAYER';
            }

            await generateGameCertificate(playerId, player.name, year, gameText, rank, totalGames, winrate, points, level);
            generateReportModal.hide();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    });
}

// DIUBAH: Tambahkan "window."
window.loadLastLoser = async function(yearFilter = '2026', gameFilter = '') {
    try {
        const data = await cachedFetchData('Data');
        const players = await cachedFetchData('Player');
        const games = await cachedFetchData('Game');
        const places = await cachedFetchData('Place');

        // Filter data based on selected year and game
        let filteredData = data;
        if (yearFilter !== 'all') {
            filteredData = filteredData.filter(game => new Date(game.date).getFullYear().toString() === yearFilter);
        }
        if (gameFilter !== '') {
            filteredData = filteredData.filter(game => game.name_game === games.find(g => g.id_game === gameFilter)?.name_game);
        }

        // Filter for losses only
        const losses = filteredData.filter(game => game.lose === '1' || game.lose === 1);

        // Sort by date descending to get the most recent loss
        losses.sort((a, b) => new Date(b.date) - new Date(a.date));

        let lastLoser = null;
        let lastLossDetails = null;
        if (losses.length > 0) {
            const lastLoss = losses[0];
            lastLoser = players.find(p => p.id_player === lastLoss.id_player);
            const place = places.find(p => p.id_place === lastLoss.id_place);
            const game = games.find(g => g.name_game === lastLoss.name_game);

            // Format date and time
            let formattedDateTime = 'Unknown';
            let formattedPlace = 'Unknown';
            if (lastLoss.date) {
                try {
                    const dateMatch = lastLoss.date.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
                    if (dateMatch) {
                        const dateStr = dateMatch[1];
                        const timeStr = dateMatch[2];
                        const [year, month, day] = dateStr.split('-').map(Number);
                        const [hour, minute, second] = timeStr.split(':').map(Number);
                        formattedDateTime = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
                    }
                } catch (error) {
                    console.error('Error parsing date for last loser:', lastLoss.date, error);
                }
            }
            if (place) {
                formattedPlace = place.name;
            }

            lastLossDetails = `${formattedDateTime} at ${formattedPlace}`;
        }

        // Update last loser card
        if (lastLoser) {
            document.getElementById('last-loser-name').textContent = lastLoser.name;
            document.getElementById('last-loser-details').textContent = lastLossDetails;
        } else {
            document.getElementById('last-loser-name').textContent = 'No data';
            document.getElementById('last-loser-details').textContent = 'No recent losses found';
        }
    } catch (error) {
        console.error('Error loading last loser:', error);
        document.getElementById('last-loser-name').textContent = 'Error loading data';
        document.getElementById('last-loser-details').textContent = 'Error loading details';
    }
}

// Populate report modal dropdowns
async function populateReportModal() {
    try {
        const players = await cachedFetchData('Player');
        const games = await cachedFetchData('Game');
        const data = await cachedFetchData('Data');

        // Populate players
        const playerSelect = document.getElementById('report-player');
        playerSelect.innerHTML = '<option value="">Choose a player</option>';
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id_player;
            option.textContent = player.name;
            playerSelect.appendChild(option);
        });

        // Populate years
        const yearSelect = document.getElementById('report-year');
        yearSelect.innerHTML = '<option value="">Choose a year</option>';
        const years = [...new Set(data.map(d => new Date(d.date).getFullYear()))].sort((a, b) => b - a);
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year.toString();
            option.textContent = year.toString();
            yearSelect.appendChild(option);
        });

        // Add "All Time" option
        const allTimeOption = document.createElement('option');
        allTimeOption.value = 'all';
        allTimeOption.textContent = 'All Time';
        yearSelect.appendChild(allTimeOption);

        // Populate games
        const gameSelect = document.getElementById('report-game');
        gameSelect.innerHTML = '<option value="all">All Games</option>';
        games.forEach(game => {
            const option = document.createElement('option');
            option.value = game.id_game;
            option.textContent = game.name_game;
            gameSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating report modal:', error);
    }
}


