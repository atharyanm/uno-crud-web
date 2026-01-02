# TODO: Fix Generate Report Button and Add Caching

## Tasks
- [x] Add jsPDF library to pages/dashboard.html for PDF generation
- [x] Add event listener for "Generate Report" button to open modal in pages/dashboard.js
- [x] Add function to populate player, year, and game dropdowns in the modal
- [x] Add event listener for "Generate PDF" button to create certificate PDF
- [x] Implement caching for calculation data (leaderboard stats, player data) to improve performance
- [x] Clear cache on page refresh to ensure fresh data
- [x] Add error handling for jsPDF library in generatePlayerCertificate function
- [x] Move certificate generation code to separate file (pages/certificate.js)
- [ ] Test PDF generation with sample data
- [ ] Verify certificate format and content
- [ ] Test caching functionality and performance improvement
