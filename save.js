class SaveSystem {

    // Save map data as JSON
    saveMapData(locations, backgroundImage) {
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
        
        // Only save background image if it exists
        if (backgroundImage) {
            mapData.backgroundImage = backgroundImage.src;
        }
        
        const dataStr = JSON.stringify(mapData);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        // Create a download link and trigger it
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', 'worldmap.json');
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    // Load map data from JSON
    loadMapData(file, onSuccess, onError) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const mapData = JSON.parse(event.target.result);
                onSuccess(mapData);
            } catch (error) {
                console.error('Error loading map data:', error);
                onError(error);
            }
        }
        
        reader.readAsText(file);
    }
    
    // Load background image from file
    loadBackgroundImage(file, onSuccess) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                onSuccess(img);
            }
            img.src = event.target.result;
        }
        
        reader.readAsDataURL(file);
    }
}