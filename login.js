// login.js - Handle login functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page loaded');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

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
                localStorage.setItem('loggedInUser', JSON.stringify({ id_user: 'USR_001', username: 'admin', password: 'admin123', role: 'admin' }));
                window.location.href = 'homepage.html';
                return;
            }

            const users = await fetchData('User');
            console.log(`Fetched ${users.length} users`);
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                console.log('Login successful for user:', user);
                localStorage.setItem('loggedInUser', JSON.stringify(user));
                window.location.href = 'homepage.html';
            } else {
                console.log('Invalid credentials');
                loginMessage.textContent = 'Invalid username or password';
                loginMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Login failed:', error);
            loginMessage.textContent = 'Login failed. Please try again.';
            loginMessage.style.color = 'red';
        }
    });
});
