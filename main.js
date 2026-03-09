/**
 * Main Application Logic
 * Orchestrates the application flow and event handling
 */

class UIModals {
    /**
     * Open PO modal
     */
    static openPOModal() {
        document.getElementById('poModal').classList.add('show');
    }

    /**
     * Close PO modal
     */
    static closePOModal() {
        document.getElementById('poModal').classList.remove('show');
    }

    /**
     * Open carton modal
     */
    static openCartonModal() {
        document.getElementById('cartonModal').classList.add('show');
    }

    /**
     * Close carton modal
     */
    static closeCartonModal() {
        document.getElementById('cartonModal').classList.remove('show');
    }

    /**
     * Open carton slips modal
     */
    static openCartonSlipsModal() {
        document.getElementById('cartonSlipsModal').classList.add('show');
    }

    /**
     * Close carton slips modal
     */
    static closeCartonSlipsModal() {
        document.getElementById('cartonSlipsModal').classList.remove('show');
    }

    /**
     * Open packing list modal
     */
    static openPackingListModal() {
        document.getElementById('packingListModal').classList.add('show');
    }

    /**
     * Close packing list modal
     */
    static closePackingListModal() {
        document.getElementById('packingListModal').classList.remove('show');
    }
}

/**
 * Show custom notification instead of alert
 */
function showNotification(title, message, type = 'info') {
    // Create temporary notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-left: 5px solid ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        max-width: 400px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${title}</div>
        <div style="color: #666; font-size: 14px;">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/**
 * Show file parsing progress modal
 */
function showParsingProgress() {
    const modal = document.getElementById('parsingModal');
    if (modal) {
        modal.classList.add('show');
        updateParsingProgress(0, 'Initializing...', 0);
    }
}

/**
 * Update parsing progress
 */
function updateParsingProgress(progress, status, itemCount) {
    const progressBar = document.getElementById('parsingProgressBar');
    const statusText = document.getElementById('parsingStatus');
    const itemCountText = document.getElementById('parsingItemCount');
    
    if (progressBar) progressBar.style.width = progress + '%';
    if (statusText) statusText.textContent = status;
    if (itemCountText) itemCountText.textContent = itemCount;
}

/**
 * Hide parsing progress modal
 */
function hideParsingProgress() {
    const modal = document.getElementById('parsingModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Check and show disclaimer on first load
 */
function checkAndShowDisclaimer() {
    const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');
    
    if (!disclaimerAccepted) {
        // Show disclaimer modal
        const disclaimerModal = document.getElementById('disclaimerModal');
        if (disclaimerModal) {
            disclaimerModal.classList.add('show');
        }
        return false; // User hasn't accepted yet
    }
    return true; // User has already accepted
}

/**
 * Setup disclaimer event listeners
 */
function setupDisclaimerListeners() {
    const acceptBtn = document.getElementById('disclaimerAcceptBtn');
    const declineBtn = document.getElementById('disclaimerDeclineBtn');
    
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('disclaimerAccepted', 'true');
            document.getElementById('disclaimerModal').classList.remove('show');
            showNotification('✅ Accepted', 'You have accepted the terms. Welcome to the application!', 'success');
        });
    }
    
    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            showNotification('❌ Declined', 'You must accept the terms to use this application.', 'error');
            // Disable all functionality except disclaimer
            document.querySelector('.container').style.opacity = '0.3';
            document.querySelector('.container').style.pointerEvents = 'none';
        });
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check disclaimer first
    const disclaimerAccepted = checkAndShowDisclaimer();
    
    // Only proceed with app initialization if disclaimer was previously accepted
    if (disclaimerAccepted) {
        initializeApp();
        app.loadFromLocalStorage();
        setupEventListeners();
        
        // Set defaults if not already loaded from localStorage
        setDefaultHeaderValues();
        
        refreshUI();
    }
    
    // Setup disclaimer listeners regardless
    setupDisclaimerListeners();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Initialize if not already done
    if (!window.appInitialized) {
        window.appInitialized = true;
    }
}

/**
 * Set default values for header data
 */
