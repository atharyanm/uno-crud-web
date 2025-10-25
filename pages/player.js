// player.js - Player management

// Attach edit and delete functions globally
window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Player page loaded');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        console.log('No logged in user, redirecting to login');
        window.location.href = '../index.html';
        return;
    }
    console.log('User logged in:', loggedInUser);

    // Logout functionality
    document.getElementById('logout').addEventListener('click', () => {
        console.log('Logout clicked');
        localStorage.removeItem('loggedInUser');
        window.location.href = '../index.html';
    });

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
});

let currentPlayerPage = 1;
const playersPerPage = 10;

async function loadPlayers(page = 1) {
    try {
        const players = await fetchData('Player');
        const data = await fetchData('Data');

        // Calculate pagination
        const totalPlayers = players.length;
        const totalPages = Math.ceil(totalPlayers / playersPerPage);
        const startIndex = (page - 1) * playersPerPage;
        const endIndex = startIndex + playersPerPage;
        const playersToShow = players.slice(startIndex, endIndex);

        const tbody = document.querySelector('#players-table tbody');
        tbody.innerHTML = '';

        playersToShow.forEach(player => {
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

        // Generate pagination
        renderPlayerPagination(totalPages, page);
    } catch (error) {
        console.error('Error loading players:', error);
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
