// game.js - Game management

// Global function to load game content
window.loadGameContent = async () => {
    console.log('Loading game content');
    // Load games
    await loadGames();

    // Modal functionality using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('game-modal'));
    document.getElementById('add-game-btn').addEventListener('click', () => {
        modal.show();
    });

    // Add game form
    document.getElementById('game-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = document.getElementById('game-form');
        const loadingDiv = document.getElementById('game-loading');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Show loading
        loadingDiv.classList.remove('d-none');
        form.style.display = 'none';
        submitBtn.disabled = true;

        try {
            const nameGame = document.getElementById('game-name').value;
            const date = document.getElementById('game-date').value;
            const idGame = await generateSequentialId('Game', 'GAM_');
            console.log(`Adding new game: ${nameGame}, ID: ${idGame}, Date: ${date}`);

            const newGame = { id_game: idGame, name_game: nameGame, added: date };
            const result = await insertData('Game', newGame);
            if (result) {
                console.log('Game added successfully');
                document.getElementById('game-name').value = '';
                document.getElementById('game-date').value = '';
                modal.hide();
                await loadGames();
            } else {
                console.error('Failed to add game');
                alert('Failed to add game. Please try again.');
            }
        } catch (error) {
            console.error('Error adding game:', error);
            alert('Error adding game. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            form.style.display = 'block';
            submitBtn.disabled = false;
        }
    });

    // Attach edit and delete functions globally
    window.editGame = editGame;
    window.deleteGame = deleteGame;
};

var currentGamePage = 1;
var gamesPerPage = 10; // DIUBAH

// DIUBAH: Tambahkan "window."
window.loadGames = async function(page = 1) {
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

// DIUBAH: Tambahkan "window."
window.renderGamePagination = function(totalPages, currentPage) {
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

window.changeGamePage = (page) => {
    currentGamePage = page;
    loadGames(page);
}

window.deleteGame = async (id) => {
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

window.editGame = async (id) => {
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