function setDefaultHeaderValues() {
    // Set default date to today if not already set
    if (!app.headerData.date) {
        const today = new Date().toISOString().split('T')[0];
        app.headerData.date = today;
    }
    
    // Set default brand to "Babyhug" if not already set
    if (!app.headerData.brand) {
        app.headerData.brand = 'Babyhug';
    }
    
    // Save the defaults
    app.saveToLocalStorage();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    setupTabListeners();
    setupStep1Listeners();
    setupStep2Listeners();
    setupStep3Listeners();
    setupModalListeners();
    setupExportImportListeners();
    setupResetConfirmationListeners();
    
    // Reset session button
    document.getElementById('resetSessionBtn').addEventListener('click', () => {
        handleResetSessionWithExportOption();
    });
}

/**
 * Setup tab switching
 */
function setupTabListeners() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Render content if needed
    if (tabName === 'step3') {
        UIRenderer.renderPackingListSummary();
        // Attach image upload listeners after rendering
        setupImageUploadListeners();
    }
}

/**
 * Setup Step 1 listeners
 */
function setupStep1Listeners() {
    const step1Fields = ['vendor', 'buyer', 'vendorAddress', 'brand', 'style', 'color', 'mrp', 'headerDate'];
    
    step1Fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.addEventListener('change', updateHeaderData);
            element.addEventListener('blur', updateHeaderData);
        }
    });

    document.getElementById('style').addEventListener('input', () => {
        updateHeaderData();
    });

    document.getElementById('step1Continue').addEventListener('click', () => {
        // Validate required fields
        const style = document.getElementById('style').value.trim();
        const color = document.getElementById('color').value.trim();
        const brand = document.getElementById('brand').value.trim();
        const buyer = document.getElementById('buyer').value.trim();
        
        if (!style) {
            showNotification('⚠️ Required Field', 'Style is required', 'error');
            document.getElementById('style').focus();
            return;
        }
        
        if (!color) {
            showNotification('⚠️ Required Field', 'Color is required', 'error');
            document.getElementById('color').focus();
            return;
        }
        
        if (!brand) {
            showNotification('⚠️ Required Field', 'Brand is required', 'error');
            document.getElementById('brand').focus();
            return;
        }
        
        if (!buyer) {
            showNotification('⚠️ Required Field', 'Buyer is required', 'error');
            document.getElementById('buyer').focus();
            return;
        }
        
        // Update header data before switching
        updateHeaderData();
        
        // All validations passed, switch to Step 2 (Summary)
        switchTab('step3');
    });
}

/**
 * Update header data from form inputs
 */
function updateHeaderData() {
    const data = {
        vendor: document.getElementById('vendor').value,
        vendorAddress: document.getElementById('vendorAddress').value,
        buyer: document.getElementById('buyer').value,
        brand: document.getElementById('brand').value,
        style: document.getElementById('style').value,
        color: document.getElementById('color').value,
        mrp: document.getElementById('mrp').value,
        date: document.getElementById('headerDate').value
    };

    app.updateHeaderData(data);

    // Auto-fill season
    document.getElementById('season').value = app.headerData.season;
}

/**
 * Handle Excel file upload for PO (Step 2)
 */
