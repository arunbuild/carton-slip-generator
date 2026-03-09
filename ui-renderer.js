/**
 * UI Renderer
 * Renders the application UI components
 */

class UIRenderer {
    /**
     * Render the PO list in Step 2
     */
    static renderPOList() {
        const poList = document.getElementById('poList');
        const pos = app.getPOsSummary();

        if (pos.length === 0) {
            poList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No purchase orders added yet.</p>';
            return;
        }

        let html = '';
        pos.forEach((po, index) => {
            const totalQty = po.items.reduce((sum, item) => sum + item.totalQty, 0);
            const isExpanded = false; // Collapse by default
            
            html += `
                <div class="po-card">
                    <div class="po-card-header">
                        <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                            <button class="btn-toggle-po" data-po-index="${index}" title="Toggle details" style="background: none; border: none; font-size: 18px; cursor: pointer; padding: 0;">
                                ${isExpanded ? '▼' : '▶'}
                            </button>
                            <div>
                                <div class="po-card-title">PO #${index + 1}: ${po.poNumber}</div>
                                <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 13px;">${po.deliveredTo}</p>
                            </div>
                        </div>
                        <div class="po-card-actions">
                            <button class="btn btn-secondary edit-po-btn" data-po-index="${index}">✎ Edit</button>
                            <button class="btn btn-secondary allocate-carton-btn" data-po-index="${index}">📦 Allocate Cartons</button>
                            <button class="btn btn-danger remove-po-btn" data-po-index="${index}">🗑️ Remove</button>
                        </div>
                    </div>

                    <div class="po-details" data-po-index="${index}" style="display: ${isExpanded ? 'block' : 'none'};">
                        <div class="po-info-grid">
                            <div class="po-info-item">
                                <div class="po-info-label">Delivered To</div>
                                <div class="po-info-value">${po.deliveredTo}</div>
                            </div>
                            <div class="po-info-item">
                                <div class="po-info-label">Address</div>
                                <div class="po-info-value">${po.deliveryAddress}</div>
                            </div>
                            <div class="po-info-item">
                                <div class="po-info-label">Invoice No</div>
                                <div class="po-info-value">${po.invoiceNumber}</div>
                            </div>
                            <div class="po-info-item">
                                <div class="po-info-label">Date</div>
                                <div class="po-info-value">${po.date}</div>
                            </div>
                            <div class="po-info-item">
                                <div class="po-info-label">Total Items Qty</div>
                                <div class="po-info-value" style="color: var(--secondary-color); font-weight: bold;">${totalQty}</div>
                            </div>
                            <div class="po-info-item">
                                <div class="po-info-label">Carton Boxes</div>
                                <div class="po-info-value" style="color: var(--success-color); font-weight: bold;">${po.cartonCount}</div>
                            </div>
                        </div>

                        <table class="data-table" style="margin-top: 15px;">
                            <thead>
                                <tr>
                                    <th>FCID</th>
                                    <th>Size</th>
                                    <th>Billed Qty</th>
                                    <th>Free Qty</th>
                                    <th>Total Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${po.items.map((item, idx) => `
                                    <tr>
                                        <td>${item.fcid}</td>
                                        <td>${item.size}</td>
                                        <td>${item.billedQty}</td>
                                        <td>${item.freeQty}</td>
                                        <td><strong>${item.totalQty}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        poList.innerHTML = html;
        this.attachPOListeners();
        this.attachPOToggleListeners();
    }

    /**
     * Render PO form in modal
     */
    static renderPOForm(poIndex, tempPOData = null) {
        const form = document.getElementById('poForm');
        const po = poIndex === -1 ? tempPOData : app.getPO(poIndex);
        const isNewPO = !po;

        document.getElementById('poIndex').value = poIndex;
        document.getElementById('modalTitle').textContent = isNewPO ? 'Add New Purchase Order' : `Edit PO: ${po.poNumber}`;

        document.getElementById('deliveredTo').value = po?.deliveredTo || '';
        document.getElementById('deliveryAddress').value = po?.deliveryAddress || '';
        document.getElementById('poNumber').value = po?.poNumber || '';
        document.getElementById('invoiceNumber').value = po?.invoiceNumber || '';
        
        // Default to today's date for new POs, otherwise use existing date
        let dateValue = '';
        if (po?.date) {
            dateValue = po.date;
        } else if (isNewPO) {
            // Get today's date in YYYY-MM-DD format
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            dateValue = `${year}-${month}-${day}`;
        } else {
            dateValue = app.headerData.date;
        }
        document.getElementById('poDate').value = dateValue;

        // Render items
        const itemsBody = document.getElementById('itemsBody');
        itemsBody.innerHTML = '';

        if (po) {
            po.items.forEach((item, idx) => {
                itemsBody.innerHTML += this.renderItemRow(idx, item);
            });
        }

        // Attach item listeners
        this.attachItemListeners(po);
    }

    /**
     * Render a single item row
     */
    static renderItemRow(index, item = {}) {
        const totalQty = (item.billedQty || 0) + (item.freeQty || 0);
        return `
            <tr data-item-index="${index}">
                <td><input type="text" class="item-fcid" value="${item.fcid || ''}"></td>
                <td><input type="text" class="item-size" value="${item.size || ''}"></td>
                <td><input type="number" class="item-billed-qty" value="${item.billedQty || 0}"></td>
                <td><input type="number" class="item-free-qty" value="${item.freeQty || 0}"></td>
                <td><input type="number" class="item-total-qty" value="${item.totalQty || totalQty}" readonly></td>
                <td><button type="button" class="btn btn-danger btn-small remove-item-btn" data-item-index="${index}">✕</button></td>
            </tr>
        `;
    }

    /**
     * Render cartons for allocation
     */
    static renderCartons(poIndex) {
        const po = app.getPO(poIndex);
        const cartons = app.getCartons(poIndex);
        const sizes = app.getUniqueSizes(po);
        const container = document.getElementById('cartonsContainer');

        let html = '';
        cartons.forEach((carton, cartonIdx) => {
            const totalQty = app.getCartonTotalQty(carton);
            
            html += `
                <div class="carton-box">
                    <div class="carton-header">
                        <div class="carton-title">Carton Box ${cartonIdx + 1}</div>
                        <button type="button" class="btn btn-danger btn-small remove-carton-btn" data-carton-index="${cartonIdx}">Remove</button>
                    </div>

                    <div class="carton-summary">
                        <div class="carton-stat">
                            <div class="carton-stat-label">Total Qty</div>
                            <div class="carton-stat-value carton-grand-total">${totalQty}</div>
                        </div>
                    </div>

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>FCID</th>
                                <th>Size</th>
                                <th>Qty Packed</th>
                                <th>Ordered Qty</th>
                                <th>Remaining</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sizes.map(size => {
                                const fcid = app.getFCIDForSize(po, size);
                                const orderedQty = app.getTotalQtyForSize(po, size);
                                const packedQty = carton[size] || 0;
                                // Calculate remaining by subtracting all OTHER cartons' packed qty (not including current carton)
                                const packedInOthers = cartons.reduce((sum, c, idx) => {
                                    if (idx !== cartonIdx) {
                                        return sum + (c[size] || 0);
                                    }
                                    return sum;
                                }, 0);
                                const remainingQty = orderedQty - packedInOthers - packedQty;
                                const isDisabled = remainingQty <= 0 && packedQty === 0;
                                const showAllBtn = remainingQty > 0;
                                
                                // Check if this input was previously overridden
                                const existingInput = document.querySelector(`.carton-qty-input[data-carton-index="${cartonIdx}"][data-size="${size}"]`);
                                const wasOverridden = existingInput && existingInput.dataset.overridden === 'true';
                                const shouldDisable = isDisabled && !wasOverridden;
                                
                                return `
                                    <tr>
                                        <td>${fcid}</td>
                                        <td>${size}</td>
                                        <td style="position: relative;">
                                            <div style="display: flex; gap: 5px; align-items: center;">
                                                <input 
                                                    type="number" 
                                                    class="carton-qty-input" 
                                                    data-carton-index="${cartonIdx}" 
                                                    data-size="${size}" 
                                                    value="${packedQty}"
                                                    min="0"
                                                    ${shouldDisable ? 'disabled' : ''}
                                                    data-overridden="${wasOverridden ? 'true' : 'false'}"
                                                >
                                                ${showAllBtn ? `
                                                    <button 
                                                        type="button" 
                                                        class="btn btn-small add-all-qty-btn" 
                                                        data-carton-index="${cartonIdx}" 
                                                        data-size="${size}"
                                                        data-po-index="${poIndex}"
                                                        title="Add all remaining quantity"
                                                    >All</button>
                                                ` : `
                                                    <button 
                                                        type="button" 
                                                        class="btn btn-small override-qty-btn" 
                                                        data-carton-index="${cartonIdx}" 
                                                        data-size="${size}"
                                                        title="Force edit quantity"
                                                    >Override</button>
                                                `}
                                            </div>
                                        </td>
                                        <td>${orderedQty}</td>
                                        <td><strong>${remainingQty}</strong></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });

        container.innerHTML = html;
        this.attachCartonListeners(poIndex);
    }

    /**
     * Render carton slips for printing
     */
    static renderCartonSlips(poIndex) {
        const po = app.getPO(poIndex);
        const cartons = app.getCartons(poIndex);
        const sizes = app.getUniqueSizes(po);
        const addresses = app.getCartonAddresses(poIndex);
        const container = document.getElementById('cartonSlipsContainer');

        let html = '';
        cartons.forEach((carton, cartonIdx) => {
            const totalQty = app.getCartonTotalQty(carton);
            
            html += `
                <div class="carton-slip">
                    <div class="slip-title">CARTON SLIP-${po.deliveredTo}</div>

                    <div class="slip-header-info">
                        <div class="slip-header-item">
                            <span class="slip-header-label">VENDOR NAME:</span>
                            <span>${app.headerData.vendor}</span>
                        </div>
                        <div class="slip-header-item">
                            <span class="slip-header-label">P O NO:</span>
                            <span>${po.poNumber}</span>
                        </div>
                        <div class="slip-header-item">
                            <span class="slip-header-label">INVOICE NO:</span>
                            <span>${po.invoiceNumber}</span>
                        </div>
                        <div class="slip-header-item">
                            <span class="slip-header-label">STYLE CODE/EAN CODE:</span>
                            <span>${app.headerData.style}</span>
                        </div>
                        <div class="slip-header-item">
                            <span class="slip-header-label">QTY:</span>
                            <span>${totalQty}</span>
                        </div>
                        <div class="slip-header-item">
                            <span class="slip-header-label">COLOR:</span>
                            <span>${app.headerData.color}</span>
                        </div>
                        <div class="slip-header-item">
                            <span class="slip-header-label">DATE:</span>
                            <span>${po.date}</span>
                        </div>
                    </div>

                    <table class="slip-matrix">
                        <tbody>
                            <tr>
                                <td style="font-weight: bold; background: #f0f0f0;">Invoice SNo</td>
                                ${this.generateNumberSequence(sizes.length).map(num => 
                                    `<td style="text-align: center; font-weight: bold;">${num}</td>`
                                ).join('')}
                                <td style="font-weight: bold; background: #f0f0f0;">TOTAL QTY</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; background: #f0f0f0;">FCID</td>
                                ${sizes.map(size => {
                                    const fcid = app.getFCIDForSize(po, size);
                                    return `<td style="font-weight: bold; text-align: center;">${fcid}</td>`;
                                }).join('')}
                                <td rowspan="2" style="font-weight: bold; background: #f0f0f0; text-align: center;">${totalQty}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; background: #f0f0f0;">Size Style Code</td>
                                ${sizes.map(size => 
                                    `<td style="font-weight: bold; text-align: center;">${size}</td>`
                                ).join('')}
                            </tr>
                            <tr>
                                <td style="font-weight: bold; background: #f0f0f0;">Style</td>
                                ${sizes.map(size => {
                                    const qty = carton[size] || 0;
                                    return `<td style="font-weight: bold; text-align: center;">${qty > 0 ? qty : ''}</td>`;
                                }).join('')}
                                <td style="font-weight: bold; background: #f0f0f0;"></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="carton-no-info" style="font-size: 1.4em; font-weight: bold; margin: 20px 0;">
                        Carton No: ${cartonIdx + 1} of ${cartons.length}, Gross Weight: _________________________ KGS
                    </div>

                    <div class="slip-addresses">
                        <div class="slip-address" style="border: 2px solid #333; padding: 10px; margin: 10px 0;">
                            <div class="slip-address-label">TO</div>
                            <div>${this.formatAddress(addresses.toAddress || '\n' + po.deliveryAddress)}</div>
                        </div>
                        <div class="slip-address" style="border: 2px solid #333; padding: 10px; margin: 10px 0;">
                            <div class="slip-address-label">FROM</div>
                            <div>${this.formatAddress(addresses.fromAddress || app.headerData.vendor + '\n' + app.headerData.vendorAddress)}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Render packing list
     */
    static renderPackingList(poIndex) {
        const po = app.getPO(poIndex);
        const cartons = app.getCartons(poIndex);
        const sizes = app.getUniqueSizes(po);
        const container = document.getElementById('packingListContainer');

        let html = `
            <div class="packing-list" style="page-break-after: always; padding: 10px; font-family: Arial, sans-serif; font-size: 11px; width: 100%;">
                <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 12px;">
                    PACKING LIST(${po.deliveredTo})
                </div>

                <!-- Header Matrix: 6 rows x 4 columns -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; table-layout: fixed;">
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: 12%;" rowspan="2">VENDOR</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 11px; width: 20%;" rowspan="2">${app.headerData.vendor}</td>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: 12%;">INVOICE NO:</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 11px; width: 20%;">${po.invoiceNumber}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center;">P.O NO:</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 11px;">${po.poNumber}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center;" rowspan="2">BUYER</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 11px;" rowspan="2">${app.headerData.buyer}</td>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center;">SEASON:</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 11px; font-weight: bold;">${app.headerData.season}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center;">STYLE:</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 12px; font-weight: bold;">${app.headerData.style}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center;" rowspan="2">BRAND</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 11px;" rowspan="2">${app.headerData.brand}</td>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center;">COLOR:</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 11px; font-weight: bold;">${app.headerData.color}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center;">DATE:</td>
                            <td style="border: 1px solid #000; padding: 5px; font-size: 11px;">${po.date}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Data Table -->
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed;">
                    <thead>
                        <!-- Row 1: Column headers 1-N -->
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: 8%;" rowspan="3">CARTON<br>SERIAL NO</td>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: 10%;" rowspan="3">STYLE NO</td>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: 8%;">INV SERIAL<br>NO</td>
        `;

        // Calculate width for each size column
        const sizeColWidth = (74 - 6) / sizes.length; // 74% available for size columns - 6% for total

        // Row 1: Column numbers
        sizes.forEach((size, idx) => {
            html += `<td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: ${sizeColWidth}%;">${idx + 1}</td>`;
        });

        html += `
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: 6%;" rowspan="3">TOTAL</td>
                        </tr>
                        
                        <!-- Row 2: FCID -->
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: 8%;">FCID</td>
        `;

        sizes.forEach(size => {
            const fcid = app.getFCIDForSize(po, size);
            html += `<td style="border: 1px solid #000; padding: 5px; text-align: center; width: ${sizeColWidth}%; font-size: 10px;">${fcid}</td>`;
        });

        html += `
                        </tr>
                        
                        <!-- Row 3: SIZE (Bold and Bigger) -->
                        <tr>
                            <td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: 8%;">SIZE</td>
        `;

        sizes.forEach(size => {
            html += `<td style="border: 1px solid #000; padding: 5px; font-weight: bold; text-align: center; width: ${sizeColWidth}%; font-size: 12px;">${size}</td>`;
        });

        html += `
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Add carton rows
        let grandTotal = 0;
        cartons.forEach((carton, cartonIdx) => {
            let cartonTotal = 0;
            html += `<tr>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center; width: 8%; font-size: 11px;">${cartonIdx + 1}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center; width: 10%; font-size: 11px;">${app.headerData.style}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center; width: 8%;"></td>
            `;

            sizes.forEach(size => {
                const qty = carton[size] || 0;
                cartonTotal += qty;
                html += `<td style="border: 1px solid #000; padding: 5px; text-align: center; width: ${sizeColWidth}%; font-size: 11px;">${qty > 0 ? qty : ''}</td>`;
            });

            grandTotal += cartonTotal;
            html += `
                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; width: 6%; font-size: 11px;">${cartonTotal}</td>
                </tr>
            `;
        });

        // Total row
        html += `
                        <tr style="font-weight: bold;">
                            <td colspan="2" style="border: 1px solid #000; padding: 5px; text-align: right; font-size: 11px;">TOTAL</td>
                            <td style="border: 1px solid #000; padding: 5px; width: 8%;"></td>
        `;

        sizes.forEach(size => {
            const total = cartons.reduce((sum, carton) => sum + (carton[size] || 0), 0);
            html += `<td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; width: ${sizeColWidth}%; font-size: 11px;">${total}</td>`;
        });

        html += `
                            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; width: 6%; font-size: 11px;">${grandTotal}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render packing list summary (Step 3)
     */
    static renderSummary() {
        const container = document.getElementById('summaryContent');
        const allSizes = app.getAllUniqueSizes();
        const pos = app.getPOsSummary();

        // Check if we have any POs
        if (pos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No purchase orders to summarize. Go to Step 2 to add POs.</p>';
            return;
        }

        let html = `
            <div class="summary-container">
                <h3 class="summary-section-title">Summary by PO and Destination</h3>
                
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>S.NO</th>
                            <th>PO NUMBER</th>
                            <th>FCID</th>
                            <th>DESTINATION</th>
                            ${allSizes.map(size => `<th>${size}</th>`).join('')}
                            <th>TOTAL</th>
                            <th>No of Box</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pos.map((po, idx) => {
                            const rowTotal = po.items.reduce((sum, item) => sum + item.totalQty, 0);
                            const fcids = [...new Set(po.items.map(item => item.fcid))].join(', ');
                            
                            return `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${po.poNumber}</td>
                                    <td>${fcids}</td>
                                    <td>${po.deliveredTo}</td>
                                    ${allSizes.map(size => {
                                        const qty = app.getTotalQtyForSize(po, size);
                                        return `<td>${qty > 0 ? qty : ''}</td>`;
                                    }).join('')}
                                    <td><strong>${rowTotal}</strong></td>
                                    <td>${po.cartonCount}</td>
                                </tr>
                            `;
                        }).join('')}
                        <tr class="total-row">
                            <td colspan="4">Total Offered Quantity</td>
                            ${allSizes.map(size => {
                                const total = pos.reduce((sum, po) => sum + app.getTotalQtyForSize(po, size), 0);
                                return `<td>${total > 0 ? total : ''}</td>`;
                            }).join('')}
                            <td>${pos.reduce((sum, po) => sum + po.items.reduce((itemSum, item) => itemSum + item.totalQty, 0), 0)}</td>
                            <td>${pos.reduce((sum, po) => sum + po.cartonCount, 0)}</td>
                        </tr>
                    </tbody>
                </table>

