document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const canvas = document.getElementById('map-canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('canvas-container');
    
    // UI Elements
    const modeToggle = document.getElementById('mode-toggle');
    const importBgBtn = document.getElementById('import-bg');
    const saveBtn = document.getElementById('save');
    const loadBtn = document.getElementById('load');
    const bgFileInput = document.getElementById('bg-file-input');
    const loadFileInput = document.getElementById('load-file-input');
    const popup = document.getElementById('popup');
    const popupClose = document.getElementById('popup-close');
    const popupTitle = document.getElementById('popup-title');
    const popupImage = document.getElementById('popup-image');
    const popupDescription = document.getElementById('popup-description');
    const editorForm = document.getElementById('editor-form');
    const locationTitle = document.getElementById('location-title');
    const locationImage = document.getElementById('location-image');
    const locationDescription = document.getElementById('location-description');
    const updateLocationBtn = document.getElementById('update-location');
    
    // State variables
    let isEditMode = true;
    let backgroundImage = null;
    let locations = [];
    let selectedLocation = null;
    
    // Initialize save system
    const saveSystem = new SaveSystem();
    
    // Initialize canvas size
    function resizeCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        redraw();
    }
    
    // Toggle between edit and read modes
    modeToggle.addEventListener('click', function() {
        isEditMode = !isEditMode;
        modeToggle.textContent = isEditMode ? 'Edit Mode' : 'Read Mode';
        modeToggle.classList.toggle('edit-mode', isEditMode);
        closePopup();
        redraw();
    });
    
    // Import background image
    importBgBtn.addEventListener('click', function() {
        bgFileInput.click();
    });
    
    // Loads using the save system
    bgFileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            saveSystem.loadBackgroundImage(e.target.files[0], function(img) {
                backgroundImage = img;
                // Adjust canvas size to match image
                canvas.width = img.width;
                canvas.height = img.height;
                redraw();
            });
        }
    });
    
    // Save map data through save.js
    saveBtn.addEventListener('click', function() {
        saveSystem.saveMapData(locations, backgroundImage);
    });
    
    // Load map data through save.js
    loadBtn.addEventListener('click', function() {
        loadFileInput.click();
    });
    
    loadFileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            saveSystem.loadMapData(e.target.files[0], 
                function(mapData) {
                    locations = mapData.locations || [];
                    
                    // Load background image if available
                    if (mapData.backgroundImage) {
                        const img = new Image();
                        img.onload = function() {
                            backgroundImage = img;
                            canvas.width = img.width;
                            canvas.height = img.height;
                            redraw();
                        }
                        img.src = mapData.backgroundImage;
                    } else {
                        redraw();
                    }
                },
                    // Gives error if there is missing data
                    function(error) {
                        alert('Failed to load map data: ' + error.message);
                    }
            );
        }
    });
    
    // Handle canvas clicks for adding or selecting locations
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find if user clicked on an existing location
        let clickedLocation = null;
        for (let i = 0; i < locations.length; i++) {
            const loc = locations[i];
            const distance = Math.sqrt(Math.pow(x - loc.x, 2) + Math.pow(y - loc.y, 2));
            
            if (distance <= 10) { // 10px radius for clicking on location
                clickedLocation = loc;
                break;
            }
        }
        
        if (isEditMode) {
            if (clickedLocation) {
                // Edit existing location
                selectedLocation = clickedLocation;
                showPopupEditor(x, y);
            } else if (backgroundImage) {
                // Add new location
                const newLocation = {
                    x: x,
                    y: y,
                    title: 'New Location',
                    description: 'Description goes here...',
                    image: ''
                };
                locations.push(newLocation);
                selectedLocation = newLocation;
                showPopupEditor(x, y);
                redraw();
            }
        } else if (clickedLocation) {
            // View location in read mode
            selectedLocation = clickedLocation;
            showPopupViewer(x, y);
        }
    });
    
    // Close popup when clicking the X
    popupClose.addEventListener('click', closePopup);
    
    // Update location data from editor form
    updateLocationBtn.addEventListener('click', function() {
        if (selectedLocation) {
            selectedLocation.title = locationTitle.value;
            selectedLocation.description = locationDescription.value;
            
            // Handle image upload
            if (locationImage.files && locationImage.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    selectedLocation.image = e.target.result;
                    closePopup();
                    redraw();
                }
                reader.readAsDataURL(locationImage.files[0]);
            } else {
                closePopup();
                redraw();
            }
        }
    });
    
    // Show popup with editor form
    function showPopupEditor(x, y) {
        positionPopup(x, y);
        
        // Set form values
        locationTitle.value = selectedLocation.title;
        locationDescription.value = selectedLocation.description;
        
        // Show editor form, hide viewer elements
        popupTitle.style.display = 'none';
        popupImage.style.display = 'none';
        popupDescription.style.display = 'none';
        editorForm.style.display = 'block';
        
        popup.style.display = 'block';
    }
    
    // Show popup with location information
    function showPopupViewer(x, y) {
        positionPopup(x, y);
        
        // Set viewer content
        popupTitle.textContent = selectedLocation.title;
        popupDescription.textContent = selectedLocation.description;
        
        if (selectedLocation.image) {
            popupImage.src = selectedLocation.image;
            popupImage.style.display = 'block';
        } else {
            popupImage.style.display = 'none';
        }
        
        // Show viewer elements, hide editor form
        popupTitle.style.display = 'block';
        popupDescription.style.display = 'block';
        editorForm.style.display = 'none';
        
        popup.style.display = 'block';
    }
    
    // Position popup near the clicked location
    function positionPopup(x, y) {
        const popupWidth = 400;
        const popupHeight = 300;
        
        // Try to position the popup so it's fully visible
        let popupX = x + 10;
        let popupY = y + 10;
        
        // Adjust if the popup would go off the right edge
        if (popupX + popupWidth > canvas.width) {
            popupX = x - popupWidth - 10;
        }
        
        // Adjust if the popup would go off the bottom edge
        if (popupY + popupHeight > canvas.height) {
            popupY = y - popupHeight - 10;
        }
        
        // Ensure popup is not positioned off-screen
        popupX = Math.max(0, popupX);
        popupY = Math.max(0, popupY);
        
        popup.style.left = popupX + 'px';
        popup.style.top = popupY + 'px';
    }
    
    // Close the popup
    function closePopup() {
        popup.style.display = 'none';
        selectedLocation = null;
    }
    
    // Draw everything on the canvas
    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background image if available
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0);
        } else {
            // Draw placeholder background
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ccc';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Import a background image', canvas.width / 2, canvas.height / 2);
        }
        
        // Draw all locations
        locations.forEach(function(loc) {
            // Draw location marker (circle)
            ctx.beginPath();
            ctx.arc(loc.x, loc.y, 6, 0, Math.PI * 2);
            
            // Different styling for edit vs read mode
            if (isEditMode) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            } else {
                ctx.fillStyle = 'rgba(0, 100, 255, 0.7)';
            }
            
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw location name if in read mode
            if (!isEditMode) {
                ctx.fillStyle = 'black';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(loc.title, loc.x, loc.y - 12);
            }
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Initial setup
    resizeCanvas();
    
    // Set initial mode
    modeToggle.textContent = isEditMode ? 'Edit Mode' : 'Read Mode';
    modeToggle.classList.toggle('edit-mode', isEditMode);
});