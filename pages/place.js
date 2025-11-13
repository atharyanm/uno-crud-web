// place.js - Place management

// Global function to load place content
window.loadPlaceContent = async () => {
    console.log('Loading place content');
    // Load places
    await loadPlaces();

    // Modal functionality using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('place-modal'));
    document.getElementById('add-place-btn').addEventListener('click', () => {
        modal.show();
    });

    // Add place form
    document.getElementById('place-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = document.getElementById('place-form');
        const loadingDiv = document.getElementById('place-loading');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Show loading
        loadingDiv.classList.remove('d-none');
        form.style.display = 'none';
        submitBtn.disabled = true;

        try {
            const namePlace = document.getElementById('place-name').value;
            const date = document.getElementById('place-date').value;
            const idPlace = await generateSequentialId('Place', 'PLC_');
            console.log(`Adding new place: ${namePlace}, ID: ${idPlace}, Date: ${date}`);

            const newPlace = { id_place: idPlace, name: namePlace, date: date };
            const result = await insertData('Place', newPlace);
            if (result) {
                console.log('Place added successfully');
                document.getElementById('place-name').value = '';
                document.getElementById('place-date').value = '';
                modal.hide();
                await loadPlaces();
            } else {
                console.error('Failed to add place');
                alert('Failed to add place. Please try again.');
            }
        } catch (error) {
            console.error('Error adding place:', error);
            alert('Error adding place. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            form.style.display = 'block';
            submitBtn.disabled = false;
        }
    });

    // Attach edit and delete functions globally
    window.editPlace = editPlace;
    window.deletePlace = deletePlace;
};

var currentPlacePage = 1;
var placesPerPage = 10; // DIUBAH

// DIUBAH: Tambahkan "window."
window.loadPlaces = async function(page = 1) {
    try {
        const places = await fetchData('Place');

        // Calculate pagination
        const totalPlaces = places.length;
        const totalPages = Math.ceil(totalPlaces / placesPerPage);
        const startIndex = (page - 1) * placesPerPage;
        const endIndex = startIndex + placesPerPage;
        const placesToShow = places.slice(startIndex, endIndex);

        const tbody = document.querySelector('#places-table tbody');
        tbody.innerHTML = '';

        placesToShow.forEach(place => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${place.id_place}</td>
                <td>${place.name}</td>
                <td>${place.date}</td>
                <td>
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn btn-primary btn-sm rounded-pill edit-btn" onclick="editPlace('${place.id_place}')"><i class="fas fa-edit"></i> UBAH</button>
                        <button class="btn btn-danger btn-sm rounded-pill delete-btn" onclick="deletePlace('${place.id_place}')"><i class="fas fa-trash"></i> HAPUS</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Generate pagination
        renderPlacePagination(totalPages, page);
    } catch (error) {
        console.error('Error loading places:', error);
    }
}

// DIUBAH: Tambahkan "window."
window.renderPlacePagination = function(totalPages, currentPage) {
    const paginationContainer = document.getElementById('place-pagination');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePlacePage(${currentPage - 1})">Previous</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" onclick="changePlacePage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePlacePage(${currentPage + 1})">Next</a>`;
    paginationContainer.appendChild(nextLi);
}

window.changePlacePage = (page) => {
    currentPlacePage = page;
    loadPlaces(page);
}

window.deletePlace = async (id) => {
    console.log(`Deleting place with ID: ${id}`);
    // Open delete confirmation modal using Bootstrap
    const deleteModal = new bootstrap.Modal(document.getElementById('delete-place-modal'));
    deleteModal.show();

    // Handle confirm delete
    document.getElementById('confirm-delete-place-btn').onclick = async () => {
        const loadingDiv = document.getElementById('delete-place-loading');
        const confirmContent = document.getElementById('delete-place-confirm-content');

        // Show loading
        loadingDiv.classList.remove('d-none');
        confirmContent.style.display = 'none';

        try {
            const result = await deleteData('Place', id);
            if (result) {
                console.log('Place deleted successfully');
                deleteModal.hide();
                await loadPlaces();
            } else {
                console.error('Failed to delete place');
                alert('Failed to delete place. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting place:', error);
            alert('Error deleting place. Please try again.');
        } finally {
            // Hide loading
            loadingDiv.classList.add('d-none');
            confirmContent.style.display = 'block';
        }
    };
}

window.editPlace = async (id) => {
    console.log(`Editing place with ID: ${id}`);
    // Open edit modal and populate fields using Bootstrap
    const editModal = new bootstrap.Modal(document.getElementById('edit-place-modal'));
    const places = await fetchData('Place');
    const place = places.find(p => p.id_place === id);
    if (place) {
        document.getElementById('edit-place-name').value = place.name;
        document.getElementById('edit-place-date').value = place.date;
        editModal.show();

        // Handle edit form submission
        document.getElementById('edit-place-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = document.getElementById('edit-place-form');
            const loadingDiv = document.getElementById('edit-place-loading');
            const submitBtn = form.querySelector('button[type="submit"]');

            // Show loading
            loadingDiv.classList.remove('d-none');
            form.style.display = 'none';
            submitBtn.disabled = true;

            try {
                const newName = document.getElementById('edit-place-name').value;
                const newDate = document.getElementById('edit-place-date').value;
                const result = await updateData('Place', id, { name: newName, date: newDate });
                if (result) {
                    console.log('Place updated successfully');
                    editModal.hide();
                    await loadPlaces();
                } else {
                    console.error('Failed to update place');
                    alert('Failed to update place. Please try again.');
                }
            } catch (error) {
                console.error('Error updating place:', error);
                alert('Error updating place. Please try again.');
            } finally {
                // Hide loading
                loadingDiv.classList.add('d-none');
                form.style.display = 'block';
                submitBtn.disabled = false;
            }
        };
    }
}