async function handleExcelUploadForPO(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // Show parsing progress modal
        showParsingProgress();
        updateParsingProgress(10, '📖 Reading file...', 0);
        
        // Simulate reading delay for visual feedback (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateParsingProgress(30, '⚙️ Parsing data...', 0);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await ExcelParser.parseFile(file);

        if (result.error) {
            hideParsingProgress();
            showNotification('❌ Parsing Error', result.error, 'error');
            e.target.value = '';
            return;
        }

        // Pre-fill PO data from Excel
        const headerData = result.headerData;
        const items = result.items;
        
        updateParsingProgress(60, '📊 Processing items...', items.length);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        updateParsingProgress(80, '✔️ Validating data...', items.length);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update app.headerData with extracted Excel header values (style, color, etc)
        app.updateHeaderData({
            style: headerData.style || app.headerData.style,
            color: headerData.color || app.headerData.color,
            vendor: headerData.vendorName || app.headerData.vendor,
            vendorAddress: headerData.vendorAddress || app.headerData.vendorAddress,
            date: headerData.poDate || app.headerData.date
        });

        // Sync form fields with updated app.headerData
        document.getElementById('vendor').value = app.headerData.vendor;
        document.getElementById('vendorAddress').value = app.headerData.vendorAddress;
        document.getElementById('style').value = app.headerData.style;
        document.getElementById('color').value = app.headerData.color;
        document.getElementById('headerDate').value = app.headerData.date;

        // Validate
        const validation = app.validateExcelData(
            app.headerData.style, 
            headerData.poNumber
        );
        if (!validation.valid) {
            hideParsingProgress();
            showNotification('⚠️ Validation Error', validation.message, 'error');
            e.target.value = '';
            return;
        }

        // Create temporary PO with extracted data
        const tempPoData = {
            deliveredTo: headerData.deliveredTo || '',
            deliveryAddress: headerData.deliveryAddress || '',
            poNumber: headerData.poNumber || '',
            invoiceNumber: headerData.invoiceNumber || '',
            date: headerData.poDate || app.headerData.date,
            items: items
        };

        // Store temp PO in window for editing (NOT in app state yet)
        window.tempPOData = tempPoData;
        
        updateParsingProgress(100, '✅ Complete!', items.length);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Hide modal and show notification
        hideParsingProgress();
        showNotification(
            '✅ File Parsed Successfully',
            `${items.length} items found. Review and save the PO.`,
            'success'
        );
        
        // Show the form with extracted data pre-filled for user review
        UIRenderer.renderPOForm(-1, tempPoData);
        UIModals.openPOModal();
    } catch (error) {
        hideParsingProgress();
        showNotification('❌ Error Reading File', error.message, 'error');
    }

    // Reset input
    e.target.value = '';
}

/**
 * Setup Step 2 listeners
 */
function setupStep2Listeners() {
    document.getElementById('uploadExcelStep2').addEventListener('click', () => {
        document.getElementById('excelFileInputStep2').click();
    });

    document.getElementById('excelFileInputStep2').addEventListener('change', handleExcelUploadForPO);

    document.getElementById('addPoBtn').addEventListener('click', () => {
        UIRenderer.renderPOForm(-1);
        UIModals.openPOModal();
    });
}

/**
 * Setup Step 3 listeners
 */
function setupStep3Listeners() {
    document.getElementById('step3ToPreviousBtn').addEventListener('click', () => {
        switchTab('step1');
    });

    document.getElementById('printSummaryBtn').addEventListener('click', () => {
        // Hide parsing modal before printing
        hideParsingProgress();
        window.print();
    });

    document.getElementById('exportSummaryPdfBtn').addEventListener('click', () => {
        exportSummaryToPDF();
    });

    // Paste image support (global, but only works when step3 is active)
    // Add a named function so we can reference it
    window.handlePasteImage = function(e) {
        // Only handle paste if step3 is active
        if (!document.getElementById('step3').classList.contains('active')) {
            return;
        }

        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    console.log('Image pasted successfully');
                    displayImage(event.target.result);
                };
                reader.readAsDataURL(blob);
                break;
            }
        }
    };

    document.addEventListener('paste', window.handlePasteImage);
}

/**
 * Attach image upload listeners (called after summary is rendered)
 */
function setupImageUploadListeners() {
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('summaryImageInput');
    const imagePreview = document.getElementById('imagePreview');

    // Check if elements exist
    if (!imageUploadArea || !imageInput || !imagePreview) {
        console.warn('Image upload elements not found');
        return;
    }

    // Make image upload area focusable for paste events
    imageUploadArea.setAttribute('tabindex', '-1');

    // Click to upload
    imageUploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // File input change
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                displayImage(event.target.result, imagePreview, imageUploadArea);
            };
            reader.readAsDataURL(file);
        }
    });

    // Load image from localStorage on render
    const savedImage = localStorage.getItem('summaryImage');
    if (savedImage) {
        displayImage(savedImage, imagePreview, imageUploadArea);
    }

    console.log('Image upload listeners attached');
}

