/**
 * Data Model
 * Manages the application state and core data structures
 */

class PackingApp {
    constructor() {
        // Global header data (Step 1)
        this.headerData = {
            vendor: '',
            vendorAddress: '',
            buyer: '',
            brand: '',
            style: '',
            season: '',
            color: '',
            mrp: '',
            date: ''
        };

        // Purchase orders array (Step 2)
        this.purchaseOrders = [];

        // Carton allocations per PO
        this.cartonAllocations = {}; // { poIndex: [ cartons ] }

        // Carton slip addresses
        this.cartonAddresses = {}; // { poIndex: { toAddress, fromAddress } }
    }

    /**
     * Update header data
     */
    updateHeaderData(data) {
        this.headerData = { ...this.headerData, ...data };
        // Auto-fill season from style (first 4 letters)
        if (data.style) {
            this.headerData.season = data.style.substring(0, 4);
        }
        this.saveToLocalStorage();
    }

    /**
     * Add or update a purchase order
     */
    addOrUpdatePO(poIndex, poData) {
        if (poIndex === -1) {
            // New PO
            this.purchaseOrders.push(poData);
            this.saveToLocalStorage();
            return this.purchaseOrders.length - 1;
        } else {
            // Update existing PO
            this.purchaseOrders[poIndex] = poData;
            this.saveToLocalStorage();
            return poIndex;
        }
    }

    /**
     * Get a specific purchase order
     */
    getPO(poIndex) {
        return this.purchaseOrders[poIndex] || null;
    }

    /**
     * Remove a purchase order
     */
    removePO(poIndex) {
        this.purchaseOrders.splice(poIndex, 1);
        delete this.cartonAllocations[poIndex];
        delete this.cartonAddresses[poIndex];
        this.saveToLocalStorage();
    }

    /**
     * Initialize carton allocations for a PO
     */
    initializeCartons(poIndex) {
        if (!this.cartonAllocations[poIndex]) {
            this.cartonAllocations[poIndex] = [];
        }
    }

    /**
     * Add a carton box to a PO
     */
    addCarton(poIndex) {
        this.initializeCartons(poIndex);
        const po = this.getPO(poIndex);
        const sizes = this.getUniqueSizes(po);
        
        // Create carton with empty allocations
        const carton = {};
        sizes.forEach(size => {
            carton[size] = 0;
        });
        
        this.cartonAllocations[poIndex].push(carton);
        this.saveToLocalStorage();
    }

    /**
     * Update carton allocation quantity
     */
    updateCartonQuantity(poIndex, cartonIndex, size, quantity) {
        if (this.cartonAllocations[poIndex] && this.cartonAllocations[poIndex][cartonIndex]) {
            this.cartonAllocations[poIndex][cartonIndex][size] = parseInt(quantity) || 0;
            this.saveToLocalStorage();
        }
    }

    /**
     * Get cartons for a PO
     */
    getCartons(poIndex) {
        return this.cartonAllocations[poIndex] || [];
    }

    /**
     * Remove a carton
     */
    removeCarton(poIndex, cartonIndex) {
        if (this.cartonAllocations[poIndex]) {
            this.cartonAllocations[poIndex].splice(cartonIndex, 1);
            this.saveToLocalStorage();
        }
    }

    /**
     * Set carton addresses for a PO
     */
    setCartonAddresses(poIndex, toAddress, fromAddress) {
        if (!this.cartonAddresses[poIndex]) {
            this.cartonAddresses[poIndex] = {};
        }
        this.cartonAddresses[poIndex].toAddress = toAddress;
        this.cartonAddresses[poIndex].fromAddress = fromAddress;
        this.saveToLocalStorage();
    }

    /**
     * Get carton addresses
     */
    getCartonAddresses(poIndex) {
        return this.cartonAddresses[poIndex] || { toAddress: '', fromAddress: '' };
    }

