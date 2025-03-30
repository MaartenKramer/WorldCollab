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
    let isDragging = false;
    let draggedLocation = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Initialize canvas size
    function resizeCanvas() {
        if (!backgroundImage) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }
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
    
    bgFileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    backgroundImage = img;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    redraw();
                }
                img.src = event.target.result;
            }
            
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Save map data as JSON
    saveBtn.addEventListener('click', function() {
        const mapData = {
            locations: locations.map(loc => {
                return {
                    x: loc.x,
                    y: loc.y,
                    title: loc.title,
                    image: loc.image,
                    description: loc.description
                };
            })
        };
        
        // Save background image
        if (backgroundImage) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = backgroundImage.width;
            tempCanvas.height = backgroundImage.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(backgroundImage, 0, 0);
            mapData.backgroundImage = tempCanvas.toDataURL('image/png');
        }
        
        const dataStr = JSON.stringify(mapData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        // Download
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', 'worldmap.json');
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    });
    
    // Load map data from JSON
    loadBtn.addEventListener('click', function() {
        loadFileInput.click();
    });
    
    loadFileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const mapData = JSON.parse(event.target.result);
                    
                    // Load locations
                    locations = mapData.locations || [];
                    
                    // Load background image
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
                } catch (error) {
                    console.error('Error loading map data:', error);
                    alert('Failed to load map data: ' + error.message);
                }
            }
            
            reader.readAsText(e.target.files[0]);
        }
    });
    
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        let clickedLocation = null;
        for (let i = 0; i < locations.length; i++) {
            const loc = locations[i];
            const distance = Math.sqrt(Math.pow(x - loc.x, 2) + Math.pow(y - loc.y, 2));
            
            if (distance <= 10) {
                clickedLocation = loc;
                break;
            }
        }
        
        if (isEditMode) {
            
            // Right click to delete marker
            if (e.button === 2) {
                if (clickedLocation) {
                    const index = locations.indexOf(clickedLocation);
                    if (index > -1) {
                        locations.splice(index, 1);
                        redraw();
                    }
                }
            }
            
            // Middle click to start dragging
            if (e.button === 1 && clickedLocation) {
                isDragging = true;
                draggedLocation = clickedLocation;
                dragOffsetX = x - clickedLocation.x;
                dragOffsetY = y - clickedLocation.y;
            }
            
            // Left click to edit/add
            if (e.button === 0) {
                if (clickedLocation) {

                    // Edit existing location
                    selectedLocation = clickedLocation;
                    showPopupEditor(x, y);
                } 
                else if (backgroundImage) {
                    
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
            }
        } 
        else if (clickedLocation) {
            
            // View location in read mode
            selectedLocation = clickedLocation;
            showPopupViewer(x, y);
        }
    });

    canvas.addEventListener('mousemove', function(e) {
        if (!isEditMode || !isDragging) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        draggedLocation.x = x - dragOffsetX;
        draggedLocation.y = y - dragOffsetY;

        redraw();
    });

    canvas.addEventListener('mouseup', function(e) {
        if (e.button === 1) {
            isDragging = false;
            draggedLocation = null;
        }
    });
    
    // Close pop up
    popupClose.addEventListener('click', closePopup);
    
    // Update location info
    updateLocationBtn.addEventListener('click', function() {
        if (selectedLocation) {
            selectedLocation.title = locationTitle.value;
            selectedLocation.description = locationDescription.value;
            
            // Upload image
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
    
    function showPopupEditor(x, y) {
        positionPopup(x, y);
        
        locationTitle.value = selectedLocation.title;
        locationDescription.value = selectedLocation.description;
        
        popupTitle.style.display = 'none';
        popupImage.style.display = 'none';
        popupDescription.style.display = 'none';
        editorForm.style.display = 'block';
        
        popup.style.display = 'block';
    }
    
    // Show pop up with location information
    function showPopupViewer(x, y) {
        positionPopup(x, y);
        
        popupTitle.textContent = selectedLocation.title;
        popupDescription.textContent = selectedLocation.description;
        
        if (selectedLocation.image) {
            popupImage.src = selectedLocation.image;
            popupImage.style.display = 'block';
        } 
        
        else {
            popupImage.style.display = 'none';
        }
        
        popupTitle.style.display = 'block';
        popupDescription.style.display = 'block';
        editorForm.style.display = 'none';
        
        popup.style.display = 'block';
    }
    
    // Position pop up
    function positionPopup(x, y) {
        const popupWidth = 400;
        const popupHeight = 300;
        
        let popupX = x + 10;
        let popupY = y + 10;
        
        if (popupX + popupWidth > canvas.width) {
            popupX = x - popupWidth - 10;
        }
        
        if (popupY + popupHeight > canvas.height) {
            popupY = y - popupHeight - 10;
        }
        
        // Make sure pop up is on screen
        popupX = Math.max(0, popupX);
        popupY = Math.max(0, popupY);
        
        popup.style.left = popupX + 'px';
        popup.style.top = popupY + 'px';
    }
    
    // Close pop up
    function closePopup() {
        popup.style.display = 'none';
        selectedLocation = null;
    }
    
    // Draw everything
    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background image
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0);
        } 
        
        else {
            // Draw placeholder
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ccc';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Import a background image', canvas.width / 2, canvas.height / 2);
        }
        
        // Draw locations
        locations.forEach(function(loc) {

            // Draw location marker
            ctx.beginPath();
            ctx.arc(loc.x, loc.y, 6, 0, Math.PI * 2);
            
            if (isEditMode) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            } 
            
            else {
                ctx.fillStyle = 'rgba(0, 100, 255, 0.7)';
            }
            
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    resizeCanvas();
    
    modeToggle.textContent = isEditMode ? 'Edit Mode' : 'Read Mode';
    modeToggle.classList.toggle('edit-mode', isEditMode);
});