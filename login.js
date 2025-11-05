// login.js - Handle login functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page loaded');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    // Create modal elements
    const modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <div class="modal-icon">
                    <i class="fas"></i>
                </div>
                <h3 class="modal-title"></h3>
                <p class="modal-message"></p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Function to show modal
    window.showModal = function(title, message, type) {
        const modalContent = modal.querySelector('.modal-content');
        const modalIcon = modal.querySelector('.modal-icon i');
        const modalTitle = modal.querySelector('.modal-title');
        const modalMessage = modal.querySelector('.modal-message');

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        if (type === 'success') {
            modalIcon.className = 'fas fa-check-circle';
            modalContent.classList.add('success');
            modalContent.classList.remove('error');
        } else {
            modalIcon.className = 'fas fa-times-circle';
            modalContent.classList.add('error');
            modalContent.classList.remove('success');
        }

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    };

    // Close modal on click outside or close button
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log(`Attempting login for username: ${username}`);

        try {
            // For demo purposes, use hardcoded login first
            if (username === 'admin' && password === 'admin123') {
                console.log('Login successful with hardcoded credentials');
                showModal('Login Berhasil!', 'Selamat datang di dashboard.', 'success');
                setTimeout(() => {
                    localStorage.setItem('loggedInUser', JSON.stringify({ id_user: 'USR_001', username: 'admin', password: 'admin123', role: 'admin' }));
                    window.location.href = 'homepage.html';
                }, 2000);
                return;
            }

            const users = await fetchData('User');
            console.log(`Fetched ${users.length} users`);
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                console.log('Login successful for user:', user);
                showModal('Login Berhasil!', 'Selamat datang di dashboard.', 'success');
                setTimeout(() => {
                    localStorage.setItem('loggedInUser', JSON.stringify(user));
                    window.location.href = 'homepage.html';
                }, 2000);
            } else {
                console.log('Invalid credentials');
                showModal('Login Gagal!', 'Username atau password salah.', 'error');
            }
        } catch (error) {
            console.error('Login failed:', error);
            showModal('Login Gagal!', 'Terjadi kesalahan. Silakan coba lagi.', 'error');
        }
    });
});