// Helper function to display image
function displayImage(dataUrl, imagePreview, imageUploadArea) {
    // If elements not provided, get them from DOM
    if (!imagePreview) {
        imagePreview = document.getElementById('imagePreview');
    }
    if (!imageUploadArea) {
        imageUploadArea = document.getElementById('imageUploadArea');
    }
    
    // Check if elements exist
    if (!imagePreview || !imageUploadArea) {
        console.warn('Image display elements not found', { imagePreview, imageUploadArea });
        return;
    }
    
    console.log('Displaying image, setting background image');
    imagePreview.style.backgroundImage = `url('${dataUrl}')`;
    imagePreview.classList.add('active');
    imageUploadArea.classList.add('has-image');
    
    // Store in localStorage for persistence
    localStorage.setItem('summaryImage', dataUrl);
    console.log('Image saved to localStorage');
}

/**
 * Generate clean PDF-friendly HTML for summary
 */
function generatePDFFriendlySummary() {
    const pos = app.getPOsSummary();
    const savedImage = localStorage.getItem('summaryImage');
    
    if (pos.length === 0) {
        return '<p>No purchase orders added yet.</p>';
    }

    // Get all unique sizes
    const allSizes = new Set();
    pos.forEach(po => {
        po.items.forEach(item => {
            if (item.size) allSizes.add(item.size);
        });
    });
    const sizesList = Array.from(allSizes).sort();

    let html = '<div style="font-family: Arial, sans-serif; padding: 20px;">';
    
    // Title
    html += '<h2 style="text-align: center; margin-top: 0; font-size: 18px;">PACKING LIST SUMMARY</h2>';
    
    // Main Summary Table
    html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px;">';
    html += '<thead>';
    html += '<tr style="background-color: #d0d0d0; font-weight: bold;">';
    html += '<th style="border: 1px solid #999; padding: 6px 4px;">S.No</th>';
    html += '<th style="border: 1px solid #999; padding: 6px 4px;">PO Number</th>';
    html += '<th style="border: 1px solid #999; padding: 6px 4px;">FCID</th>';
    html += '<th style="border: 1px solid #999; padding: 6px 4px;">Delivered To</th>';
    
    sizesList.forEach(size => {
        html += `<th style="border: 1px solid #999; padding: 6px 4px; text-align: center;">${size}</th>`;
    });
    
    html += '<th style="border: 1px solid #999; padding: 6px 4px;">Total</th>';
    html += '<th style="border: 1px solid #999; padding: 6px 4px;">No of Box</th>';
    html += '</tr>';
    html += '</thead>';
    
    // Data rows
    html += '<tbody>';
    let grandTotalBySize = {};
    sizesList.forEach(size => grandTotalBySize[size] = 0);
    let grandTotal = 0;

    pos.forEach((po, poIndex) => {
        const cartons = app.getCartons(poIndex);
        let poTotalBySize = {};
        sizesList.forEach(size => poTotalBySize[size] = 0);
        
        cartons.forEach(carton => {
            sizesList.forEach(size => {
                const qty = carton[size] || 0;
                poTotalBySize[size] += qty;
            });
        });

        const poTotal = sizesList.reduce((sum, size) => sum + (poTotalBySize[size] || 0), 0);
        
        html += '<tr style="border: 1px solid #ddd;">';
        html += `<td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center;">${poIndex + 1}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 4px 2px;">${po.poNumber}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 4px 2px;">${po.items[0]?.fcid || '-'}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 4px 2px;">${po.deliveredTo}</td>`;
        
        sizesList.forEach(size => {
            const qty = poTotalBySize[size] || 0;
            html += `<td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center;">${qty > 0 ? qty : ''}</td>`;
            grandTotalBySize[size] += qty;
        });
        
        html += `<td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; font-weight: bold;">${poTotal}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; background-color: #ffffcc; font-weight: bold;">${cartons.length}</td>`;
        html += '</tr>';
        
        grandTotal += poTotal;
    });

    // Total row
    html += '<tr style="background-color: #d3d3d3; font-weight: bold;">';
    html += '<td colspan="4" style="border: 1px solid #999; padding: 4px 2px; text-align: right;">TOTAL QTY</td>';
    
    sizesList.forEach(size => {
        html += `<td style="border: 1px solid #999; padding: 4px 2px; text-align: center;">${grandTotalBySize[size] || 0}</td>`;
    });
    
    html += `<td style="border: 1px solid #999; padding: 4px 2px; text-align: center; font-weight: bold;">${grandTotal}</td>`;
    html += '<td style="border: 1px solid #999;"></td>';
    html += '</tr>';
    html += '</tbody>';
    html += '</table>';

    // Size Analysis Table
    html += '<h3 style="margin: 15px 0 10px 0; font-size: 13px;">SIZE ANALYSIS</h3>';
    html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px;">';
    html += '<thead>';
    html += '<tr style="background-color: #d0d0d0; font-weight: bold;">';
    html += '<th colspan="4" style="border: 1px solid #999; padding: 6px 4px;">Size</th>';
    
    sizesList.forEach(size => {
        html += `<th style="border: 1px solid #999; padding: 6px 4px; text-align: center;">${size}</th>`;
    });
    
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    // Size row
    html += '<tr style="border: 1px solid #ddd;">';
    html += '<td colspan="4" style="border: 1px solid #999; padding: 4px 2px; font-weight: bold;">Size</td>';
    sizesList.forEach(size => {
        html += `<td style="border: 1px solid #999; padding: 4px 2px; text-align: center; font-weight: bold;">${size}</td>`;
    });
    html += '</tr>';

    // PO Qty row
    html += '<tr style="border: 1px solid #ddd;">';
    html += '<td colspan="4" style="border: 1px solid #333; padding: 4px 2px; font-weight: bold;">PO Qty</td>';
    sizesList.forEach(size => {
        const poQty = pos.reduce((sum, po) => {
            const qty = po.items.find(item => item.size === size)?.billedQty || 0;
            return sum + qty;
        }, 0);
        html += `<td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center;">${poQty || 0}</td>`;
    });
    html += '</tr>';

    // Packed Qty row
    html += '<tr style="border: 1px solid #ddd;">';
    html += '<td colspan="4" style="border: 1px solid #333; padding: 4px 2px; font-weight: bold;">Packed Qty</td>';
    sizesList.forEach(size => {
        html += `<td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center;">${grandTotalBySize[size] || 0}</td>`;
    });
    html += '</tr>';

    // Short Qty row
    html += '<tr style="background-color: #ffe0e0; border: 1px solid #ddd;">';
    html += '<td colspan="4" style="border: 1px solid #333; padding: 4px 2px; font-weight: bold;">Short Qty</td>';
    sizesList.forEach(size => {
        const poQty = pos.reduce((sum, po) => {
            const qty = po.items.find(item => item.size === size)?.billedQty || 0;
            return sum + qty;
        }, 0);
        const shortQty = poQty - (grandTotalBySize[size] || 0);
        html += `<td style="border: 1px solid #ddd; padding: 4px 2px; text-align: center; font-weight: bold;">${shortQty > 0 ? shortQty : 0}</td>`;
    });
    html += '</tr>';
    html += '</tbody>';
    html += '</table>';

    // Details table with image - use table layout for better PDF compatibility
    html += '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
    html += '<tr>';
    html += '<td style="vertical-align: top;">';
    html += '<h3 style="margin: 0 0 10px 0; font-size: 13px;">DETAILS</h3>';
    html += '<table style="width: 100%; border-collapse: collapse; font-size: 10px;">';
    html += '<tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; width: 35%;">Style:</td><td style="border: 1px solid #ddd; padding: 6px;">' + (app.headerData.style || '-') + '</td></tr>';
    html += '<tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Color:</td><td style="border: 1px solid #ddd; padding: 6px;">' + (app.headerData.color || '-') + '</td></tr>';
    html += '<tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Buyer:</td><td style="border: 1px solid #ddd; padding: 6px;">' + (app.headerData.buyer || '-') + '</td></tr>';
    html += '<tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Brand:</td><td style="border: 1px solid #ddd; padding: 6px;">' + (app.headerData.brand || '-') + '</td></tr>';
    html += '<tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Season:</td><td style="border: 1px solid #ddd; padding: 6px;">' + (app.headerData.season || '-') + '</td></tr>';
    html += '<tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Date:</td><td style="border: 1px solid #ddd; padding: 6px;">' + (app.headerData.date || '-') + '</td></tr>';
    html += '</table>';
    html += '</td>';
    
    // Image on right
    if (savedImage) {
        html += '<td style="padding-left: 20px; text-align: center; vertical-align: top;">';
        html += '<h3 style="margin: 0 0 10px 0; font-size: 13px;">PRODUCT IMAGE</h3>';
        html += `<img src="${savedImage}" style="max-width: 180px; max-height: 180px; border: 1px solid #ddd; padding: 5px;">`;
        html += '</td>';
    }
    
    html += '</tr>';
    html += '</table>';
    
    html += '</div>';
    
    return html;
}

