// Community Link Hub - Main JavaScript
class CommunityHub {
    constructor() {
        this.services = [];
        this.adminServices = [];
        this.currentService = null;
        this.adminToken = localStorage.getItem('adminToken');
        this.baseURL = window.location.origin;
        this.apiBase = `${this.baseURL}/api`;

        this.initializeApp();
    }

    async initializeApp() {
        this.setupEventListeners();
        await this.loadServices();
        this.updateAdminUI();

        // Show success message if redirected from successful action
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'service-added') {
            this.showNotification('Service added successfully!', 'success');
        }
    }

    setupEventListeners() {
        // Modal close handlers
        document.getElementById('serviceModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('serviceModal')) {
                this.closeServiceModal();
            }
        });

        document.getElementById('addServiceModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('addServiceModal')) {
                this.closeAddServiceModal();
            }
        });

        document.getElementById('adminModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('adminModal')) {
                this.closeAdminModal();
            }
        });

        document.getElementById('editServiceModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('editServiceModal')) {
                this.closeEditServiceModal();
            }
        });

        // Radio button event listeners for image options
        const addImageRadios = document.querySelectorAll('input[name="imageType"]');
        addImageRadios.forEach(radio => {
            radio.addEventListener('change', () => this.toggleImageInputs());
        });

        // Radio button event listeners for edit image options
        const editImageRadios = document.querySelectorAll('input[name="editImageType"]');
        editImageRadios.forEach(radio => {
            radio.addEventListener('change', () => this.toggleEditImageInputs());
        });

        // Form submissions - ensure robust event handling
        const addForm = document.getElementById('addServiceForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add service form submitted');
                this.submitServiceForm();
            });
        }

        const adminForm = document.getElementById('adminLoginForm');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.submitAdminLogin();
            });
        }

        const editForm = document.getElementById('editServiceForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Edit service form submit event fired');
                this.submitEditServiceForm();
            });
            // Simplified button click handler - let form validation handle it
            const submitButton = editForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.addEventListener('click', (e) => {
                    console.log('Update Service button clicked - checking form validity');
                    // Simple validation check
                    const requiredFields = ['editName', 'editEmail', 'editServiceName', 'editDescription', 'editLocation', 'editOrganizer', 'editTiming'];
                    const missingFields = requiredFields.filter(fieldId => {
                        const field = document.getElementById(fieldId);
                        const value = field?.value?.trim();
                        return !value || value === '';
                    });

                    if (missingFields.length > 0) {
                        console.log('❌ Missing fields:', missingFields);
                        e.preventDefault();
                        e.stopPropagation();
                        alert(`Please fill in required fields: ${missingFields.join(', ')}`);
                        // Focus on the first missing field
                        const firstMissingField = document.getElementById(missingFields[0]);
                        if (firstMissingField) {
                            firstMissingField.focus();
                        }
                        return false;
                    }

                    console.log('✅ Form validation passed - proceeding with submission');
                    // Let form submit event handle it
                });
            }
        }

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Smooth scroll for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Initialize autocomplete functionality
        this.setupAutocomplete();
    }

    async loadServices() {
        try {
            this.showLoading();
            const response = await fetch(`${this.apiBase}/services`);

            if (!response.ok) {
                throw new Error('Failed to load services');
            }

            this.services = await response.json();
            this.renderServices();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading services:', error);
            this.showError('Failed to load services. Please try again later.');
            this.hideLoading();
        }
    }

    renderServices() {
        const servicesGrid = document.getElementById('services-grid');
        if (this.services.length === 0) {
            servicesGrid.innerHTML = `
                <div class="no-services">
                    <i class="fas fa-inbox" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No services available</h3>
                    <p>Be the first to add a community service!</p>
                </div>
            `;
            return;
        }

        servicesGrid.innerHTML = this.services.map(service => this.createServiceCard(service)).join('');
    }

    createServiceCard(service) {
        const defaultImages = {
            'food': '🥗',
            'health': '🏥',
            'education': '📚',
            'environment': '🌿',
            'senior': '👴',
            'literacy': '✍️'
        };

        return `
            <div class="service-card" onclick="communityHub.showServiceDetails('${service._id}')">
                <div class="service-card-image">
                    ${service.image && service.image !== 'undefined'
                        ? `<img src="${service.image.startsWith('http') ? service.image : this.baseURL + service.image}?t=${Date.now()}" alt="${service.serviceName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                        : ''
                    }
                    <div style="display: ${service.image && service.image !== 'undefined' ? 'none' : 'flex'}; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem;">
                        ${defaultImages[service.category] || '🏢'}
                    </div>
                </div>
                <div class="service-card-content">
                    <div class="service-card-title">
                        ${service.serviceName}
                    </div>
                    <div class="service-card-description">
                        ${this.truncateText(service.description, 100)}
                    </div>
                    <div class="service-card-meta">
                        <span class="service-card-category">${this.getCategoryName(service.category)}</span>
                        <span>${this.formatDate(service.createdAt)}</span>
                    </div>
                    <button class="service-card-button">
                        <i class="fas fa-info-circle"></i>
                        Learn More
                    </button>
                </div>
            </div>
        `;
    }

    async showServiceDetails(serviceId) {
        try {
            const response = await fetch(`${this.apiBase}/services/${serviceId}`);

            if (!response.ok) {
                throw new Error('Failed to load service details');
            }

            const data = await response.json();
            this.currentService = data;
            this.renderServiceModal(data);
            document.getElementById('serviceModal').style.display = 'block';
        } catch (error) {
            console.error('Error loading service details:', error);
            this.showError('Failed to load service details.');
        }
    }

    renderServiceModal(data) {
        const { service, reviews, averageRating } = data;
        const modalContent = document.getElementById('modalContent');

        modalContent.innerHTML = `
            <div class="service-details">
                <div class="service-details-image">
                    ${service.image && service.image !== 'undefined'
                        ? `<img src="${service.image.startsWith('http') ? service.image : this.baseURL + service.image}?t=${Date.now()}" alt="${service.serviceName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                        : ''
                    }
                    <div style="display: ${service.image && service.image !== 'undefined' ? 'none' : 'flex'}; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 6rem;">
                        ${this.getCategoryIcon(service.category)}
                    </div>
                </div>
                <div class="service-details-info">
                    <h2>${service.serviceName}</h2>
                    <div class="service-info-item">
                        <div class="service-info-label">📍 Location</div>
                        <div class="service-info-value">${service.location}</div>
                    </div>
                    <div class="service-info-item">
                        <div class="service-info-label">👥 Organizer</div>
                        <div class="service-info-value">${service.organizer}</div>
                    </div>
                    <div class="service-info-item">
                        <div class="service-info-label">🕒 Timing</div>
                        <div class="service-info-value">${service.timing}</div>
                    </div>
                    <div class="service-info-item">
                        <div class="service-info-label">⭐ Rating</div>
                        <div class="service-info-value">
                            ${averageRating > 0 ? `${'★'.repeat(Math.floor(averageRating))}${'☆'.repeat(5 - Math.floor(averageRating))} (${averageRating}/5)` : 'No ratings yet'}
                        </div>
                    </div>
                </div>
            </div>

            <div class="service-info-item" style="margin-bottom: 2rem;">
                <div class="service-info-label">📝 Description</div>
                <div class="service-info-value">${service.description}</div>
            </div>

            <div class="reviews-section">
                <h3>Reviews & Ratings</h3>
                ${this.renderReviewForm(service._id)}
                <div class="reviews-list">
                    ${reviews.length > 0
                        ? reviews.map(review => this.createReviewItem(review)).join('')
                        : '<p style="text-align: center; color: #777; font-style: italic;">No reviews yet. Be the first to leave a review!</p>'
                    }
                </div>
            </div>
        `;
    }

    renderReviewForm(serviceId) {
        return `
            <div class="review-form">
                <h4>Leave a Review</h4>
                <form onsubmit="communityHub.submitReview(event, '${serviceId}')">
                    <div class="review-form-grid">
                        <input type="text" id="reviewerName" placeholder="Your Name" required>
                        <select id="reviewRating" required>
                            <option value="">Rating</option>
                            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                            <option value="3">⭐⭐⭐ 3 Stars</option>
                            <option value="2">⭐⭐ 2 Stars</option>
                            <option value="1">⭐ 1 Star</option>
                        </select>
                        <button type="submit" class="btn btn-primary">Submit Review</button>
                    </div>
                    <textarea id="reviewComment" placeholder="Share your experience..." required></textarea>
                </form>
            </div>
        `;
    }

    createReviewItem(review) {
        return `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-name">${review.reviewerName}</span>
                    <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                </div>
                <div class="review-comment">${review.comment}</div>
                <small style="color: #777;">${this.formatDate(review.createdAt)}</small>
            </div>
        `;
    }

    async submitReview(event, serviceId) {
        event.preventDefault();

        const reviewerName = document.getElementById('reviewerName').value;
        const rating = document.getElementById('reviewRating').value;
        const comment = document.getElementById('reviewComment').value;

        try {
            const response = await fetch(`${this.apiBase}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    serviceId,
                    reviewerName,
                    rating: parseInt(rating),
                    comment
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit review');
            }

            // Refresh service details to show new review
            await this.showServiceDetails(serviceId);
            this.showNotification('Review submitted successfully!', 'success');

            // Clear form
            document.getElementById('reviewerName').value = '';
            document.getElementById('reviewRating').value = '';
            document.getElementById('reviewComment').value = '';

        } catch (error) {
            console.error('Error submitting review:', error);
            this.showError('Failed to submit review. Please try again.');
        }
    }

    showAddServiceModal() {
        console.log('showAddServiceModal called');
        const modal = document.getElementById('addServiceModal');
        if (modal) {
            modal.style.display = 'block';
            modal.style.zIndex = '9999';
            console.log('Modal displayed successfully');
            console.log('Modal styles:', window.getComputedStyle(modal));
        } else {
            console.error('Modal element not found');
            console.log('Available elements with "modal" in ID:');
            document.querySelectorAll('[id*="modal"]').forEach(el => console.log(el.id));
        }
    }

    closeAddServiceModal() {
        document.getElementById('addServiceModal').style.display = 'none';
        document.getElementById('addServiceForm').reset();

        // Reset image options
        const uploadRadio = document.getElementById('imageUpload');
        const urlRadio = document.getElementById('imageUrl');
        if (uploadRadio) uploadRadio.checked = true;
        if (urlRadio) urlRadio.checked = false;
        this.toggleImageInputs();
    }

    async submitServiceForm() {
        console.log('Submitting add service form');

        const formData = new FormData();

        // Manually append all form fields to ensure completeness
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const serviceName = document.getElementById('serviceName').value;
        const description = document.getElementById('description').value;
        const location = document.getElementById('location').value;
        const organizer = document.getElementById('organizer').value;
        const timing = document.getElementById('timing').value;
        const category = document.getElementById('category').value;

        // Check which image option is selected
        const selectedImageType = document.querySelector('input[name="imageType"]:checked').value;
        let imageData = null;

        if (selectedImageType === 'upload') {
            const imageFile = document.getElementById('image').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
                imageData = `File: ${imageFile.name}`;
                console.log('Appending image file:', imageFile.name);
            }
        } else if (selectedImageType === 'url') {
            const imageUrl = document.getElementById('imageUrl').value.trim();
            if (imageUrl) {
                console.log('Image URL field exists:', !!document.getElementById('imageUrl'));
                console.log('Image URL value:', imageUrl);
                console.log('Image URL is valid:', imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));

                formData.append('imageUrl', imageUrl); // Send URL as separate field
                imageData = `URL: ${imageUrl}`;

                console.log('URL sent to server as imageUrl:', imageUrl);
            } else {
                console.log('No image URL provided');
            }
        }

        // Append text fields
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('serviceName', serviceName);
        formData.append('description', description);
        formData.append('location', location);
        formData.append('organizer', organizer);
        formData.append('timing', timing);
        formData.append('category', category);

        console.log('Add service FormData prepared:', {
            name, email, phone, serviceName, description,
            location, organizer, timing, category,
            selectedImageType, hasImageData: !!imageData, imageData
        });

        try {
            console.log('Sending POST request to:', `${this.apiBase}/services`);
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, typeof value === 'string' ? value : `${value.name || 'File'} (${value.size} bytes)`);
            }

            const response = await fetch(`${this.apiBase}/services`, {
                method: 'POST',
                body: formData // Send as FormData to handle file uploads
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server error response:', errorData);
                console.error('Response status:', response.status, response.statusText);

                // Try to parse as JSON if possible
                try {
                    const jsonError = JSON.parse(errorData);
                    console.error('Parsed error:', jsonError);
                } catch (e) {
                    console.error('Could not parse error as JSON');
                }

                throw new Error(`Failed to add service: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('Raw server response:', responseText);

            let addedService;
            try {
                addedService = JSON.parse(responseText);
                console.log('Service added successfully:', addedService);
            } catch (e) {
                console.error('Failed to parse server response as JSON:', e);
                throw new Error('Invalid server response format');
            }

            this.closeAddServiceModal();
            this.showNotification('Service added successfully!', 'success');
            await this.loadServices(); // Refresh the services list

            // Update adminServices if in admin panel
            if (this.adminServices && Array.isArray(this.adminServices)) {
                this.adminServices.push(addedService);
                if (document.getElementById('adminPanel').style.display !== 'none') {
                    // Update the admin panel with latest data
                    console.log('Re-rendering admin panel with updated services:', this.adminServices.length, 'services');
                    this.renderAdminPanel(this.adminServices);
                }
            }

        } catch (error) {
            console.error('Error adding service:', error);
            this.showError('Failed to add service. Please try again.');
        }
    }

    showAdminLogin() {
        if (this.adminToken) {
            this.showAdminPanel();
        } else {
            document.getElementById('adminModal').style.display = 'block';
        }
    }

    closeAdminModal() {
        document.getElementById('adminModal').style.display = 'none';
        document.getElementById('adminLoginForm').reset();
    }

    async submitAdminLogin() {
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        try {
            const response = await fetch(`${this.apiBase}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            this.adminToken = data.token;
            localStorage.setItem('adminToken', this.adminToken);
            this.closeAdminModal();
            this.showAdminPanel();

        } catch (error) {
            console.error('Error during admin login:', error);
            this.showError(error.message || 'Login failed. Please check your credentials.');
        }
    }

    async showAdminPanel() {
        try {
            const response = await fetch(`${this.apiBase}/admin/services`, {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load admin data');
            }

            const services = await response.json();
            console.log('Admin services loaded:', services.length, 'services');
            this.adminServices = services; // Store admin services
            this.renderAdminPanel(services);
            document.getElementById('adminPanel').style.display = 'block';

        } catch (error) {
            console.error('Error loading admin panel:', error);
            this.showError('Failed to load admin panel. Please login again.');
            this.logoutAdmin();
        }
    }

    renderAdminPanel(services) {
        console.log('=== RENDERING ADMIN PANEL ===');
        console.log('Number of services received:', services?.length || 0);
        console.log('Services data:', services?.map(s => ({ id: s._id, name: s.serviceName, updated: s.updatedAt })));

        // Update stats
        const totalServicesEl = document.getElementById('totalServices');
        if (totalServicesEl) {
            totalServicesEl.textContent = services.length;
            console.log('Updated totalServices to:', services.length);
        } else {
            console.error('totalServices element not found');
        }

        // Calculate total reviews (this would need to be fetched from backend in real implementation)
        const totalReviewsEl = document.getElementById('totalReviews');
        if (totalReviewsEl) {
            totalReviewsEl.textContent = 'Loading...';
        }

        // Render services table
        console.log('Generating table HTML for', services.length, 'services');

        const tableHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Service Name</th>
                            <th>Category</th>
                            <th>Location</th>
                            <th>Organizer</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${services.map((service, index) => {
                            console.log(`Row ${index + 1}: ${service.serviceName} (${service._id})`);
                            return `
                               <tr data-service-id="${service._id}">
                                    <td>
                                        ${service.image && service.image !== 'undefined'
                                            ? `<img src="${service.image.startsWith('http') ? service.image : this.baseURL + service.image}?t=${Date.now()}" alt="${service.serviceName}" class="service-image" onerror="this.style.display='none';">`
                                            : `<div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00b4d8, #0077b6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white;">${this.getCategoryIcon(service.category)}</div>`
                                        }
                                    </td>
                                    <td>${service.serviceName}</td>
                                    <td>${this.getCategoryName(service.category)}</td>
                                    <td>${service.location}</td>
                                    <td>${service.organizer}</td>
                                    <td>${this.formatDate(service.createdAt)}</td>
                                    <td class="action-buttons">
                                        <button class="btn-edit" onclick="communityHub.editService('${service._id}')">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn-delete" onclick="communityHub.deleteService('${service._id}')">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        console.log('Generated HTML, first 200 chars:', tableHTML.substring(0, 200));

        const adminTableEl = document.getElementById('adminServicesTable');
        if (adminTableEl) {
            adminTableEl.innerHTML = tableHTML;
            console.log('Successfully updated adminServicesTable with HTML');
            console.log('Current DOM content:', adminTableEl.innerHTML.substring(0, 200));
        } else {
            console.error('adminServicesTable element not found!');
        }

        console.log('=== ADMIN PANEL RENDER COMPLETE ===\n');
    }

    async editService(serviceId) {
        console.log('=== EDIT BUTTON CLICKED ===');
        console.log('🔸 editService function called');
        console.log('📍 Service ID received:', serviceId);
        console.log('🔑 Current admin token exists:', !!localStorage.getItem('adminToken'));

        // Try admin services first (if in admin panel), then fall back to public services
        console.log('Admin services length:', this.adminServices?.length || 0);
        console.log('Public services length:', this.services?.length || 0);

        let service = this.adminServices.find(s => s._id === serviceId);
        console.log('Found service in adminServices:', service ? service.serviceName : 'none');

        if (!service) {
            service = this.services.find(s => s._id === serviceId);
            console.log('Found service in public services:', service ? service.serviceName : 'none');
        }

        if (!service) {
            console.error('Service not found for editing:', serviceId);
            console.log('Available admin service IDs:', this.adminServices?.map(s => s._id));
            console.log('Available public service IDs:', this.services?.map(s => s._id));
            this.showError('Service not found.');
            return;
        }

        console.log('Editing service:', service.serviceName, serviceId);

        // Store the editing service ID
        this.editingServiceId = serviceId;

        // Clear any previous form data
        document.getElementById('editServiceForm').reset();

        // Populate the edit form with current service data
        document.getElementById('editName').value = service.name || '';
        document.getElementById('editEmail').value = service.email || '';
        document.getElementById('editPhone').value = service.phone || '';
        document.getElementById('editServiceName').value = service.serviceName || '';
        document.getElementById('editDescription').value = service.description || '';
        document.getElementById('editLocation').value = service.location || '';
        document.getElementById('editOrganizer').value = service.organizer || '';
        document.getElementById('editTiming').value = service.timing || '';
        document.getElementById('editCategory').value = service.category || '';

        // Handle image field population
        const imageUrl = service.image;
        if (imageUrl && imageUrl.startsWith('http')) {
            // Service has an image URL - pre-select URL option
            const urlRadio = document.getElementById('editImageUrl');
            if (urlRadio) {
                urlRadio.checked = true;
                this.toggleEditImageInputs(); // Show URL input, hide file input

                // Set the URL value
                const urlInput = document.getElementById('editImageUrl');
                if (urlInput) {
                    urlInput.value = imageUrl;
                }

                console.log('Pre-populated with existing image URL:', imageUrl);
            }
        } else if (imageUrl && imageUrl.startsWith('/images/')) {
            // Service has a local uploaded image - keep file upload option selected
            // but we don't populate the file input as it can't be pre-filled
            console.log('Service has existing local image:', imageUrl);

            // Default to upload option (file input)
            const uploadRadio = document.getElementById('editImageUpload');
            if (uploadRadio) {
                uploadRadio.checked = true;
            }
            this.toggleEditImageInputs();
        } else {
            // No image - default to upload option
            console.log('Service has no image, defaulting to upload option');

            const uploadRadio = document.getElementById('editImageUpload');
            if (uploadRadio) {
                uploadRadio.checked = true;
            }
            this.toggleEditImageInputs();
        }

        console.log('Form populated with service data');

        // Show the edit modal
        const modal = document.getElementById('editServiceModal');
        if (modal) {
            modal.style.display = 'block';
            modal.style.zIndex = '10000'; // Ensure it's on top
            console.log('Edit modal displayed for service:', service.serviceName);
        } else {
            console.error('Edit modal not found');
            this.showError('Unable to open edit form. Please try again.');
        }
    }

    closeEditServiceModal() {
        console.log('Closing edit service modal...');

        // Get modal element
        const modal = document.getElementById('editServiceModal');
        if (modal) {
            modal.style.display = 'none';
            console.log('Edit modal hidden successfully');
        } else {
            console.error('Edit modal element not found');
        }

        // Reset form
        const form = document.getElementById('editServiceForm');
        if (form) {
            form.reset();
            console.log('Edit form reset successfully');
        } else {
            console.error('Edit form element not found');
        }

        // Clear editing state
        this.editingServiceId = null;
        console.log('Editing service ID cleared');

        // Reset image options to default state
        const uploadRadio = document.getElementById('editImageUpload');
        const urlRadio = document.getElementById('editImageUrl');

        if (uploadRadio) {
            uploadRadio.checked = true;
            console.log('Upload radio selected by default');
        } else {
            console.error('Upload radio element not found');
        }

        if (urlRadio) {
            urlRadio.checked = false;
            console.log('URL radio deselected');
        } else {
            console.error('URL radio element not found');
        }

        // Update form UI
        if (typeof this.toggleEditImageInputs === 'function') {
            this.toggleEditImageInputs();
            console.log('Image inputs toggled successfully');
        } else {
            console.error('toggleEditImageInputs function not found');
        }

        console.log('Edit modal close complete');
    }

    async submitEditServiceForm() {
        console.log('=== SUBMIT EDIT FORM START ===');

        if (!this.editingServiceId) {
            console.log('❌ No editing service ID set');
            console.error('No editing service ID');
            alert('Error: No service selected for editing. Please try opening the edit modal again.');
            return;
        }

        console.log('🆔 Editing service ID:', this.editingServiceId);

        // Check if form exists and is valid
        const form = document.getElementById('editServiceForm');
        if (!form) {
            console.error('❌ Edit form not found');
            alert('Error: Edit form not found. Please refresh the page.');
            return;
        }

        console.log('✅ Edit form found');

        // Check required fields
        const requiredFields = ['editName', 'editEmail', 'editServiceName', 'editDescription', 'editLocation', 'editOrganizer', 'editTiming'];
        const missingFields = requiredFields.filter(fieldId => !document.getElementById(fieldId)?.value?.trim());

        if (missingFields.length > 0) {
            console.log('❌ Missing required fields:', missingFields);
            alert(`Please fill in required fields: ${missingFields.join(', ')}`);
            return;
        }

        console.log('✅ All required fields filled');
        console.log('📝 Proceeding with form submission...');

        const formData = new FormData();

        // Manually append all form fields to ensure completeness
        const name = document.getElementById('editName').value;
        const email = document.getElementById('editEmail').value;
        const phone = document.getElementById('editPhone').value;
        const serviceName = document.getElementById('editServiceName').value;
        const description = document.getElementById('editDescription').value;
        const location = document.getElementById('editLocation').value;
        const organizer = document.getElementById('editOrganizer').value;
        const timing = document.getElementById('editTiming').value;
        const category = document.getElementById('editCategory').value;

        // Check which edit image option is selected
        const selectedImageType = document.querySelector('input[name="editImageType"]:checked')?.value;
        let imageData = null;

        if (selectedImageType === 'upload') {
            const imageFile = document.getElementById('editImage').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
                imageData = `File: ${imageFile.name}`;
                console.log('Appending edit image file:', imageFile.name);
            }
        } else if (selectedImageType === 'url') {
            const imageUrl = document.getElementById('editImageUrl').value.trim();
            if (imageUrl) {
                console.log('Edit image URL field exists:', !!document.getElementById('editImageUrl'));
                console.log('Edit image URL value:', imageUrl);
                console.log('Edit image URL is valid:', imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));

                formData.append('imageUrl', imageUrl); // Send URL as separate field
                imageData = `URL: ${imageUrl}`;

                console.log('Edit URL sent to server - image:', imageUrl);
                console.log('Edit URL sent to server - imageType:', 'url');
            } else {
                console.log('No edit image URL provided');
            }
        }

        // Append text fields
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('serviceName', serviceName);
        formData.append('description', description);
        formData.append('location', location);
        formData.append('organizer', organizer);
        formData.append('timing', timing);
        formData.append('category', category);

        console.log('Form data prepared:', {
            name, email, phone, serviceName, description,
            location, organizer, timing, category,
            hasImage: !!imageFile
        });

        try {
            console.log('Sending PUT request to:', `${this.apiBase}/services/${this.editingServiceId}`);
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, typeof value === 'string' ? value : `${value.name || 'File'} (${value.size} bytes)`);
            }

            const response = await fetch(`${this.apiBase}/services/${this.editingServiceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: formData // Send as FormData to handle file uploads
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server error response:', errorData);
                console.error('Response status:', response.status, response.statusText);

                // Try to parse as JSON if possible
                try {
                    const jsonError = JSON.parse(errorData);
                    console.error('Parsed error:', jsonError);
                } catch (e) {
                    console.error('Could not parse error as JSON');
                }

                throw new Error(`Failed to update service: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('Raw server response:', responseText);

            let updatedService;
            try {
                updatedService = JSON.parse(responseText);
                console.log('Service updated successfully:', updatedService);
            } catch (e) {
                console.error('Failed to parse server response as JSON:', e);
                throw new Error('Invalid server response format');
            }

            this.closeEditServiceModal();
            this.showNotification('Service updated successfully!', 'success');

            // Update the service in our local arrays immediately for better UX
            console.log('Updating arrays with service ID:', this.editingServiceId);
            console.log('Updated service data:', updatedService);

            const serviceIndex = this.services.findIndex(s => s._id === this.editingServiceId);
            if (serviceIndex !== -1) {
                console.log('Updating services array at index:', serviceIndex);
                this.services[serviceIndex] = { ...updatedService };
                this.renderServices(); // Re-render the service grid immediately
            }

            const adminServiceIndex = this.adminServices.findIndex(s => s._id === this.editingServiceId);
            if (adminServiceIndex !== -1) {
                console.log('Found adminServices at index:', adminServiceIndex);
                console.log('Before update - service name:', this.adminServices[adminServiceIndex].serviceName);

                // Create fresh array copy to avoid reference issues
                const freshServices = [...this.adminServices];
                freshServices[adminServiceIndex] = { ...updatedService };

                console.log('After update - service name should be:', updatedService.serviceName);
                console.log('Fresh array service name:', freshServices[adminServiceIndex].serviceName);

                // Verify data integrity
                console.log('All service IDs in fresh array:', freshServices.map(s => s._id));
                console.log('All service names in fresh array:', freshServices.map(s => s.serviceName));

                // Update the admin services reference
                this.adminServices = freshServices;

                // Force immediate visual update
                setTimeout(() => {
                    console.log('Calling renderAdminPanel with fresh data...');
                    this.renderAdminPanel(this.adminServices);
                }, 50);
            } else {
                console.error('Admin service not found in array for ID:', this.editingServiceId);
                console.log('Available service IDs:', this.adminServices.map(s => s._id));
            }

        } catch (error) {
            console.error('Error updating service:', error);
            this.showError('Failed to update service. Please try again.');
        }
    }

    async deleteService(serviceId) {
        console.log('Delete service called for ID:', serviceId);

        if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            console.log('Delete cancelled by user');
            return;
        }

        try {
            console.log('Sending DELETE request to:', `${this.apiBase}/services/${serviceId}`);

            const response = await fetch(`${this.apiBase}/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            console.log('Delete response status:', response.status);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server error response:', errorData);
                throw new Error(`Failed to delete service: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Delete successful:', responseText);

            this.showNotification('Service deleted successfully!', 'success');

            // Immediate UI updates
            this.services = this.services.filter(s => s._id !== serviceId);
            this.adminServices = this.adminServices.filter(s => s._id !== serviceId);

            // Re-render immediately for better UX
            this.renderServices(); // Update public view
            this.renderAdminPanel(this.adminServices); // Update admin panel

            // Also refresh from server for data consistency
            await this.loadServices();
            if (document.getElementById('adminPanel').style.display !== 'none') {
                await this.showAdminPanel();
            }

        } catch (error) {
            console.error('Error deleting service:', error);
            this.showError('Failed to delete service. Please try again.');
        }
    }

    logoutAdmin() {
        this.adminToken = null;
        localStorage.removeItem('adminToken');
        document.getElementById('adminPanel').style.display = 'none';
        this.updateAdminUI();
    }

    updateAdminUI() {
        const adminBtn = document.querySelector('.admin-btn');
        if (this.adminToken) {
            adminBtn.innerHTML = '<i class="fas fa-cog"></i> Admin Panel';
            adminBtn.onclick = () => this.showAdminPanel();
        } else {
            adminBtn.innerHTML = '<i class="fas fa-user-cog"></i> Admin';
            adminBtn.onclick = () => this.showAdminLogin();
        }
    }

    closeServiceModal() {
        document.getElementById('serviceModal').style.display = 'none';
        this.currentService = null;
    }

    closeAllModals() {
        this.closeServiceModal();
        this.closeAddServiceModal();
        this.closeEditServiceModal();
        this.closeAdminModal();
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('services-grid').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('services-grid').style.display = 'grid';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#0078D7'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 4000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Utility functions
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getCategoryName(category) {
        const categories = {
            'food': 'Food Bank',
            'health': 'Health',
            'education': 'Education',
            'environment': 'Environment',
            'senior': 'Senior Care',
            'literacy': 'Literacy'
        };
        return categories[category] || 'General';
    }

    getCategoryIcon(category) {
        const icons = {
            'food': '🥗',
            'health': '🏥',
            'education': '📚',
            'environment': '🌿',
            'senior': '👴',
            'literacy': '✍️'
        };
        return icons[category] || '🏢';
    }

    scrollToServices() {
        document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
    }

    // Toggle between file upload and URL input for images
    toggleImageInputs() {
        const selectedType = document.querySelector('input[name="imageType"]:checked')?.value;

        const fileInput = document.getElementById('image');
        const urlInput = document.getElementById('imageUrl');

        if (selectedType === 'upload') {
            fileInput.style.display = 'block';
            fileInput.required = true;
            urlInput.style.display = 'none';
            urlInput.required = false;
        } else {
            fileInput.style.display = 'none';
            fileInput.required = false;
            urlInput.style.display = 'block';
            urlInput.required = true;
        }
    }

    // Search functionality
    searchServices() {
        const searchTerm = document.getElementById('navSearchInput').value.toLowerCase().trim();

        if (!searchTerm) {
            this.renderServices(); // Show all services if search is empty
            return;
        }

        const filteredServices = this.services.filter(service => {
            return (
                service.serviceName?.toLowerCase().includes(searchTerm) ||
                service.description?.toLowerCase().includes(searchTerm) ||
                service.location?.toLowerCase().includes(searchTerm) ||
                service.organizer?.toLowerCase().includes(searchTerm) ||
                this.getCategoryName(service.category).toLowerCase().includes(searchTerm)
            );
        });

        this.renderSearchResults(filteredServices, searchTerm);
    }

    renderSearchResults(filteredServices, searchTerm) {
        const servicesGrid = document.getElementById('services-grid');

        if (filteredServices.length === 0) {
            servicesGrid.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No services found</h3>
                    <p style="color: #777; margin-bottom: 1rem;">No services match your search for "<strong style="color: #0078D7;">${searchTerm}</strong>"</p>
                    <button class="btn btn-primary" onclick="communityHub.clearSearch()" style="margin-right: 0.5rem;">
                        <i class="fas fa-times"></i>
                        Show All Services
                    </button>
                    <button class="btn btn-secondary" onclick="communityHub.showAddServiceModal()">
                        <i class="fas fa-plus"></i>
                        Add New Service
                    </button>
                </div>
            `;
            return;
        }

        servicesGrid.innerHTML = `
            <div class="search-results-header">
                <h3>
                    <i class="fas fa-search"></i>
                    Search Results for "${searchTerm}"
                </h3>
                <p>Found ${filteredServices.length} service${filteredServices.length !== 1 ? 's' : ''}</p>
                <button class="btn btn-secondary" onclick="communityHub.clearSearch()">
                    <i class="fas fa-times"></i>
                    Show All Services
                </button>
            </div>
            ${filteredServices.map(service => this.createServiceCard(service)).join('')}
        `;
    }

    clearSearch() {
        document.getElementById('navSearchInput').value = '';
        this.renderServices();
        this.hideSuggestions();
    }

    // Autocomplete functionality
    setupAutocomplete() {
        const searchInput = document.getElementById('navSearchInput');
        this.selectedSuggestionIndex = -1;
        this.suggestionsVisible = false;

        // Input event listener for showing suggestions
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();

            // Debounce the suggestion showing to improve performance
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                if (query.length >= 1) {
                    this.showSuggestions(query);
                } else {
                    this.hideSuggestions();
                }
            }, 150);
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (!this.suggestionsVisible) return;

            const suggestions = this.getVisibleSuggestions();

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
                    this.updateSuggestionSelection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
                    this.updateSuggestionSelection();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedSuggestionIndex >= 0 && suggestions[this.selectedSuggestionIndex]) {
                        this.selectSuggestion(suggestions[this.selectedSuggestionIndex]);
                    } else if (searchInput.value.trim()) {
                        this.searchServices();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hideSuggestions();
                    break;
            }
        });

        // Focus event to potentially show all available services as suggestions
        searchInput.addEventListener('focus', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length === 0) {
                // Show popular/all services when focused
                this.showAllSuggestions();
            }
        });

        // Click outside to close suggestions
        document.addEventListener('click', (e) => {
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer && !searchContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });

        // Reset selected index when input changes
        searchInput.addEventListener('input', () => {
            this.selectedSuggestionIndex = -1;
        });
    }

    showSuggestions(query) {
        const matchingServices = this.getMatchingServices(query);
        if (matchingServices.length === 0) {
            this.hideSuggestions();
            return;
        }

        this.renderSuggestionsDropdown(matchingServices, query);
        this.suggestionsVisible = true;
    }

    showAllSuggestions() {
        // Show first 5 services as popular suggestions when input is focused
        const popularServices = this.services.slice(0, 5);
        if (popularServices.length === 0) return;

        this.renderSuggestionsDropdown(popularServices, '', true);
        this.suggestionsVisible = true;
    }

    getMatchingServices(query) {
        return this.services.filter(service => {
            return (
                service.serviceName?.toLowerCase().includes(query) ||
                service.description?.toLowerCase().includes(query) ||
                service.location?.toLowerCase().includes(query) ||
                service.organizer?.toLowerCase().includes(query) ||
                this.getCategoryName(service.category).toLowerCase().includes(query)
            );
        }).slice(0, 8); // Limit to 8 suggestions
    }

    renderSuggestionsDropdown(suggestions, query, showPopularText = false) {
        let dropdown = document.getElementById('autocomplete-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'autocomplete-dropdown';
            dropdown.className = 'autocomplete-dropdown';
            document.querySelector('.search-container').appendChild(dropdown);
        }

        const suggestionsHTML = suggestions.map((service, index) => {
            const highlightedName = this.highlightMatch(service.serviceName, query);
            const categoryName = this.getCategoryName(service.category);

            return `
                <div class="autocomplete-item" data-service-id="${service._id}" data-index="${index}">
                    <div class="autocomplete-item-content">
                        <div class="autocomplete-service-name">${highlightedName}</div>
                        <div class="autocomplete-service-meta">
                            <span class="autocomplete-category">${categoryName}</span>
                            <span class="autocomplete-location">${service.location}</span>
                        </div>
                    </div>
                    <i class="fas fa-search autocomplete-icon"></i>
                </div>
            `;
        }).join('');

        const headerText = showPopularText ? 'Popular Services' : `Suggestions for "${query}"`;

        dropdown.innerHTML = `
            <div class="autocomplete-header">${headerText}</div>
            ${suggestionsHTML}
        `;

        // Add click handlers to suggestions
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const serviceId = item.dataset.serviceId;
                const service = suggestions.find(s => s._id === serviceId);
                if (service) {
                    this.selectSuggestion(service);
                }
            });
        });

        dropdown.style.display = 'block';
        this.selectedSuggestionIndex = -1;
    }

    highlightMatch(text, query) {
        if (!query) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    selectSuggestion(service) {
        // Set the search input to the selected service name
        document.getElementById('navSearchInput').value = service.serviceName;

        // Hide suggestions
        this.hideSuggestions();

        // Scroll to services section
        this.scrollToServices();

        // Perform the search
        this.searchServices();
    }

    updateSuggestionSelection() {
        const suggestions = this.getVisibleSuggestions();
        const dropdown = document.getElementById('autocomplete-dropdown');

        // Remove previous selection
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.classList.remove('autocomplete-item-selected');
        });

        // Add selection to current item
        if (this.selectedSuggestionIndex >= 0 && suggestions[this.selectedSuggestionIndex]) {
            suggestions[this.selectedSuggestionIndex].classList.add('autocomplete-item-selected');
        }
    }

    getVisibleSuggestions() {
        const dropdown = document.getElementById('autocomplete-dropdown');
        return dropdown ? Array.from(dropdown.querySelectorAll('.autocomplete-item')) : [];
    }

    hideSuggestions() {
        const dropdown = document.getElementById('autocomplete-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        this.suggestionsVisible = false;
        this.selectedSuggestionIndex = -1;
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .no-services {
        text-align: center;
        padding: 4rem 2rem;
        color: #777;
    }

    .no-services h3 {
        margin-bottom: 1rem;
        color: #555;
    }
`;
document.head.appendChild(style);

// Declare global variables
let communityHub, imageCarousel;

// Wait for DOM to be fully loaded before initializing carousel
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM Content Loaded - initializing CommunityHub...');
    // Initialize the application first to make sure DOM is ready
    communityHub = new CommunityHub();

    // Make globally available for onclick handlers immediately
    window.communityHub = communityHub;

    // Wait a bit more to ensure all images are loaded, then start carousel
    window.addEventListener('load', function() {
        console.log('🚀 Window loaded - initializing carousel...');
        // Initialize the carousel after all images are loaded
        imageCarousel = new ImageCarousel();

        // Make globally available for onclick handlers
        window.imageCarousel = imageCarousel;
        console.log('✅ All components initialized successfully!');
    });
});

// Add scroll-based navbar enhancement
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');

    function handleScroll() {
        const scrollY = window.scrollY;
        const threshold = 50;

        if (scrollY > threshold) {
            navbar.classList.add('scroll-active');
        } else {
            navbar.classList.remove('scroll-active');
        }
    }

    // Add scroll event listener with throttling
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(function() {
                handleScroll();
                scrollTimeout = null;
            }, 16); // ~60fps
        }
    });

    // Initial check
    handleScroll();
});

