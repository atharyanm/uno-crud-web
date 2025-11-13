// homepage.js - Homepage with dynamic page loading
const APP_VERSION = "1.0.1";
let currentPage = 'dashboard';

function checkSession() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        window.location.href = 'index.html';
        return true; // redirected
    }
    return false;
}

$(document).ready(function() {
    if (checkSession()) return;

    // Role-based access control
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser.role !== 'admin') {
        // Hide admin-only menu items
        $('.nav-link[data-page="player"]').parent().hide();
        $('.nav-link[data-page="place"]').parent().hide();
        $('.nav-link[data-page="user"]').parent().hide();
        $('.nav-link[data-page="game"]').parent().hide();
    }

    // Load default page (dashboard)
    loadPage('dashboard');

    // Sidebar navigation
    $('.nav-link[data-page]').on('click', function(e) {
        e.preventDefault();
        const page = $(this).data('page');

        // Update active state
        $('.nav-link').removeClass('active');
        $(this).addClass('active');

        // Update navbar current page display
        updateNavbarCurrentPage(page);

        // Load page content
        loadPage(page);

        // Close sidebar on mobile after navigation
        if ($(window).width() < 768) {
            $('#sidebar').collapse('hide');
            $('main').removeClass('main-shifted');
        }
    });

    // Sidebar toggle functionality
    $('#sidebar-toggle').on('click', function() {
        const sidebar = $('#sidebar');
        const main = $('main');
        const windowWidth = $(window).width();

        if (windowWidth >= 768) {
            // Desktop/Tablet behavior: hide/show sidebar with content shift
            if (sidebar.hasClass('d-none')) {
                // Show sidebar
                sidebar.removeClass('d-none').css('top', $('.navbar').outerHeight() + 'px');
                main.removeClass('main-hidden');
                $(this).attr('title', 'Close sidebar');
            } else {
                // Hide sidebar
                sidebar.addClass('d-none').css('top', '0px');
                main.addClass('main-hidden');
                $(this).attr('title', 'Open sidebar');
            }
        } else {
            // Mobile behavior: overlay sidebar with content shift
            if (sidebar.hasClass('show')) {
                // Hide sidebar
                sidebar.removeClass('show').addClass('hidden');
                main.removeClass('main-shifted');
                $(this).attr('title', 'Open sidebar');
            } else {
                // Show sidebar
                sidebar.removeClass('hidden').addClass('show');
                main.addClass('main-shifted');
                $(this).attr('title', 'Close sidebar');
            }
        }
    });

    // Function to update toggle button position based on sidebar state
    function updateToggleButtonPosition(windowWidth, isHidden) {
        const toggleBtn = $('#sidebar-toggle');
        const icon = toggleBtn.find('i');

        if (windowWidth < 768) {
            // Mobile: position based on sidebar state, centered vertically
            if (isHidden) {
                toggleBtn.css({
                    'left': '10px',
                    'top': '50%',
                    'transform': 'translateY(-50%)'
                });
            } else {
                const sidebarWidth = 250; // Mobile sidebar width
                toggleBtn.css({
                    'left': (sidebarWidth - 20) + 'px',
                    'top': '50%',
                    'transform': 'translateY(-50%)'
                });
            }
            icon.removeClass('fa-chevron-left fa-chevron-right fa-bars fa-times').addClass('fa-bars');
        } else {
            // Desktop/Tablet: position based on sidebar width
            if (isHidden) {
                toggleBtn.css({
                    'left': '0px',
                    'top': '50%',
                    'transform': 'translateY(-50%)'
                });
                icon.removeClass('fa-chevron-left fa-chevron-right fa-bars fa-times').addClass('fa-bars');
            } else {
                const sidebarWidth = windowWidth < 1024 ? 180 : 250;
                toggleBtn.css({
                    'left': (sidebarWidth - 20) + 'px',
                    'top': '50%',
                    'transform': 'translateY(-50%)'
                });
                icon.removeClass('fa-chevron-left fa-chevron-right fa-bars fa-times').addClass('fa-bars');
            }
        }
    }

    // Handle responsive sidebar behavior
    function updateSidebarToggle() {
        const windowWidth = $(window).width();
        const sidebar = $('#sidebar');
        const main = $('main');

        if (windowWidth < 768) {
            // Mobile: sidebar is hidden by default (overlay mode)
            sidebar.removeClass('show d-none');
            main.removeClass('main-hidden main-shifted');
            // updateToggleButtonPosition(windowWidth, true); // Commented out to prevent repositioning issues on mobile
        } else {
            // Desktop/Tablet: sidebar is hidden by default
            sidebar.addClass('d-none');
            main.addClass('main-hidden');
            // Ensure button is in navbar when sidebar is hidden
            if ($('#sidebar-toggle').parent().is('#sidebar')) {
                $('#sidebar-toggle').detach().prependTo('.navbar .d-flex.align-items-center.me-auto');
                // Reset only necessary positioning when moving to navbar, DO NOT touch top/left/transform
                $('#sidebar-toggle').css({
                    'position': 'relative',
                    'left': '',
                    'top': '',
                    'transform': '',
                });
            }
            // updateToggleButtonPosition(windowWidth, true); // Commented out to prevent pulling button to top
        }
    }

    // Initial check
    updateSidebarToggle();

    // Update on window resize
    $(window).on('resize', function() {
        updateSidebarToggle();
    });

    // Logout functionality
    $('#logout').on('click', function(e) {
        e.preventDefault();
        const logoutModal = new bootstrap.Modal(document.getElementById('logout-modal'));
        logoutModal.show();
    });

    // Confirm logout
    $('#confirm-logout').on('click', function() {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });
});