/**
 * Export Packing List Summary to PDF
 */
function exportSummaryToPDF() {
    const pdfContent = generatePDFFriendlySummary();
    
    // Create temporary container
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = pdfContent;
    
    const style = app.headerData.style || 'UNKNOWN';
    const filename = `Packing_Summary_${style}.pdf`;
    
    const opt = {
        margin: [5, 5, 5, 5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
        pagebreak: { mode: ['avoid-all'] }
    };
    html2pdf().set(opt).from(tempContainer).save();
}

/**
 * Setup modal listeners
 */
function setupModalListeners() {
    // Close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            modal.classList.remove('show');
        });
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // PO Form submission
    document.getElementById('poForm').addEventListener('submit', (e) => {
        e.preventDefault();
        savePO();
    });

    // Cancel button
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            UIModals.closePOModal();
        });
    });

    // Close carton modal button
    document.getElementById('closeCartonModalBtn').addEventListener('click', () => {
        UIModals.closeCartonModal();
    });

    // Print buttons
    document.getElementById('printCartonSlipsBtn').addEventListener('click', () => {
        // Hide parsing modal before printing
        hideParsingProgress();
        window.print();
    });

    document.getElementById('printPackingListBtn').addEventListener('click', () => {
        // Hide parsing modal before printing
        hideParsingProgress();
        window.print();
    });

    // Navigation between carton slips and packing list
    document.getElementById('nextToPackingListBtn').addEventListener('click', () => {
        UIModals.closeCartonSlipsModal();
        UIModals.openPackingListModal();
    });

    document.getElementById('backToCartonSlipsBtn').addEventListener('click', () => {
        UIModals.closePackingListModal();
        UIModals.openCartonSlipsModal();
    });

    // PDF Export functions
    document.getElementById('exportCartonSlipsPdfBtn').addEventListener('click', () => {
        const element = document.getElementById('cartonSlipsContainer');
        
        // Get current PO info for filename
        const poIndex = currentPoIndex;
        const po = app.getPO(poIndex);
        const poNumber = po.poNumber || 'UNKNOWN';
        
        // Generate filename: Carton_Slip_<PONumber>
        const filename = `Carton_Slip_${poNumber}.pdf`;
        
        const opt = {
            margin: [10, 10, 10, 10],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 1.5, useCORS: true, allowTaint: true, logging: false },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
            pagebreak: { mode: 'avoid', before: '.carton-slip', after: '.carton-slip' }
        };
        html2pdf().set(opt).from(element).save();
    });

    document.getElementById('exportPackingListPdfBtn').addEventListener('click', () => {
        const element = document.getElementById('packingListContainer');
        
        // Get current PO info for filename
        const poIndex = currentPoIndex;
        const po = app.getPO(poIndex);
        const poNumber = po.poNumber || 'UNKNOWN';
        
        // Generate filename: Packing_Slip_<PONumber>
        const filename = `Packing_Slip_${poNumber}.pdf`;
        
        const opt = {
            margin: [5, 5, 5, 5],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: true },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        html2pdf().set(opt).from(element).save();
    });

    // Close other modals
    document.getElementById('cartonSlipsModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('cartonSlipsModal')) {
            UIModals.closeCartonSlipsModal();
        }
    });

    document.getElementById('packingListModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('packingListModal')) {
            UIModals.closePackingListModal();
        }
    });

    document.querySelectorAll('#cartonSlipsModal .close, #packingListModal .close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            UIModals.closeCartonSlipsModal();
            UIModals.closePackingListModal();
        });
    });
}