// Image Carousel Class
class ImageCarousel {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.indicators = [];
        this.intervalId = null;
        this.slideInterval = 3000; // 3 seconds
        this.isPaused = false;

        this.initializeCarousel();
    }

    initializeCarousel() {
        console.log('🎠 Initializing carousel...');

        // Get all slides and indicators
        this.slides = document.querySelectorAll('.carousel-slide');
        this.indicators = document.querySelectorAll('.indicator');
        const carousel = document.querySelector('.carousel-container');

        console.log('📊 Found slides:', this.slides.length);
        console.log('📊 Found indicators:', this.indicators.length);

        if (this.slides.length === 0) {
            console.log('❌ No slides found, carousel initialization aborted');
            return;
        }

        // Add event listeners for indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                console.log('🔘 Indicator clicked:', index);
                this.goToSlide(index);
            });
        });

        // Add navigation buttons if they exist
        const prevBtn = document.querySelector('.carousel-prev');
        const nextBtn = document.querySelector('.carousel-next');

        console.log('🔘 Navigation buttons found:', { prev: !!prevBtn, next: !!nextBtn });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                console.log('⬅️ Previous button clicked');
                this.prevSlide();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('➡️ Next button clicked');
                this.nextSlide();
            });
        }

        // Add hover functionality for pause
        if (carousel) {
            carousel.addEventListener('mouseenter', () => {
                console.log('⏸️ Carousel hover - pausing');
                this.pause();
            });

            carousel.addEventListener('mouseleave', () => {
                console.log('▶️ Carousel hover end - resuming');
                this.resume();
            });
        }

        // Show first slide
        console.log('👁️ Showing first slide');
        this.showSlide(0);

        // Start auto-sliding
        console.log('🚀 Starting auto-slide');
        this.startAutoSlide();
    }

    showSlide(index) {
        console.log('👁️ Showing slide:', index);

        // Hide all slides
        this.slides.forEach((slide, i) => {
            slide.classList.remove('active');
            console.log('🔄 Hiding slide:', i);
        });

        // Update indicators
        this.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
            console.log('📍 Indicator', i, 'active:', i === index);
        });

        // Show active slide
        if (this.slides[index]) {
            this.slides[index].classList.add('active');
            console.log('✅ Activated slide:', index);
        } else {
            console.error('❌ Slide not found at index:', index);
        }

        this.currentSlide = index;
        console.log('📊 Current slide updated to:', this.currentSlide);
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    prevSlide() {
        const prevIndex = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
        this.goToSlide(prevIndex);
    }

    goToSlide(index) {
        if (index === this.currentSlide || this.isPaused) return;

        // Add zoom out effect for current slide
        const currentSlide = this.slides[this.currentSlide];
        currentSlide.style.animation = 'slideZoomOut 0.8s ease-out';

        // Wait for zoom out animation to complete, then show new slide
        setTimeout(() => {
            currentSlide.style.animation = '';
            this.showSlide(index);
        }, 400);
    }

    startAutoSlide() {
        console.log('⏰ Starting auto-slide with interval:', this.slideInterval + 'ms');
        this.intervalId = setInterval(() => {
            if (!this.isPaused) {
                console.log('🔄 Auto-sliding to next slide');
                this.nextSlide();
            } else {
                console.log('⏸️ Auto-slide paused, skipping');
            }
        }, this.slideInterval);
    }

    pause() {
        this.isPaused = true;
        // Add pause indicator
        const carousel = document.querySelector('.carousel-container');
        carousel.classList.add('paused');
    }

    resume() {
        this.isPaused = false;
        // Remove pause indicator
        const carousel = document.querySelector('.carousel-container');
        carousel.classList.remove('paused');
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

// Enhanced hover pause styles
const carouselPauseStyle = document.createElement('style');
carouselPauseStyle.textContent = `
    .carousel-container.paused .carousel-slide.active {
        opacity: 0.9 !important;
    }

    .carousel-container.paused::after {
        content: '';
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #333;
        z-index: 10;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .carousel-container.paused::after {
        content: '⏸️';
    }

    /* Add slide zoom animations */
    @keyframes slideZoomOut {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        100% {
            opacity: 0;
            transform: scale(0.95);
        }
    }

    @keyframes slideZoomIn {
        0% {
            opacity: 0;
            transform: scale(1.05);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(carouselPauseStyle);
