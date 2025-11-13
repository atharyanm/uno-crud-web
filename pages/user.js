// pages/user.js - User management
var currentUserPage = 1; // DIUBAH
var usersPerPage = 10; // DIUBAH

window.loadUserContent = async () => {
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

// DIUBAH: Tambahkan "window."
window.loadUsers = async function(page = 1) {
    try {
        const users = await fetchData('User');

        // Calculate pagination
        const totalUsers = users.length;
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

// DIUBAH: Tambahkan "window."
window.renderUserPagination = function(totalPages, currentPage) {
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

// Assign to window to be accessible from onclick attributes
window.changeUserPage = (page) => {
    currentUserPage = page;
    loadUsers(page);
}

// Assign to window to be accessible from onclick attributes
window.deleteUser = async (id) => {
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

// Assign to window to be accessible from onclick attributes
window.editUser = async (id) => {
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