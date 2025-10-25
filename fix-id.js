// fix-id.js - Fix for ID generation and data loading issues
async function fixUserIdGeneration() {
    console.log('=== FIXING USER ID GENERATION ===');

    try {
        // Fetch current users
        const users = await fetchData('User');
        console.log('Current users:', users);

        // Check existing IDs
        const existingIds = users.map(user => user.id_user).filter(id => id);
        console.log('Existing user IDs:', existingIds);

        // Find the highest number
        const numbers = existingIds
            .filter(id => id.startsWith('USR_'))
            .map(id => parseInt(id.replace('USR_', '')))
            .filter(num => !isNaN(num));

        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        console.log('Max user number:', maxNumber);

        // Test ID generation
        const nextId = `USR_${(maxNumber + 1).toString().padStart(3, '0')}`;
        console.log('Next user ID should be:', nextId);

        return nextId;

    } catch (error) {
        console.error('Error in fixUserIdGeneration:', error);
        return 'USR_001';
    }
}

// Override the generateSequentialId function for User sheet
const originalGenerateSequentialId = generateSequentialId;

generateSequentialId = async function(sheet, prefix) {
    if (sheet === 'User') {
        console.log('Using fixed ID generation for User sheet');
        return await fixUserIdGeneration();
    }
    return await originalGenerateSequentialId(sheet, prefix);
};

// Test data loading
async function testDataLoading() {
    console.log('=== TESTING DATA LOADING ===');

    try {
        const users = await fetchData('User');
        console.log('Users loaded:', users.length, 'records');

        const players = await fetchData('Player');
        console.log('Players loaded:', players.length, 'records');

        const places = await fetchData('Place');
        console.log('Places loaded:', places.length, 'records');

        const games = await fetchData('Data');
        console.log('Games loaded:', games.length, 'records');

        // Test table population
        if (users.length > 0) {
            console.log('Users data structure:', users[0]);
        }

    } catch (error) {
        console.error('Error in testDataLoading:', error);
    }
}

// Auto-run tests
$(document).ready(function() {
    setTimeout(testDataLoading, 500);
});
