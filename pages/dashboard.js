// dashboard.js - Dashboard functionality (same as homepage.js)
document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        window.location.href = '../index.html';
        return;
    }

    // Logout functionality
    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = '../index.html';
    });

    // Load win rate summary
    await loadWinRateSummary();

    // Load recent games
    await loadRecentGames();
});

async function loadWinRateSummary() {
    try {
        const data = await fetchData('Data');
        const players = await fetchData('Player');

        let totalGames = data.length;
        let totalLosses = data.filter(d => d.lose === '1' || d.lose === 1).length;
        let totalWins = totalGames - totalLosses;
        let winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(2) : 0;

        document.getElementById('overall-win-rate').textContent = `${winRate}% (${totalWins} wins out of ${totalGames} games)`;
    } catch (error) {
        console.error('Error loading win rate summary:', error);
        document.getElementById('overall-win-rate').textContent = 'Error loading data';
    }
}

async function loadRecentGames() {
    try {
        const data = await fetchData('Data');
        const players = await fetchData('Player');
        const places = await fetchData('Place');

        const recentGames = data.slice(-10).reverse(); // Last 10 games, most recent first

        const tbody = document.querySelector('#recent-games-table tbody');
        tbody.innerHTML = '';

        recentGames.forEach(game => {
            const player = players.find(p => p.id_player === game.name);
            const place = places.find(p => p.id_place === game.place);
            const result = game.lose === '1' || game.lose === 1 ? 'Lose' : 'Win';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${game.date}</td>
                <td>${player ? player.name : 'Unknown'}</td>
                <td>${place ? place.name_place : 'Unknown'}</td>
                <td>${result}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading recent games:', error);
    }
}
