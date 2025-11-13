# TODO: Refactor homepage.js to slim it down

## Overview
Refactor homepage.js to only handle general navigation and page loading. Move all page-specific logic (load functions, modal setups, etc.) to their respective pages/*.js files. Use dynamic JS loading in loadPage to load the page-specific JS after HTML.

## Steps to Complete:
- [ ] Move dashboard-specific functions from homepage.js to pages/dashboard.js:
  - loadDashboardContent
  - loadBestPlayer
  - loadWorstPlayer
  - loadRecentGames
  - renderRecentGamesPagination
  - changeRecentGamesPage
  - loadPlayersAndPlaces
  - winrateFormInitialized and related modal setup
- [ ] Move user-specific functions from homepage.js to pages/user.js:
  - loadUserContent
  - loadUsers
  - renderUserPagination
  - changeUserPage
  - deleteUser
  - editUser
- [ ] Move player-specific functions from homepage.js to pages/player.js:
  - loadPlayerContent
  - loadPlayers
  - renderPlayerPagination
  - changePlayerPage
  - deletePlayer
  - editPlayer
- [ ] Move place-specific functions from homepage.js to pages/place.js:
  - loadPlaceContent
  - loadPlaces
  - renderPlacePagination
  - changePlacePage
  - deletePlace
  - editPlace
- [ ] Move game-specific functions from homepage.js to pages/game.js:
  - loadGameContent
  - loadGames
  - renderGamePagination
  - changeGamePage
  - deleteGame
  - editGame
- [ ] Update homepage.js:
  - Remove all page-specific functions.
  - Modify loadPage to dynamically load the corresponding pages/${page}.js after loading HTML.
  - Keep only general navigation, sidebar toggle, logout, etc.
- [ ] Update pages/*.js to define load functions globally (e.g., window.loadDashboardContent = async () => { ... }; ) instead of using DOMContentLoaded.
- [ ] Test the refactored code: Ensure navigation works, pages load correctly, and functionality is preserved.

## Notes:
- Use $.getScript in loadPage to load the JS file after HTML.
- Ensure global functions are called after JS load.
- Merge existing logic in pages/*.js with the moved code from homepage.js.
- Preserve all functionality, including pagination, modals, etc.
