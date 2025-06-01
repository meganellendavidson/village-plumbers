document.addEventListener('DOMContentLoaded', () => {
    // Initialize Leaflet map
    const map = L.map('map').setView([-41.2865, 174.7762], 10); // Centered on Wellington, NZ, zoom level 10

    // Add a base tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add Address Search
    const searchControl = new GeoSearch.GeoSearchControl({
        provider: new GeoSearch.OpenStreetMapProvider(),
        style: 'bar', // 'bar' or 'button'
        showMarker: true, // Show a marker on the map at the search result
        showPopup: false, // Show a popup with the result
        autoClose: true, // Close a popup when a new search is started
        retainZoomLevel: false, // Keep current zoom level when navigating to result
        animateZoom: true, // Animate zoom to result
        keepResult: true // Keep the marker and result on the map after search
    });
    map.addControl(searchControl);

    // PDF Export functionality
    const exportButton = document.getElementById('export-pdf-btn');
    const mapElement = document.getElementById('map');

    if (exportButton && mapElement) {
        exportButton.addEventListener('click', () => {
            console.log('Export button clicked');
            // Temporarily set a higher resolution for better PDF quality if needed
            // For simplicity, we'll use the current map size.
            // Ensure the map is fully rendered before capturing
            map.invalidateSize(); // Ensures map size is correct

            setTimeout(() => { // Allow map to re-render if invalidateSize changed anything
                html2canvas(mapElement, {
                    useCORS: true, // Important for external tile layers
                    logging: true,
                    onclone: (documentClone) => {
                        // Hide the zoom controls
                        const zoomControl = documentClone.querySelector('.leaflet-control-zoom');
                        if (zoomControl) {
                            zoomControl.style.display = 'none';
                        }
                        // Fix for Leaflet controls not rendering correctly in html2canvas
                        // by ensuring their positions are explicitly set.
                        const controls = documentClone.querySelectorAll('.leaflet-control-container');
                        controls.forEach(container => {
                            const controlElements = container.querySelectorAll('.leaflet-control');
                            controlElements.forEach(control => {
                                const computedStyle = window.getComputedStyle(control);
                                control.style.marginTop = computedStyle.marginTop;
                                control.style.marginLeft = computedStyle.marginLeft;
                                control.style.marginBottom = computedStyle.marginBottom;
                                control.style.marginRight = computedStyle.marginRight;
                                control.style.top = computedStyle.top;
                                control.style.left = computedStyle.left;
                                control.style.bottom = computedStyle.bottom;
                                control.style.right = computedStyle.right;
                            });
                        });
                    }
                }).then(canvas => {
                    try {
                        const imgData = canvas.toDataURL('image/png');
                        const { jsPDF } = window.jspdf;

                        // Determine PDF orientation based on map aspect ratio
                        const mapWidth = mapElement.offsetWidth;
                        const mapHeight = mapElement.offsetHeight;
                        const orientation = mapWidth > mapHeight ? 'l' : 'p'; // landscape or portrait

                        // A4 dimensions in mm: 210 x 297
                        const pdf = new jsPDF(orientation, 'mm', 'a4');
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = pdf.internal.pageSize.getHeight();

                        // Define page margins for notes (e.g., 20mm)
                        const pageMargin = 50;
                        const contentWidth = pdfWidth - (2 * pageMargin);
                        const contentHeight = pdfHeight - (2 * pageMargin);

                        // Calculate image dimensions to fit the content area, maintaining aspect ratio
                        const canvasAspectRatio = canvas.width / canvas.height;
                        let imgWidthInPdf, imgHeightInPdf;

                        if (contentWidth / contentHeight > canvasAspectRatio) {
                            // Content area is wider or less tall than image: fit to contentHeight
                            imgHeightInPdf = contentHeight;
                            imgWidthInPdf = contentHeight * canvasAspectRatio;
                        } else {
                            // Content area is taller or less wide than image: fit to contentWidth
                            imgWidthInPdf = contentWidth;
                            imgHeightInPdf = contentWidth / canvasAspectRatio;
                        }
                        
                        // Center the image within the defined content area (including margins)
                        const x = pageMargin + (contentWidth - imgWidthInPdf) / 2;
                        const y = pageMargin + (contentHeight - imgHeightInPdf) / 2;

                        pdf.addImage(imgData, 'PNG', x, y, imgWidthInPdf, imgHeightInPdf);
                        pdf.save('map_export.pdf');
                        console.log('PDF generated and download initiated.');
                    } catch (e) {
                        console.error('Error generating PDF:', e);
                        alert('Error generating PDF. See console for details.');
                    }
                }).catch(err => {
                    console.error('html2canvas error:', err);
                    alert('Error capturing map for PDF. See console for details.');
                });
            }, 500); // Delay to ensure map tiles are loaded and rendered
        });
    } else {
        console.error('Export button or map element not found.');
    }
});
