# TODO: Fix Add Winrate Modal Not Appearing

## Tasks
- [x] Move add-winrate-modal HTML from pages/dashboard.html to homepage.html
- [x] Remove add-winrate-modal HTML from pages/dashboard.html
- [x] Test the modal functionality

## Information Gathered
- Dashboard page is loaded dynamically via AJAX into #page-content in homepage.html
- Modal HTML is in pages/dashboard.html, but since it's loaded dynamically, it might not be properly initialized or stacked
- Bootstrap is loaded in homepage.html
- Modal setup is in loadDashboardContent() in homepage.js

## Plan
- Move the modal HTML to homepage.html to ensure it's always in the DOM
- Keep the modal setup in loadDashboardContent()

## Dependent Files
- homepage.html: Add modal HTML
- pages/dashboard.html: Remove modal HTML

## Followup Steps
- Tested by opening homepage.html and clicking "Add Winrate" button on dashboard