                <h3 class="summary-section-title">Size Table</h3>

                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>SIZE</th>
                            <th>Po Quantity</th>
                            <th>Packing Quantity</th>
                            <th>Short Quantity</th>
                            <th>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allSizes.map(size => {
                            let poQty = 0;
                            let packingQty = 0;

                            // Calculate PO quantity
                            pos.forEach(po => {
                                poQty += app.getTotalQtyForSize(po, size);
                            });

                            // Calculate packing quantity
                            pos.forEach((po, idx) => {
                                packingQty += app.getTotalPackedQty(idx, size);
                            });

                            const shortQty = poQty - packingQty;

                            return `
                                <tr>
                                    <td><strong>${size}</strong></td>
                                    <td>${poQty}</td>
                                    <td>${packingQty}</td>
                                    <td style="color: ${shortQty > 0 ? '#e74c3c' : '#27ae60'};">${shortQty}</td>
                                    <td><strong>${poQty}</strong></td>
                                </tr>
                            `;
                        }).join('')}
                        <tr class="total-row">
                            <td>TOTAL</td>
                            <td>${pos.reduce((sum, po) => sum + po.items.reduce((itemSum, item) => itemSum + item.totalQty, 0), 0)}</td>
                            <td>${pos.reduce((sum, po, idx) => sum + allSizes.reduce((sizeSum, size) => sizeSum + app.getTotalPackedQty(idx, size), 0), 0)}</td>
                            <td>${pos.reduce((sum, po, idx) => sum + allSizes.reduce((sizeSum, size) => sizeSum + app.getShortQty(idx, size), 0), 0)}</td>
                            <td><strong>${pos.reduce((sum, po) => sum + po.items.reduce((itemSum, item) => itemSum + item.totalQty, 0), 0)}</strong></td>
                        </tr>
                    </tbody>
                </table>

                <div class="summary-info">
                    <div class="summary-info-item">
                        <div class="summary-info-label">STYLE NO</div>
                        <div class="summary-info-value">${app.headerData.style}</div>
                    </div>
                    <div class="summary-info-item">
                        <div class="summary-info-label">COLOR</div>
                        <div class="summary-info-value">${app.headerData.color}</div>
                    </div>
                    <div class="summary-info-item">
                        <div class="summary-info-label">MRP</div>
                        <div class="summary-info-value">₹ ${app.headerData.mrp}</div>
                    </div>
                    <div class="summary-info-item">
                        <div class="summary-info-label">BUYER</div>
                        <div class="summary-info-value">${app.headerData.buyer}</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Helper: Generate number sequence
     */
    static generateNumberSequence(count) {
        return Array.from({ length: count }, (_, i) => i + 1);
    }

    /**
     * Helper: Generate packing list rows
     */
    static generatePackingListRows(po, cartons, sizes) {
        let html = '';
        cartons.forEach((carton, cartonIdx) => {
            sizes.forEach(size => {
                const qty = carton[size] || 0;
                if (qty > 0) {
                    const fcid = app.getFCIDForSize(po, size);
                    html += `
                        <tr>
                            <td>${cartonIdx + 1}</td>
                            <td>${cartonIdx + 1}</td>
                            <td>${fcid}</td>
                            <td>${app.headerData.style}</td>
                            <td>${size}</td>
                            <td>${qty}</td>
                        </tr>
                    `;
                }
            });
        });
        return html;
    }

    /**
     * Helper: Format address with line breaks
     */
    static formatAddress(address) {
        return address.split('\n').join('<br>');
    }

    /**
     * Attach listeners to PO list buttons
     */
    static attachPOListeners() {
        document.querySelectorAll('.edit-po-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const poIndex = parseInt(e.target.dataset.poIndex);
                UIRenderer.renderPOForm(poIndex);
                UIModals.openPOModal();
            });
        });

        document.querySelectorAll('.allocate-carton-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const poIndex = parseInt(e.target.dataset.poIndex);
                
                const po = app.getPO(poIndex);
                document.getElementById('cartonPoInfo').textContent = po.poNumber;
                
                // Populate addresses
                const toAddress = '\n' + po.deliveryAddress;
                const fromAddress = app.headerData.vendor + '\n' + app.headerData.vendorAddress;
                document.getElementById('toAddress').value = toAddress;
                document.getElementById('fromAddress').value = fromAddress;
                
                UIRenderer.renderCartons(poIndex);
                currentPoIndex = poIndex;
                UIModals.openCartonModal();
            });
        });

        document.querySelectorAll('.remove-po-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const poIndex = parseInt(e.target.dataset.poIndex);
                if (confirm('Are you sure you want to remove this PO?')) {
                    app.removePO(poIndex);
                    UIRenderer.renderPOList();
                }
            });
        });
    }

    /**
     * Attach toggle listeners for expanding/collapsing PO details
     */
    static attachPOToggleListeners() {
        document.querySelectorAll('.btn-toggle-po').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const poIndex = parseInt(e.target.dataset.poIndex);
                const poDetails = document.querySelector(`.po-details[data-po-index="${poIndex}"]`);
                
                if (poDetails.style.display === 'none') {
                    // Expand
                    poDetails.style.display = 'block';
                    e.target.textContent = '▼';
                } else {
                    // Collapse
                    poDetails.style.display = 'none';
                    e.target.textContent = '▶';
                }
            });
        });
    }

    /**
     * Attach listeners to item inputs
     */
    static attachItemListeners(po) {
        document.getElementById('addItemBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const itemsBody = document.getElementById('itemsBody');
            const newIndex = itemsBody.querySelectorAll('tr').length;
            itemsBody.innerHTML += UIRenderer.renderItemRow(newIndex);
            this.attachItemListeners(po);
        });

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.target.closest('tr').remove();
            });
        });

        // Auto-calculate total qty
        document.querySelectorAll('.item-billed-qty, .item-free-qty').forEach(input => {
            input.addEventListener('change', (e) => {
                const row = e.target.closest('tr');
                const billed = parseInt(row.querySelector('.item-billed-qty').value) || 0;
                const free = parseInt(row.querySelector('.item-free-qty').value) || 0;
                row.querySelector('.item-total-qty').value = billed + free;
            });
        });
    }

    /**
     * Attach listeners to carton inputs
     */
    static attachCartonListeners(poIndex) {
        // Remove old listener by cloning and replacing the button
        const oldBtn = document.getElementById('addCartonBtn');
        if (oldBtn) {
            const newBtn = oldBtn.cloneNode(true);
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        }
        
        // Attach fresh listener to the cloned button
        const btn = document.getElementById('addCartonBtn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                app.addCarton(poIndex);
                UIRenderer.renderCartons(poIndex);
            });
        }

        document.querySelectorAll('.remove-carton-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cartonIdx = parseInt(e.target.dataset.cartonIndex);
                if (confirm('Remove this carton?')) {
                    app.removeCarton(poIndex, cartonIdx);
                    UIRenderer.renderCartons(poIndex);
                }
            });
        });

        document.querySelectorAll('.carton-qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const cartonIdx = parseInt(e.target.dataset.cartonIndex);
                const size = e.target.dataset.size;
                const qty = parseInt(e.target.value) || 0;
                app.updateCartonQuantity(poIndex, cartonIdx, size, qty);
                UIRenderer.renderCartons(poIndex);
            });
        });

        // "All" button - add all remaining quantity
        document.querySelectorAll('.add-all-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cartonIdx = parseInt(e.target.dataset.cartonIndex);
                const size = e.target.dataset.size;
                const po = app.getPO(poIndex);
                const orderedQty = app.getTotalQtyForSize(po, size);
                const remainingQty = orderedQty - app.getTotalPackedQty(poIndex, size);
                app.updateCartonQuantity(poIndex, cartonIdx, size, remainingQty);
                UIRenderer.renderCartons(poIndex);
            });
        });

        // "Override" button - enable editing when remaining qty is 0
        document.querySelectorAll('.override-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cartonIdx = parseInt(e.target.dataset.cartonIndex);
                const size = e.target.dataset.size;
                const input = document.querySelector(`.carton-qty-input[data-carton-index="${cartonIdx}"][data-size="${size}"]`);
                if (input) {
                    input.disabled = false;
                    input.dataset.overridden = 'true';
                    input.focus();
                }
            });
        });

        document.getElementById('generateAllBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const toAddress = document.getElementById('toAddress').value || '\n' + app.getPO(poIndex).deliveryAddress;
            const fromAddress = document.getElementById('fromAddress').value || app.headerData.vendor + '\n' + app.headerData.vendorAddress;
            app.setCartonAddresses(poIndex, toAddress, fromAddress);
            
            // Generate both carton slips and packing list
            UIRenderer.renderCartonSlips(poIndex);
            UIRenderer.renderPackingList(poIndex);
            UIModals.closeCartonModal();
            
            // Show carton slips first
            UIModals.openCartonSlipsModal();
            
            // After 1 second, also show packing list in background (user can switch tabs)
            setTimeout(() => {
                console.log('Both Carton Slips and Packing List have been generated. You can print them now.');
            }, 500);
        });
    }

    /**
     * Render Packing List Summary for Step 3
     */
    static renderPackingListSummary() {
        const pos = app.getPOsSummary();
        const container = document.getElementById('summaryContent');

        if (pos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No purchase orders added yet.</p>';
            return;
        }

        // Get all unique sizes across all POs
        const allSizes = new Set();
        pos.forEach(po => {
            po.items.forEach(item => {
                if (item.size) allSizes.add(item.size);
            });
        });
        const sizesList = Array.from(allSizes).sort();

        // Build summary table
        let html = '<div id="summaryTable" class="summary-section">';
        html += '<h3 style="text-align: center; margin-bottom: 10px; margin-top: 0; font-size: 16px;">PACKING LIST SUMMARY</h3>';

        // Header row 1 - Title
        html += '<table class="summary-data-table" style="margin-bottom: 15px; font-size: 11px;">';
        html += '<thead>';
        
        // Row 2-3: Headers
        html += '<tr style="background-color: #d0d0d0; color: #000; font-weight: bold;">';
        html += '<th rowspan="2" style="border: 1px solid #999; padding: 6px 4px;">S.No</th>';
        html += '<th rowspan="2" style="border: 1px solid #999; padding: 6px 4px;">PO Number</th>';
        html += '<th colspan="2" style="border: 1px solid #999; text-align: center; padding: 6px 4px;">FCID / DESTINATION</th>';
        
        // Size columns header
        sizesList.forEach(size => {
            html += `<th style="border: 1px solid #999; text-align: center; padding: 6px 4px; font-weight: bold;">${size}</th>`;
        });
        
        html += '<th rowspan="2" style="border: 1px solid #999; padding: 6px 4px;">Total</th>';
        html += '<th rowspan="2" style="border: 1px solid #999; padding: 6px 4px;">No of Box</th>';
        html += '</tr>';

        // Row 3: FCID values and sizes
        html += '<tr style="background-color: #e8e8e8; color: #000; font-weight: bold;">';
        html += '<th style="border: 1px solid #999; padding: 6px 4px;">FCID</th>';
        html += '<th style="border: 1px solid #999; padding: 6px 4px;">Delivered To</th>';
        
        sizesList.forEach(size => {
            const fcid = this.getFCIDForSize(pos[0], size);
            html += `<th style="border: 1px solid #999; text-align: center; padding: 6px 4px; font-size: 10px;"><strong>${fcid || '-'}</strong></th>`;
        });
        
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
            
            // Sum quantities for this PO
            cartons.forEach(carton => {
                sizesList.forEach(size => {
                    const qty = carton[size] || 0;
                    poTotalBySize[size] += qty;
                });
            });

            const poTotal = sizesList.reduce((sum, size) => sum + (poTotalBySize[size] || 0), 0);
            
            html += '<tr style="border: 1px solid #ddd; padding: 4px; font-size: 11px;">';
            html += `<td style="border: 1px solid #ddd; font-weight: bold; padding: 4px 2px;">${poIndex + 1}</td>`;
            html += `<td style="border: 1px solid #ddd; padding: 4px 2px;">${po.poNumber}</td>`;
            html += `<td style="border: 1px solid #ddd; padding: 4px 2px; font-size: 10px;">${po.items[0]?.fcid || '-'}</td>`;
            html += `<td style="border: 1px solid #ddd; padding: 4px 2px;">${po.deliveredTo}</td>`;
            
            sizesList.forEach(size => {
                const qty = poTotalBySize[size] || 0;
                html += `<td style="border: 1px solid #ddd; text-align: center; padding: 4px 2px;">${qty > 0 ? qty : ''}</td>`;
                poTotalBySize[size] && (grandTotalBySize[size] += qty);
            });
            
            html += `<td style="border: 1px solid #ddd; text-align: center; font-weight: bold; padding: 4px 2px;">${poTotal}</td>`;
            html += `<td style="border: 1px solid #ddd; text-align: center; font-weight: bold; background-color: #ffffcc; padding: 4px 2px;">${cartons.length}</td>`;
            html += '</tr>';
            
            grandTotal += poTotal;
        });

        // Total row
        html += '<tr style="background-color: #d3d3d3; font-weight: bold; border: 1px solid #999; font-size: 11px;">';
        html += '<td colspan="4" style="border: 1px solid #999; text-align: right; padding: 4px 2px;">TOTAL QTY</td>';
        
        sizesList.forEach(size => {
            html += `<td style="border: 1px solid #999; text-align: center; padding: 4px 2px;">${grandTotalBySize[size] || 0}</td>`;
        });
        
        html += `<td style="border: 1px solid #999; text-align: center; padding: 4px 2px; font-weight: bold;">${grandTotal}</td>`;
        html += '<td style="border: 1px solid #999;"></td>';
        html += '</tr>';

        html += '</tbody>';
        html += '</table>';

        // Second matrix - Size analysis
        html += '<div style="margin-top: 15px;">';
        html += '<table class="summary-data-table" style="font-size: 11px;">';
        html += '<thead>';
        html += '<tr style="background-color: #d0d0d0; color: #000; font-weight: bold;">';
        html += '<th colspan="4" style="border: 1px solid #999; text-align: center; padding: 6px 4px;">SIZE ANALYSIS</th>';
        sizesList.forEach(size => {
            html += `<th style="border: 1px solid #999; text-align: center; padding: 6px 4px; font-weight: bold;">${size}</th>`;
        });
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';

        // Size row
        html += '<tr style="border: 1px solid #ddd; font-size: 11px;">';
        html += '<td colspan="4" style="border: 1px solid #999; font-weight: bold; padding: 4px 2px;">Size</td>';
        sizesList.forEach(size => {
            html += `<td style="border: 1px solid #999; text-align: center; padding: 4px 2px;"><strong>${size}</strong></td>`;
        });
        html += '</tr>';

        // PO Qty row
        html += '<tr style="border: 1px solid #ddd;">';
        html += '<td colspan="4" style="border: 1px solid #333; font-weight: bold;">PO Qty</td>';
        sizesList.forEach(size => {
            const poQty = pos.reduce((sum, po) => {
                const qty = po.items.find(item => item.size === size)?.billedQty || 0;
                return sum + qty;
            }, 0);
            html += `<td style="border: 1px solid #ddd; text-align: center;">${poQty || 0}</td>`;
        });
        html += '</tr>';

        // Packed Qty row
        html += '<tr style="border: 1px solid #ddd;">';
        html += '<td colspan="4" style="border: 1px solid #333; font-weight: bold;">Packed Qty</td>';
        sizesList.forEach(size => {
            html += `<td style="border: 1px solid #ddd; text-align: center;">${grandTotalBySize[size] || 0}</td>`;
        });
        html += '</tr>';

        // Short Qty row
        html += '<tr style="background-color: #ffe0e0; border: 1px solid #ddd;">';
        html += '<td colspan="4" style="border: 1px solid #333; font-weight: bold;">Short Qty</td>';
        sizesList.forEach(size => {
            const poQty = pos.reduce((sum, po) => {
                const qty = po.items.find(item => item.size === size)?.billedQty || 0;
                return sum + qty;
            }, 0);
            const shortQty = poQty - (grandTotalBySize[size] || 0);
            html += `<td style="border: 1px solid #ddd; text-align: center; font-weight: bold;">${shortQty > 0 ? shortQty : 0}</td>`;
        });
        html += '</tr>';

        html += '</tbody>';
        html += '</table>';
        html += '</div>';

        // Details matrix with image in merged column 4
        html += '<div style="margin-top: 40px;">';
        html += '<table class="summary-details-table" style="width: 100%; border-collapse: collapse;">';
        
        // Row 1: Style
        html += '<tr>';
        html += `<td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; width: 15%;">Style:</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 35%;">${app.headerData.style || '-'}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 15%;"></td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 35%; text-align: center; vertical-align: middle;" rowspan="6">
                    <div id="imageUploadArea" class="image-upload-area" style="width: 100%; height: 100%; min-height: 150px; margin: 0; padding: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <input type="file" id="summaryImageInput" accept="image/*" style="display: none;">
                        <div id="imagePreview" class="image-preview" style="width: 100%; height: 100%; background-size: contain; background-repeat: no-repeat; background-position: center;"></div>
                        <div id="imageUploadPrompt" class="image-upload-prompt" style="text-align: center; color: #666; pointer-events: none;">
                            <p style="margin: 0; font-size: 16px; font-weight: bold;">📷</p>
                            <small style="display: block; margin-top: 8px; color: #999; font-size: 11px;">Upload or Paste (Ctrl+V)</small>
                        </div>
                    </div>
                </td>`;
        html += '</tr>';
        
        // Row 2: Color
        html += '<tr>';
        html += `<td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; width: 15%;">Color:</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 35%;">${app.headerData.color || '-'}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 15%;"></td>`;
        html += '</tr>';
        
        // Row 3: Buyer
        html += '<tr>';
        html += `<td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; width: 15%;">Buyer:</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 35%;">${app.headerData.buyer || '-'}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 15%;"></td>`;
        html += '</tr>';
        
        // Row 4: Brand
        html += '<tr>';
        html += `<td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; width: 15%;">Brand:</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 35%;">${app.headerData.brand || '-'}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 15%;"></td>`;
        html += '</tr>';
        
        // Row 5: Season
        html += '<tr>';
        html += `<td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; width: 15%;">Season:</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 35%;">${app.headerData.season || '-'}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 15%;"></td>`;
        html += '</tr>';
        
        // Row 6: Date
        html += '<tr>';
        html += `<td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; width: 15%;">Date:</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 35%;">${app.headerData.date || '-'}</td>`;
        html += `<td style="border: 1px solid #ddd; padding: 10px; width: 15%;"></td>`;
        html += '</tr>';
        html += '</tr>';
        
        html += '</table>';
        html += '</div>';

        html += '</div>';

        container.innerHTML = html;
    }

    /**
     * Get FCID for a specific size
     */
    static getFCIDForSize(po, size) {
        const item = po.items.find(item => item.size === size);
        return item?.fcid || '-';
    }
}

let currentPoIndex = -1;