/**
 * Save PO from form
 */
function savePO() {
    const poIndex = parseInt(document.getElementById('poIndex').value);
    
    // Collect form data
    const deliveredTo = document.getElementById('deliveredTo').value.trim();
    const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
    const poNumber = document.getElementById('poNumber').value.trim();
    const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
    const poDate = document.getElementById('poDate').value;

    // Validate
    if (!deliveredTo || !poNumber || !invoiceNumber) {
        showNotification('⚠️ Required Fields', 'Please fill in: Delivered To, PO Number, and Invoice Number', 'error');
        return;
    }

    // Check for duplicate PO number (if new PO)
    if (poIndex === -1) {
        const validation = app.validateExcelData(app.headerData.style, poNumber);
        if (!validation.valid) {
            showNotification('⚠️ Validation Error', validation.message, 'error');
            return;
        }
    }

    // Collect items
    const items = [];
    document.querySelectorAll('#itemsBody tr').forEach(row => {
        const fcid = row.querySelector('.item-fcid').value.trim();
        const size = row.querySelector('.item-size').value.trim();
        const billedQty = parseInt(row.querySelector('.item-billed-qty').value) || 0;
        const freeQty = parseInt(row.querySelector('.item-free-qty').value) || 0;
        const totalQty = billedQty + freeQty;

        if (size) { // Only add if size is provided
            items.push({
                fcid,
                size,
                billedQty,
                freeQty,
                totalQty
            });
        }
    });

    if (items.length === 0) {
        showNotification('⚠️ No Items', 'Please add at least one item with Size and Quantities', 'error');
        return;
    }

    // Create PO data
    const poData = {
        deliveredTo,
        deliveryAddress,
        poNumber,
        invoiceNumber,
        date: poDate || app.headerData.date,
        items
    };

    // Save
    app.addOrUpdatePO(poIndex, poData);
    showNotification('✅ Success', 'PO saved successfully!', 'success');
    UIModals.closePOModal();
    UIRenderer.renderPOList();
}

