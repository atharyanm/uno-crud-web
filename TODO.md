# TODO: Add Game Menu, Update Add Winrate Modal, Implement Role-Based Access

## 1. Add Game Menu in Sidebar
- [ ] Update homepage.html to include game menu item in sidebar nav

## 2. Update Add Winrate Modal
- [ ] Add game combo box in add-winrate-modal in homepage.html
- [ ] Update loadPlayersAndPlaces in homepage.js to load games and populate game select
- [ ] Update form submission to include selected game
- [ ] Update pages/dashboard.js similarly for consistency

## 3. Implement Role-Based Access Control
- [ ] Add role check in homepage.js to show/hide menu items based on user role
- [ ] Admin: show all menus (dashboard, player, place, user, game)
- [ ] User: show only dashboard

## 4. Update Data Insertion
- [ ] Ensure new winrate data includes game selection
- [ ] Update schema handling for name_game in Data table

## 5. Testing
- [ ] Test game page loading
- [ ] Test add winrate with game selection
- [ ] Test role-based menu visibility