    /**
     * Get unique sizes from a PO
     */
    getUniqueSizes(po) {
        if (!po || !po.items) return [];
        const sizes = [];
        const sizeMap = new Map(); // Keep track of first occurrence and FCID
        
        // Maintain order from items array
        po.items.forEach(item => {
            if (item.size && !sizes.includes(item.size)) {
                sizes.push(item.size);
                sizeMap.set(item.size, item.fcid);
            }
        });
        
        return sizes;
    }

    /**
     * Get all unique sizes across all POs
     */
    getAllUniqueSizes() {
        const sizes = new Set();
        this.purchaseOrders.forEach(po => {
            this.getUniqueSizes(po).forEach(size => sizes.add(size));
        });
        return Array.from(sizes).sort((a, b) => {
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            return a.localeCompare(b);
        });
    }

    /**
     * Get FCID for a size in a PO
     */
    getFCIDForSize(po, size) {
        if (!po || !po.items) return '';
        const item = po.items.find(i => i.size === size);
        return item ? item.fcid : '';
    }

    /**
     * Get total quantity ordered for a size in a PO
     */
    getTotalQtyForSize(po, size) {
        if (!po || !po.items) return 0;
        const item = po.items.find(i => i.size === size);
        return item ? item.totalQty : 0;
    }

    /**
     * Calculate total packed quantity for a size in a PO
     */
    getTotalPackedQty(poIndex, size) {
        const cartons = this.getCartons(poIndex);
        let total = 0;
        cartons.forEach(carton => {
            total += carton[size] || 0;
        });
        return total;
    }

    /**
     * Calculate short quantity (ordered - packed)
     */
    getShortQty(poIndex, size) {
        const po = this.getPO(poIndex);
        const ordered = this.getTotalQtyForSize(po, size);
        const packed = this.getTotalPackedQty(poIndex, size);
        return Math.max(0, ordered - packed);
    }

    /**
     * Get total carton quantity
     */
    getCartonTotalQty(carton) {
        return Object.values(carton).reduce((sum, qty) => sum + qty, 0);
    }

    /**
     * Get all POs with carton count
     */
    getPOsSummary() {
        return this.purchaseOrders.map((po, index) => ({
            index,
            ...po,
            cartonCount: this.getCartons(index).length
        }));
    }

    /**
     * Validate Excel data
     */
    validateExcelData(style, poNumber) {
        // Check if style matches header style
        if (this.headerData.style && style !== this.headerData.style) {
            return {
                valid: false,
                message: `Style mismatch! Excel has "${style}" but header has "${this.headerData.style}"`
            };
        }

        // Check for duplicate PO numbers
        const isDuplicate = this.purchaseOrders.some(po => po.poNumber === poNumber);
        if (isDuplicate) {
            return {
                valid: false,
                message: `PO Number "${poNumber}" already exists in this session!`
            };
        }

        return { valid: true };
    }

    /**
     * Save app state to localStorage
     */
    saveToLocalStorage() {
        try {
            const state = {
                headerData: this.headerData,
                purchaseOrders: this.purchaseOrders,
                cartonAllocations: this.cartonAllocations,
                cartonAddresses: this.cartonAddresses
            };
            localStorage.setItem('packingAppState', JSON.stringify(state));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    /**
     * Load app state from localStorage
     */
    loadFromLocalStorage() {
        try {
            const state = JSON.parse(localStorage.getItem('packingAppState'));
            if (state) {
                this.headerData = state.headerData || this.headerData;
                this.purchaseOrders = state.purchaseOrders || [];
                this.cartonAllocations = state.cartonAllocations || {};
                this.cartonAddresses = state.cartonAddresses || {};
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }

    /**
     * Clear all data
     */
    clearAllData() {
        this.headerData = {
            vendor: '',
            vendorAddress: '',
            buyer: '',
            brand: '',
            style: '',
            season: '',
            color: '',
            mrp: '',
            date: ''
        };
        this.purchaseOrders = [];
        this.cartonAllocations = {};
        this.cartonAddresses = {};
        localStorage.removeItem('packingAppState');
    }
}

// Initialize app instance
const app = new PackingApp();