function loadPage(page) {
    if (checkSession()) return;
    currentPage = page;

    // 1. Muat konten HTML (dengan parameter versi)
    $.get(`pages/${page}.html?v=${APP_VERSION}`, function(data) {
        $('#page-content').html(data);

        // 2. Muat file JS yang sesuai (dengan parameter versi)
        $.getScript(`pages/${page}.js?v=${APP_VERSION}`, function() {
            // 3. Jalankan fungsi load spesifik halaman (mis: loadDashboardContent)
            const loadFunctionName = `load${page.charAt(0).toUpperCase() + page.slice(1)}Content`;
            if (window[loadFunctionName]) {
                window[loadFunctionName]();
            }
        }).fail(function() {
            console.error(`Failed to load pages/${page}.js`);
        });
    }).fail(function() {
        $('#page-content').html('<p>Error loading page content.</p>');
    });
}

function updateNavbarCurrentPage(page) {
    const pageData = {
        dashboard: { icon: 'fas fa-tachometer-alt', text: 'Dashboard' },
        player: { icon: 'fas fa-users', text: 'Players' },
        place: { icon: 'fas fa-map-marker-alt', text: 'Places' },
        user: { icon: 'fas fa-user-cog', text: 'Users' },
        game: { icon: 'fas fa-gamepad', text: 'Games' }
    };

    const data = pageData[page];
    if (data) {
        $('#current-page-icon').attr('class', data.icon + ' me-2');
        $('#current-page-text').text(data.text);
    }

    // Update responsiveness after setting page
    updateNavbarResponsiveness();
}

function updateNavbarResponsiveness() {
    const windowWidth = $(window).width();
    const iconElement = $('#current-page-icon');
    const textElement = $('#current-page-text');

    // Always show text, adjust icon spacing for mobile
    if (windowWidth < 768) {
        // Mobile: adjust icon size if needed
        iconElement.removeClass('me-2').addClass('me-1');
    } else {
        // Desktop: standard spacing
        iconElement.removeClass('me-1').addClass('me-2');
    }
}

