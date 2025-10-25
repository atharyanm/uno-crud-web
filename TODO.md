# TODO: Fix Add Winrate Modal Not Appearing

## Tasks
- [x] Move add-winrate-modal HTML from pages/dashboard.html to homepage.html
- [x] Remove add-winrate-modal HTML from pages/dashboard.html
- [x] Test the modal functionality
- [x] Fix 409 Conflict error when deleting players and places by deleting related Data records first

## Information Gathered
- Dashboard page is loaded dynamically via AJAX into #page-content in homepage.html
- Modal HTML is in pages/dashboard.html, but since it's loaded dynamically, it might not be properly initialized or stacked
- Bootstrap is loaded in homepage.html
- Modal setup is in loadDashboardContent() in homepage.js
- 409 Conflict occurs due to foreign key constraints when deleting players/places with related Data records

## Plan
- Move the modal HTML to homepage.html to ensure it's always in the DOM
- Keep the modal setup in loadDashboardContent()
- Modify deletePlayer and deletePlace functions to delete related Data records first

## Dependent Files
- homepage.html: Add modal HTML
- pages/dashboard.html: Remove modal HTML
- homepage.js: Update deletePlayer and deletePlace functions

## Followup Steps
- Tested by opening homepage.html and clicking "Add Winrate" button on dashboard
- Test deleting players and places with related data