/**
 * Handle reset session with export option
 */
function handleResetSessionWithExportOption() {
    const hasData = app.purchaseOrders.length > 0;
    const modal = document.getElementById('resetConfirmModal');
    const message = document.getElementById('resetConfirmMessage');
    
    // Update message based on data status
    if (hasData) {
        message.innerHTML = `<strong style="color: #e74c3c;">⚠️ WARNING: You have unsaved data!</strong><br><br>${app.purchaseOrders.length} Purchase Order(s) will be lost if you reset without exporting.<br><br>What would you like to do?`;
    } else {
        message.innerHTML = `Are you sure you want to reset the session? The session is empty.`;
    }
    
    // Show the modal
    modal.classList.add('show');
}

/**
 * Setup reset confirmation modal listeners
 */
function setupResetConfirmationListeners() {
    const modal = document.getElementById('resetConfirmModal');
    const cancelBtn = document.getElementById('resetCancelBtn');
    const exportBtn = document.getElementById('resetExportBtn');
    const resetBtn = document.getElementById('resetWithoutExportBtn');
    
    // Cancel button
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // Export & Reset button
    exportBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        
        // Export data
        exportDataAsJSON();
        
        // Wait a moment for file download, then reset
        setTimeout(() => {
            app.clearAllData();
            location.reload();
        }, 500);
    });
    
    // Reset without export button
    resetBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        
        // Reset immediately without export
        app.clearAllData();
        location.reload();
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

/**
 * Refresh UI
 */
