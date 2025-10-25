// debug.js - Debug utilities for troubleshooting data loading
async function debugData() {
    console.log('=== DEBUGGING DATA LOADING ===');

    try {
        console.log('Testing API connection...');
        const players = await fetchData('Player');
        const places = await fetchData('Place');
        const users = await fetchData('User');
        const games = await fetchData('Data');

        console.log('Players:', players);
        console.log('Places:', places);
        console.log('Users:', users);
        console.log('Games:', games);

        // Test table population
        console.log('Testing table population...');
        const tbody = $('#players-table tbody');
        if (tbody.length > 0) {
            tbody.empty();
            if (players.length === 0) {
                tbody.append('<tr><td colspan="5" class="text-center text-warning">No players found in database</td></tr>');
            } else {
                players.forEach(player => {
                    const playerGames = games.filter(d => d.name === player.id_player);
                    const totalGames = playerGames.length;
                    const losses = playerGames.filter(d => d.lose === '1' || d.lose === 1).length;
                    const wins = totalGames - losses;
                    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) : 0;

                    tbody.append(`
                        <tr>
                            <td>${player.id_player}</td>
                            <td>${player.name}</td>
                            <td>${player.date_join}</td>
                            <td>${winRate}% (${wins}/${totalGames})</td>
                            <td>
                                <button class="btn btn-sm btn-warning edit-btn" onclick="editPlayer('${player.id_player}')"><i class="fas fa-edit"></i> UBAH</button>
                                <button class="btn btn-sm btn-danger delete-btn" onclick="deletePlayer('${player.id_player}')"><i class="fas fa-trash"></i> HAPUS</button>
                            </td>
                        </tr>
                    `);
                });
                console.log('Players table populated successfully');
            }
        } else {
            console.error('Players table not found in DOM');
        }

    } catch (error) {
        console.error('Debug error:', error);
    }
}

// Auto-run debug when page loads
$(document).ready(function() {
    setTimeout(debugData, 1000); // Run after 1 second to ensure page is loaded
});