async function loadDashboardContent() {
    try {
        // Load best player
        await loadBestPlayer();

        // Load worst player
        await loadWorstPlayer();

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

                    // Ambil waktu dari input (anggap device sudah di zona WIB)
                    const wibDate = new Date(datetime);

                    // Format ke "YYYY-MM-DD HH:MM:SS" tanpa konversi timezone
                    const dateStr = `${wibDate.getFullYear()}-${String(wibDate.getMonth() + 1).padStart(2, '0')}-${String(wibDate.getDate()).padStart(2, '0')} ${String(wibDate.getHours()).padStart(2, '0')}:${String(wibDate.getMinutes()).padStart(2, '0')}:${String(wibDate.getSeconds()).padStart(2, '0')}`;

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
}

async function loadBestPlayer() {
    try {
        const players = await fetchData('Player');
        const data = await fetchData('Data');

        if (players.length === 0) {
            $('#best-player').text('No players available');
            return;
        }

        let bestPlayer = null;
        let bestWinRate = -1;

        players.forEach(player => {
            const playerGames = data.filter(d => d.id_player === player.id_player);
            const totalGames = playerGames.length;
            if (totalGames > 0) {
                const losses = playerGames.filter(d => d.lose === '1' || d.lose === 1).length;
                const wins = totalGames - losses;
                const winRate = (wins / totalGames) * 100;

                if (winRate > bestWinRate) {
                    bestWinRate = winRate;
                    bestPlayer = player;
                }
            }
        });

        if (bestPlayer) {
            $('#best-player').text(`${bestPlayer.name} (${bestWinRate.toFixed(2)}% win rate)`);
        } else {
            $('#best-player').text('No games played yet');
        }
    } catch (error) {
        console.error('Error loading best player:', error);
        $('#best-player').text('Error loading best player');
    }
}

async function loadWorstPlayer() {
    try {
        const players = await fetchData('Player');
        const data = await fetchData('Data');

        if (players.length === 0) {
            $('#worst-player').text('No players available');
            return;
        }

        let worstPlayer = null;
        let worstWinRate = 101;

        players.forEach(player => {
            const playerGames = data.filter(d => d.id_player === player.id_player);
            const totalGames = playerGames.length;
            if (totalGames > 0) {
                const losses = playerGames.filter(d => d.lose === '1' || d.lose === 1).length;
                const wins = totalGames - losses;
                const winRate = (wins / totalGames) * 100;

                if (winRate < worstWinRate) {
                    worstWinRate = winRate;
                    worstPlayer = player;
                }
            }
        });

        if (worstPlayer) {
            $('#worst-player').text(`${worstPlayer.name} (${worstWinRate.toFixed(2)}% win rate)`);
        } else {
            $('#worst-player').text('No games played yet');
        }
    } catch (error) {
        console.error('Error loading worst player:', error);
        $('#worst-player').text('Error loading worst player');
    }
}

async function loadRecentGames(page = 1) {
    console.log(`[PAGINATION DEBUG] loadRecentGames function called with page=${page}`);
    try {
        console.log(`[Pagination] Loading recent games - Page: ${page}, Limit: ${recentGamesPerPage}`);
        const data = await fetchData('Data');
        const players = await fetchData('Player');
        const places = await fetchData('Place');
        const games = await fetchData('Game');

        // Sort data by date descending (most recent first)
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate pagination
        const totalGames = sortedData.length;
        const totalPages = Math.ceil(totalGames / recentGamesPerPage);
        const startIndex = (page - 1) * recentGamesPerPage;
        const endIndex = startIndex + recentGamesPerPage;
        const paginatedGames = sortedData.slice(startIndex, endIndex);

        console.log(`[Pagination] Total games: ${totalGames}, Total pages: ${totalPages}, Current page: ${page}, Showing games ${startIndex + 1}-${Math.min(endIndex, totalGames)}`);

        const tbody = document.querySelector('#recent-games-table tbody');
        tbody.innerHTML = '';

        paginatedGames.forEach(game => {
            const player = players.find(p => p.id_player === game.id_player);
            const place = places.find(p => p.id_place === game.id_place);
            const gameType = games.find(g => g.name_game === game.name_game);
            const result = game.lose === '1' || game.lose === 1 ? 'Lose' : 'Win';

            // Convert WIB date to local timezone
            let formattedDate = 'Unknown';
            if (game.date) {
                try {
                    // Use regex to extract date and time, ignoring timezone offset if present
                    const dateMatch = game.date.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
                    if (!dateMatch) {
                        console.warn('Invalid date format for game:', game.date);
                        formattedDate = 'Invalid Date';
                    } else {
                        const dateStr = dateMatch[1]; // YYYY-MM-DD
                        const timeStr = dateMatch[2]; // HH:MM:SS

                        const [year, month, day] = dateStr.split('-').map(Number);
                        const [hour, minute, second] = timeStr.split(':').map(Number);

                        // Display the database time as-is, without timezone conversion
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

        // Render pagination
        renderRecentGamesPagination(totalPages, page);
        console.log(`[Pagination] Successfully rendered ${paginatedGames.length} games for page ${page}`);
    } catch (error) {
        console.error('[Pagination] Error loading recent games:', error);
    }
}

function renderRecentGamesPagination(totalPages, currentPage) {
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

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changeRecentGamesPage(${currentPage - 1})">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeRecentGamesPage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changeRecentGamesPage(${currentPage + 1})">Next</a>`;
    paginationContainer.appendChild(nextLi);

    console.log('[Pagination] Pagination rendered successfully');
}

function changeRecentGamesPage(page) {
    console.log(`[PAGINATION DEBUG] changeRecentGamesPage called with page=${page}`);
    console.log(`[Pagination] Changing to page ${page}`);
    currentRecentGamesPage = page;
    loadRecentGames(page);
}

async function loadPlayersAndPlaces() {
    try {
        const players = await fetchData('Player');
        const places = await fetchData('Place');
        const games = await fetchData('Game');

        const playerSelect = document.getElementById('winrate-players');
        const loserSelect = document.getElementById('winrate-loser');
        const placeSelect = document.getElementById('winrate-place');
        const gameSelect = document.getElementById('winrate-game');
        const selectedPlayersDiv = document.getElementById('selected-players');

        // Clear existing options
        playerSelect.innerHTML = '<option value="">Select Player</option>';
        loserSelect.innerHTML = '<option value="">Select Loser</option>';
        placeSelect.innerHTML = '<option value="">Select Place</option>';
        gameSelect.innerHTML = '<option value="">Select Game</option>';
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

        // Populate game options
        games.forEach(game => {
            const option = document.createElement('option');
            option.value = game.id_game;
            option.textContent = game.name_game;
            gameSelect.appendChild(option);
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
        console.error('Error loading players, places, and games:', error);
    }
}

async function loadUserContent() {
    console.log('Loading user content');
    // Load users
    await loadUsers();

    // Modal functionality for add user using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('user-modal'));
    document.getElementById('add-user-btn').addEventListener('click', () => {
        modal.show();
    });

    // Add user form
    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = document.getElementById('user-form');
        const loadingDiv = document.getElementById('user-loading');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Show loading
        loadingDiv.classList.remove('d-none');
        form.style.display = 'none';
        submitBtn.disabled = true;

        try {
            const username = document.getElementById('user-username').value;
            const password = document.getElementById('user-password').value;
            const role = document.getElementById('user-role').value || 'user';
            const idUser = await generateSequentialId('User', 'USR_');
            console.log(`Adding new user: ${username}, ID: ${idUser}, Role: ${role}`);

            const newUser = { id_user: idUser, username, password, role };
            const result = await insertData('User', newUser);
            if (result) {
                console.log('User added successfully');
                document.getElementById('user-username').value = '';
                document.getElementById('user-password').value = '';
                document.getElementById('user-role').value = 'user';
                modal.hide();
                await loadUsers();
            } else {
                console.error('Failed to add user');
                alert('Failed to add user. Please try again.');
            }
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Error adding user. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            form.style.display = 'block';
            submitBtn.disabled = false;
        }
    });

    // Attach edit and delete functions globally
    window.editUser = editUser;
    window.deleteUser = deleteUser;
}

async function loadUsers(page = 1) {
    try {
        const users = await fetchData('User');

        // Calculate pagination
        const totalUsers = users.length;
        const usersPerPage = 10;
        const totalPages = Math.ceil(totalUsers / usersPerPage);
        const startIndex = (page - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const usersToShow = users.slice(startIndex, endIndex);

        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '';

        if (usersToShow.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-warning">No users found in database</td></tr>';
            console.log('No users found in the database');
        } else {
            usersToShow.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id_user}</td>
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-primary btn-sm rounded-pill edit-btn" onclick="editUser('${user.id_user}')"><i class="fas fa-edit"></i> UBAH</button>
                            <button class="btn btn-danger btn-sm rounded-pill delete-btn" onclick="deleteUser('${user.id_user}')"><i class="fas fa-trash"></i> HAPUS</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            console.log(`Loaded ${usersToShow.length} users on page ${page}`);
        }

        // Generate pagination
        console.log(`Total users: ${totalUsers}, Total pages: ${totalPages}, Current page: ${page}`);
        renderUserPagination(totalPages, page);
    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading users</td></tr>';
    }
}

function renderUserPagination(totalPages, currentPage) {
    console.log('Rendering pagination, totalPages:', totalPages, 'currentPage:', currentPage);
    const paginationContainer = document.getElementById('user-pagination');
    console.log('Pagination container:', paginationContainer);
    if (!paginationContainer) {
        console.error('Pagination container not found!');
        return;
    }
    paginationContainer.innerHTML = '';

    if (totalPages === 0) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changeUserPage(${currentPage - 1})">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeUserPage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changeUserPage(${currentPage + 1})">Next</a>`;
    paginationContainer.appendChild(nextLi);
}

function changeUserPage(page) {
    currentUserPage = page;
    loadUsers(page);
}

async function deleteUser(id) {
    console.log(`Deleting user with ID: ${id}`);
    // Open delete confirmation modal using Bootstrap
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-user-modal'));
    deleteModal.show();

    // Handle confirm delete
    document.getElementById('confirm-delete-btn').onclick = async () => {
        const loadingDiv = document.getElementById('delete-user-loading');
        const confirmContent = document.getElementById('delete-confirm-content');

        // Show loading
        loadingDiv.classList.remove('d-none');
        confirmContent.style.display = 'none';

        try {
            const result = await deleteData('User', id);
            if (result) {
                console.log('User deleted successfully');
                deleteModal.hide();
                await loadUsers();
            } else {
                console.error('Failed to delete user');
                alert('Failed to delete user. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            confirmContent.style.display = 'block';
        }
    };
}

async function editUser(id) {
    console.log(`Editing user with ID: ${id}`);
    // Open edit modal and populate fields using Bootstrap
    const editModal = new bootstrap.Modal(document.getElementById('edit-user-modal'));
    const users = await fetchData('User');
    const user = users.find(u => u.id_user === id);
    if (user) {
        document.getElementById('edit-user-username').value = user.username;
        document.getElementById('edit-user-password').value = user.password;
        document.getElementById('edit-user-role').value = user.role;
        editModal.show();

        // Handle edit form submission
        document.getElementById('edit-user-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = document.getElementById('edit-user-form');
            const loadingDiv = document.getElementById('edit-user-loading');
            const submitBtn = form.querySelector('button[type="submit"]');

            // Show loading
            loadingDiv.classList.remove('d-none');
            form.style.display = 'none';
            submitBtn.disabled = true;

            try {
                const newUsername = document.getElementById('edit-user-username').value;
                const newPassword = document.getElementById('edit-user-password').value;
                const newRole = document.getElementById('edit-user-role').value;
                const result = await updateData('User', id, { username: newUsername, password: newPassword, role: newRole });
                if (result) {
                    console.log('User updated successfully');
                    editModal.hide();
                    await loadUsers();
                } else {
                    console.error('Failed to update user');
                    alert('Failed to update user. Please try again.');
                }
            } catch (error) {
                console.error('Error updating user:', error);
                alert('Error updating user. Please try again.');
            } finally {
                // Hide loading
                loadingDiv.classList.add('d-none');
                form.style.display = 'block';
                submitBtn.disabled = false;
            }
        };
    }
}

async function loadPlayerContent() {
    console.log('Loading player content');
    // Load players
    await loadPlayers();

    // Modal functionality for add player using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('player-modal'));
    document.getElementById('add-player-btn').addEventListener('click', () => {
        modal.show();
    });

    // Modal functionality for edit player using Bootstrap
    const editModal = new bootstrap.Modal(document.getElementById('edit-player-modal'));

    // Modal functionality for delete confirmation using Bootstrap
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-player-modal'));

    // Add player form
    document.getElementById('player-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = document.getElementById('player-form');
        const loadingDiv = document.getElementById('player-loading');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Show loading
        loadingDiv.classList.remove('d-none');
        form.style.display = 'none';
        submitBtn.disabled = true;

        try {
            const name = document.getElementById('player-name').value;
            const dateJoin = document.getElementById('player-date-join').value; // YYYY-MM-DD
            const idPlayer = await generateSequentialId('Player', 'PLY_');
            console.log(`Adding new player: ${name}, ID: ${idPlayer}, Date: ${dateJoin}`);

            const newPlayer = { id_player: idPlayer, name, date_join: dateJoin };
            const result = await insertData('Player', newPlayer);
            if (result) {
                console.log('Player added successfully');
                document.getElementById('player-name').value = '';
                document.getElementById('player-date-join').value = '';
                modal.hide();
                await loadPlayers();
            } else {
                console.error('Failed to add player');
                alert('Failed to add player. Please try again.');
            }
        } catch (error) {
            console.error('Error adding player:', error);
            alert('Error adding player. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            form.style.display = 'block';
            submitBtn.disabled = false;
        }
    });

    // Attach edit and delete functions globally
    window.editPlayer = editPlayer;
    window.deletePlayer = deletePlayer;
}

let currentPlayerPage = 1;
const homepagePlayersPerPage = 10; // Nama unik

async function loadPlayers(page = 1) {
    try {
        const players = await fetchData('Player');
        const data = await fetchData('Data');

        // Calculate pagination
        const totalPlayers = players.length;
        const playersPerPage = homepagePlayersPerPage; // Gunakan variabel unik
        const totalPages = Math.ceil(totalPlayers / playersPerPage);
        const startIndex = (page - 1) * playersPerPage;
        const endIndex = startIndex + playersPerPage;
        const playersToShow = players.slice(startIndex, endIndex);

        const tbody = document.querySelector('#players-table tbody');
        tbody.innerHTML = '';

        if (playersToShow.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-warning">No players found in database</td></tr>';
            console.log('No players found in the database');
        } else {
            playersToShow.forEach(player => {
                const playerGames = data.filter(d => d.id_player === player.id_player);
                const totalGames = playerGames.length;
                const losses = playerGames.filter(d => d.lose === '1' || d.lose === 1).length;
                const wins = totalGames - losses;
                const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) : 0;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${player.id_player}</td>
                    <td>${player.name}</td>
                    <td>${player.date_join}</td>
                    <td>${winRate}% (${wins}/${totalGames})</td>
                    <td>
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-primary btn-sm rounded-pill edit-btn" onclick="editPlayer('${player.id_player}')"><i class="fas fa-edit"></i> UBAH</button>
                            <button class="btn btn-danger btn-sm rounded-pill delete-btn" onclick="deletePlayer('${player.id_player}')"><i class="fas fa-trash"></i> HAPUS</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            console.log(`Loaded ${playersToShow.length} players on page ${page}`);
        }

        // Generate pagination
        console.log(`Total players: ${totalPlayers}, Total pages: ${totalPages}, Current page: ${page}`);
        renderPlayerPagination(totalPages, page);
    } catch (error) {
        console.error('Error loading players:', error);
        const tbody = document.querySelector('#players-table tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading players</td></tr>';
    }
}

async function deletePlayer(id) {
    console.log(`Deleting player with ID: ${id}`);
    // Open delete confirmation modal using Bootstrap
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-player-modal'));
    deleteModal.show();

    // Handle confirm delete
    document.getElementById('confirm-delete-player-btn').onclick = async () => {
        const loadingDiv = document.getElementById('delete-player-loading');
        const confirmContent = document.getElementById('delete-player-confirm-content');

        // Show loading
        loadingDiv.classList.remove('d-none');
        confirmContent.style.display = 'none';

        try {
            // First, delete related data records
            const allData = await fetchData('Data');
            const relatedData = allData.filter(d => d.id_player === id);
            for (const data of relatedData) {
                await deleteData('Data', data.id);
            }

            const result = await deleteData('Player', id);
            if (result) {
                console.log('Player deleted successfully');
                deleteModal.hide();
                await loadPlayers();
            } else {
                console.error('Failed to delete player');
                alert('Failed to delete player. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting player:', error);
            alert('Error deleting player. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            confirmContent.style.display = 'block';
        }
    };
}

async function editPlayer(id) {
    console.log(`Editing player with ID: ${id}`);
    // Open edit modal and populate fields using Bootstrap
    const editModal = new bootstrap.Modal(document.getElementById('edit-player-modal'));
    const players = await fetchData('Player');
    const player = players.find(p => p.id_player === id);
    if (player) {
        document.getElementById('edit-player-name').value = player.name;
        document.getElementById('edit-player-date-join').value = player.date_join;
        editModal.show();

        // Handle edit form submission
        document.getElementById('edit-player-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = document.getElementById('edit-player-form');
            const loadingDiv = document.getElementById('edit-player-loading');
            const submitBtn = form.querySelector('button[type="submit"]');

            // Show loading
            loadingDiv.classList.remove('d-none');
            form.style.display = 'none';
            submitBtn.disabled = true;

            try {
                const newName = document.getElementById('edit-player-name').value;
                const newDateJoin = document.getElementById('edit-player-date-join').value;
                const result = await updateData('Player', id, { name: newName, date_join: newDateJoin });
                if (result) {
                    console.log('Player updated successfully');
                    editModal.hide();
                    await loadPlayers();
                } else {
                    console.error('Failed to update player');
                    alert('Failed to update player. Please try again.');
                }
            } catch (error) {
                console.error('Error updating player:', error);
                alert('Error updating player. Please try again.');
            } finally {
                // Hide loading
                loadingDiv.classList.add('d-none');
                form.style.display = 'block';
                submitBtn.disabled = false;
            }
        };
    }
}

function renderPlayerPagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('player-pagination');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePlayerPage(${currentPage - 1})">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" onclick="changePlayerPage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePlayerPage(${currentPage + 1})">Next</a>`;
    paginationContainer.appendChild(nextLi);
}

function changePlayerPage(page) {
    currentPlayerPage = page;
    loadPlayers(page);
}

let currentPlacePage = 1;
const placesPerPage = 10;

let currentGamePage = 1;
const gamesPerPage = 10;

async function loadPlaces(page = 1) {
    try {
        const places = await fetchData('Place');

        // Calculate pagination
        const totalPlaces = places.length;
        const totalPages = Math.ceil(totalPlaces / placesPerPage);
        const startIndex = (page - 1) * placesPerPage;
        const endIndex = startIndex + placesPerPage;
        const placesToShow = places.slice(startIndex, endIndex);

        const tbody = document.querySelector('#places-table tbody');
        tbody.innerHTML = '';

        placesToShow.forEach(place => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${place.id_place}</td>
                <td>${place.name}</td>
                <td>${place.date}</td>
                <td>
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn btn-primary btn-sm rounded-pill edit-btn" onclick="editPlace('${place.id_place}')"><i class="fas fa-edit"></i> UBAH</button>
                        <button class="btn btn-danger btn-sm rounded-pill delete-btn" onclick="deletePlace('${place.id_place}')"><i class="fas fa-trash"></i> HAPUS</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Generate pagination
        renderPlacePagination(totalPages, page);
    } catch (error) {
        console.error('Error loading places:', error);
    }
}

async function loadGames(page = 1) {
    try {
        const games = await fetchData('Game');

        // Calculate pagination
        const totalGames = games.length;
        const totalPages = Math.ceil(totalGames / gamesPerPage);
        const startIndex = (page - 1) * gamesPerPage;
        const endIndex = startIndex + gamesPerPage;
        const gamesToShow = games.slice(startIndex, endIndex);

        const tbody = document.querySelector('#games-table tbody');
        tbody.innerHTML = '';

        gamesToShow.forEach(game => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${game.id_game}</td>
                <td>${game.name_game}</td>
                <td>${game.added}</td>
                <td>
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn btn-primary btn-sm rounded-pill edit-btn" onclick="editGame('${game.id_game}')"><i class="fas fa-edit"></i> UBAH</button>
                        <button class="btn btn-danger btn-sm rounded-pill delete-btn" onclick="deleteGame('${game.id_game}')"><i class="fas fa-trash"></i> HAPUS</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Generate pagination
        renderGamePagination(totalPages, page);
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

function renderPlacePagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('place-pagination');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePlacePage(${currentPage - 1})">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" onclick="changePlacePage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePlacePage(${currentPage + 1})">Next</a>`;
    paginationContainer.appendChild(nextLi);
}

function changePlacePage(page) {
    currentPlacePage = page;
    loadPlaces(page);
}

async function deletePlace(id) {
    console.log(`Deleting place with ID: ${id}`);
    // Open delete confirmation modal using Bootstrap
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-place-modal'));
    deleteModal.show();

    // Handle confirm delete
    document.getElementById('confirm-delete-place-btn').onclick = async () => {
        const loadingDiv = document.getElementById('delete-place-loading');
        const confirmContent = document.getElementById('delete-place-confirm-content');

        // Show loading
        loadingDiv.classList.remove('d-none');
        confirmContent.style.display = 'none';

        try {
            // First, delete related data records
            const allData = await fetchData('Data');
            const relatedData = allData.filter(d => d.id_place === id);
            for (const data of relatedData) {
                await deleteData('Data', data.id);
            }

            const result = await deleteData('Place', id);
            if (result) {
                console.log('Place deleted successfully');
                deleteModal.hide();
                await loadPlaces();
            } else {
                console.error('Failed to delete place');
                alert('Failed to delete place. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting place:', error);
            alert('Error deleting place. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            confirmContent.style.display = 'block';
        }
    };
}

async function editPlace(id) {
    console.log(`Editing place with ID: ${id}`);
    // Open edit modal and populate fields using Bootstrap
    const editModal = new bootstrap.Modal(document.getElementById('edit-place-modal'));
    const places = await fetchData('Place');
    const place = places.find(p => p.id_place === id);
    if (place) {
        document.getElementById('edit-place-name').value = place.name;
        document.getElementById('edit-place-date').value = place.date;
        editModal.show();

        // Handle edit form submission
        document.getElementById('edit-place-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = document.getElementById('edit-place-form');
            const loadingDiv = document.getElementById('edit-place-loading');
            const submitBtn = form.querySelector('button[type="submit"]');

            // Show loading
            loadingDiv.classList.remove('d-none');
            form.style.display = 'none';
            submitBtn.disabled = true;

            try {
                const newName = document.getElementById('edit-place-name').value;
                const newDate = document.getElementById('edit-place-date').value;
                const result = await updateData('Place', id, { name: newName, date: newDate });
                if (result) {
                    console.log('Place updated successfully');
                    editModal.hide();
                    await loadPlaces();
                } else {
                    console.error('Failed to update place');
                    alert('Failed to update place. Please try again.');
                }
            } catch (error) {
                console.error('Error updating place:', error);
                alert('Error updating place. Please try again.');
            } finally {
                // Hide loading
                loadingDiv.classList.add('d-none');
                form.style.display = 'block';
                submitBtn.disabled = false;
            }
        };
    }
}

function renderGamePagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('game-pagination');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changeGamePage(${currentPage - 1})">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeGamePage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changeGamePage(${currentPage + 1})">Next</a>`;
    paginationContainer.appendChild(nextLi);
}

function changeGamePage(page) {
    currentGamePage = page;
    loadGames(page);
}

async function deleteGame(id) {
    console.log(`Deleting game with ID: ${id}`);
    // Open delete confirmation modal using Bootstrap
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-game-modal'));
    deleteModal.show();

    // Handle confirm delete
    document.getElementById('confirm-delete-game-btn').onclick = async () => {
        const loadingDiv = document.getElementById('delete-game-loading');
        const confirmContent = document.getElementById('delete-game-confirm-content');

        // Show loading
        loadingDiv.classList.remove('d-none');
        confirmContent.style.display = 'none';

        try {
            // First, delete related data records
            const allData = await fetchData('Data');
            const relatedData = allData.filter(d => d.id_game === id);
            for (const data of relatedData) {
                await deleteData('Data', data.id);
            }

            const result = await deleteData('Game', id);
            if (result) {
                console.log('Game deleted successfully');
                deleteModal.hide();
                await loadGames();
            } else {
                console.error('Failed to delete game');
                alert('Failed to delete game. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting game:', error);
            alert('Error deleting game. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            confirmContent.style.display = 'block';
        }
    };
}

async function editGame(id) {
    console.log(`Editing game with ID: ${id}`);
    // Open edit modal and populate fields using Bootstrap
    const editModal = new bootstrap.Modal(document.getElementById('edit-game-modal'));
    const games = await fetchData('Game');
    const game = games.find(g => g.id_game === id);
    if (game) {
        document.getElementById('edit-game-name').value = game.name_game;
        document.getElementById('edit-game-date').value = game.added;
        editModal.show();

        // Handle edit form submission
        document.getElementById('edit-game-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = document.getElementById('edit-game-form');
            const loadingDiv = document.getElementById('edit-game-loading');
            const submitBtn = form.querySelector('button[type="submit"]');

            // Show loading
            loadingDiv.classList.remove('d-none');
            form.style.display = 'none';
            submitBtn.disabled = true;

            try {
                const newName = document.getElementById('edit-game-name').value;
                const newDate = document.getElementById('edit-game-date').value;
                const result = await updateData('Game', id, { name_game: newName, added: newDate });
                if (result) {
                    console.log('Game updated successfully');
                    editModal.hide();
                    await loadGames();
                } else {
                    console.error('Failed to update game');
                    alert('Failed to update game. Please try again.');
                }
            } catch (error) {
                console.error('Error updating game:', error);
                alert('Error updating game. Please try again.');
            } finally {
                // Hide loading
                loadingDiv.classList.add('d-none');
                form.style.display = 'block';
                submitBtn.disabled = false;
            }
        };
    }
}