function refreshUI() {
    // Update header display
    document.getElementById('vendor').value = app.headerData.vendor;
    document.getElementById('vendorAddress').value = app.headerData.vendorAddress;
    document.getElementById('buyer').value = app.headerData.buyer;
    document.getElementById('brand').value = app.headerData.brand;
    document.getElementById('style').value = app.headerData.style;
    document.getElementById('season').value = app.headerData.season;
    document.getElementById('color').value = app.headerData.color;
    document.getElementById('mrp').value = app.headerData.mrp;
    document.getElementById('headerDate').value = app.headerData.date;

    // Render POs
    UIRenderer.renderPOList();
}

/**
 * Export all data as JSON file
 */
function exportDataAsJSON() {
    // Get current header data from form
    updateHeaderData();
    
    // Create export object with metadata
    const exportData = {
        __metadata: {
            exportedFrom: "Carton Slip & Packing List Generator",
            exportDate: new Date().toISOString(),
            version: "1.0"
        },
        headerData: app.headerData,
        purchaseOrders: app.purchaseOrders,
        cartonAllocations: app.cartonAllocations,
        cartonAddresses: app.cartonAddresses
    };
    
    // Generate filename: <docname>_style_yyyymmddhhmm.json
    const now = new Date();
    const yyyymmdd = now.getFullYear().toString() + 
                     String(now.getMonth() + 1).padStart(2, '0') + 
                     String(now.getDate()).padStart(2, '0');
    const hhmm = String(now.getHours()).padStart(2, '0') + 
                 String(now.getMinutes()).padStart(2, '0');
    const style = app.headerData.style || 'default';
    const filename = `${style}_${yyyymmdd}${hhmm}.json`;
    
    // Convert to JSON and download
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`Data exported as: ${filename}`);
}

/**
 * Import data from JSON file
 */
function importDataFromJSON(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);
            
            // Validate file format
            if (!jsonData.__metadata || jsonData.__metadata.exportedFrom !== "Carton Slip & Packing List Generator") {
                showNotification('❌ Invalid File', 'This file was not exported from this application.', 'error');
                return;
            }
            
            // Validate required fields
            if (!jsonData.headerData || !Array.isArray(jsonData.purchaseOrders)) {
                showNotification('❌ Corrupted File', 'Missing required data fields.', 'error');
                return;
            }
            
            // Import data including carton allocations
            app.headerData = jsonData.headerData;
            app.purchaseOrders = jsonData.purchaseOrders;
            app.cartonAllocations = jsonData.cartonAllocations || {};
            app.cartonAddresses = jsonData.cartonAddresses || {};
            
            // Save to localStorage
            app.saveToLocalStorage();
            
            // Refresh UI
            refreshUI();
            
            // Show success message
            showNotification(
                '✅ Data Imported Successfully',
                `Style: ${app.headerData.style} | POs: ${app.purchaseOrders.length}`,
                'success'
            );
            console.log('Data imported from JSON file');
            
        } catch (error) {
            showNotification('❌ Import Error', `Error importing file: ${error.message}`, 'error');
            console.error('JSON import error:', error);
        }
    };
    
    reader.onerror = () => {
        showNotification('❌ File Read Error', 'Error reading file!', 'error');
    };
    
    reader.readAsText(file);
}

/**
 * Setup export/import listeners
 */
function setupExportImportListeners() {
    document.getElementById('exportJsonBtn').addEventListener('click', () => {
        if (app.purchaseOrders.length === 0) {
            showNotification('⚠️ No Data', 'Please add at least one Purchase Order.', 'error');
            return;
        }
        exportDataAsJSON();
    });
    
    document.getElementById('importJsonBtn').addEventListener('click', () => {
        document.getElementById('jsonFileInput').click();
    });
    
    document.getElementById('jsonFileInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importDataFromJSON(e.target.files[0]);
            e.target.value = ''; // Reset file input
        }
    });
}

// Prevent accidental navigation when data is unsaved
window.addEventListener('beforeunload', (e) => {
    if (app.purchaseOrders.length > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
});
