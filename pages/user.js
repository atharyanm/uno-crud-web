// user.js - User management
document.addEventListener('DOMContentLoaded', async () => {
    console.log('User page loaded');
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

    // Load users
    await loadUsers();

    // Modal functionality for add user using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('user-modal'));
    document.getElementById('add-user-btn').addEventListener('click', () => {
        modal.show();
    });

    // Modal functionality for edit user
    const editModal = document.getElementById('edit-user-modal');
    const editSpan = document.getElementById('edit-close');

    editSpan.addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    });

    // Modal functionality for delete confirmation
    const deleteModal = document.getElementById('delete-user-modal');
    const deleteSpan = document.getElementById('delete-close');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    deleteSpan.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });

    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == deleteModal) {
            deleteModal.style.display = 'none';
        }
    });

    // Add user form
    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
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
            modal.style.display = 'none'; // Close modal after success
            await loadUsers();
        } else {
            console.error('Failed to add user');
        }
    });
});

let currentUserPage = 1;
const usersPerPage = 10;

async function loadUsers(page = 1) {
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
    // Open delete confirmation modal
    const deleteModal = document.getElementById('delete-user-modal');
    deleteModal.style.display = 'block';

    // Handle confirm delete
    document.getElementById('confirm-delete-btn').onclick = async () => {
        const result = await deleteData('User', id);
        if (result) {
            console.log('User deleted successfully');
            deleteModal.style.display = 'none';
            await loadUsers();
        } else {
            console.error('Failed to delete user');
        }
    };
}

async function editUser(id) {
    console.log(`Editing user with ID: ${id}`);
    // Open edit modal and populate fields
    const editModal = document.getElementById('edit-user-modal');
    const users = await fetchData('User');
    const user = users.find(u => u.id_user === id);
    if (user) {
        document.getElementById('edit-user-username').value = user.username;
        document.getElementById('edit-user-password').value = user.password;
        document.getElementById('edit-user-role').value = user.role;
        editModal.style.display = 'block';

        // Handle edit form submission
        document.getElementById('edit-user-form').onsubmit = async (e) => {
            e.preventDefault();
            const newUsername = document.getElementById('edit-user-username').value;
            const newPassword = document.getElementById('edit-user-password').value;
            const newRole = document.getElementById('edit-user-role').value;
            const result = await updateData('User', id, { username: newUsername, password: newPassword, role: newRole });
            if (result) {
                console.log('User updated successfully');
                editModal.style.display = 'none';
                await loadUsers();
            } else {
                console.error('Failed to update user');
            }
        };
    }
}
