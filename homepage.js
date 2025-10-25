// homepage.js - Homepage with dynamic page loading
$(document).ready(function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        window.location.href = 'index.html';
        return;
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

        // Load page content
        loadPage(page);
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
    // Load content from separate HTML files for all pages
    $.get(`pages/${page}.html`, function(data) {
        $('#page-content').html(data);
        // Execute page-specific JavaScript after loading
        if (page === 'dashboard') {
            loadDashboardContent();
        } else if (page === 'user') {
            loadUserContent();
        } else if (page === 'player') {
            loadPlayerContent();
        } else if (page === 'place') {
            loadPlaceContent();
        }
    }).fail(function() {
        $('#page-content').html('<p>Error loading page content.</p>');
    });
}

async function loadDashboardContent() {
    try {
        // Load win rate summary
        const data = await fetchData('Data');
        let totalGames = data.length;
        let totalLosses = data.filter(d => d.lose === '1' || d.lose === 1).length;
        let totalWins = totalGames - totalLosses;
        let winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(2) : 0;

        $('#overall-win-rate').text(`${winRate}% (${totalWins} wins out of ${totalGames} games)`);

        // Load recent games
        const players = await fetchData('Player');
        const places = await fetchData('Place');
        const recentGames = data.slice(-10).reverse();

        const tbody = $('#recent-games-table tbody');
        tbody.empty();

        recentGames.forEach(game => {
            const player = players.find(p => p.id_player === game.name);
            const place = places.find(p => p.id_place === game.place);
            const result = game.lose === '1' || game.lose === 1 ? 'Lose' : 'Win';

            tbody.append(`
                <tr>
                    <td>${game.date}</td>
                    <td>${player ? player.name : 'Unknown'}</td>
                    <td>${place ? place.name : 'Unknown'}</td>
                    <td>${result}</td>
                </tr>
            `);
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        $('#overall-win-rate').text('Error loading data');
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

let currentUserPage = 1;
const usersPerPage = 10;

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

async function loadPlayers() {
    try {
        const players = await fetchData('Player');
        const data = await fetchData('Data');

        const tbody = document.querySelector('#players-table tbody');
        tbody.innerHTML = '';

        players.forEach(player => {
            const playerGames = data.filter(d => d.name === player.id_player);
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
    } catch (error) {
        console.error('Error loading players:', error);
    }
}

async function deletePlayer(id) {
    console.log(`Deleting player with ID: ${id}`);
    if (confirm('Are you sure you want to delete this player?')) {
        const result = await deleteData('Player', id);
        if (result) {
            console.log('Player deleted successfully');
            await loadPlayers();
        } else {
            console.error('Failed to delete player');
        }
    }
}

async function editPlayer(id) {
    console.log(`Editing player with ID: ${id}`);
    const editModal = document.getElementById('edit-player-modal');
    const players = await fetchData('Player');
    const player = players.find(p => p.id_player === id);
    if (player) {
        document.getElementById('edit-player-name').value = player.name;
        editModal.style.display = 'block';

        document.getElementById('edit-player-form').onsubmit = async (e) => {
            e.preventDefault();
            const newName = document.getElementById('edit-player-name').value;
            const result = await updateData('Player', id, { name: newName });
            if (result) {
                console.log('Player updated successfully');
                editModal.style.display = 'none';
                await loadPlayers();
            } else {
                console.error('Failed to update player');
            }
        };
    }
}

async function loadPlaceContent() {
    console.log('Loading place content');
    // Load places
    await loadPlaces();

    // Modal functionality using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('place-modal'));
    document.getElementById('add-place-btn').addEventListener('click', () => {
        modal.show();
    });

    // Add place form
    document.getElementById('place-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = document.getElementById('place-form');
        const loadingDiv = document.getElementById('place-loading');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Show loading
        loadingDiv.classList.remove('d-none');
        form.style.display = 'none';
        submitBtn.disabled = true;

        try {
            const namePlace = document.getElementById('place-name').value;
            const date = document.getElementById('place-date').value;
            const idPlace = await generateSequentialId('Place', 'PLC_');
            console.log(`Adding new place: ${namePlace}, ID: ${idPlace}, Date: ${date}`);

            const newPlace = { id_place: idPlace, name: namePlace, date: date };
            const result = await insertData('Place', newPlace);
            if (result) {
                console.log('Place added successfully');
                document.getElementById('place-name').value = '';
                document.getElementById('place-date').value = '';
                modal.hide();
                await loadPlaces();
            } else {
                console.error('Failed to add place');
                alert('Failed to add place. Please try again.');
            }
        } catch (error) {
            console.error('Error adding place:', error);
            alert('Error adding place. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            form.style.display = 'block';
            submitBtn.disabled = false;
        }
    });

    // Attach edit and delete functions globally
    window.editPlace = editPlace;
    window.deletePlace = deletePlace;
}

let currentPlacePage = 1;
const placesPerPage = 10;

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




