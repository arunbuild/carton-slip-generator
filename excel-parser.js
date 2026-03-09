// ====== NORMALIZE & LABEL MATCH ======
function normalize(text) {
    return String(text || "")
        .replace(/\s+/g, " ")           // Collapse whitespace
        .replace(/[.,;:!?\-]/g, "")     // Remove punctuation
        .trim()
        .toUpperCase();
}

function isLabelMatch(cellText, variants) {
    const norm = normalize(cellText);
    return variants.some(v => norm === normalize(v));
}

// ====== STRICT HEADER VALUE FINDER ======
function findHeaderValue(sheet, rows, merges, labelVariants, skipCount = 0) {
    let skipped = 0;
    
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            if (!cell) continue;
            
            const normalized = normalize(cell);
            const isMatch = labelVariants.some(v => normalized === normalize(v));
            
            if (!isMatch) continue;

            if (skipped < skipCount) {
                skipped++;
                continue;
            }

            // Labels are merged across 3 columns, value is at c+3
            if (c + 3 < row.length && row[c + 3] && String(row[c + 3]).trim() !== "") {
                const value = String(row[c + 3]).trim();
                // Avoid returning header labels as values (e.g., "Product Description")
                if (!isLabelMatch(value, ["PRODUCT DESCRIPTION", "STYLE", "STYLE CODE", "COLOR", "COLOUR"])) {
                    return value;
                }
            }
            // Fallback: try c+1 if c+3 is empty (for non-merged cases)
            if (c + 1 < row.length && row[c + 1] && String(row[c + 1]).trim() !== "") {
                const value = String(row[c + 1]).trim();
                // Avoid returning header labels as values
                if (!isLabelMatch(value, ["PRODUCT DESCRIPTION", "STYLE", "STYLE CODE", "COLOR", "COLOUR"])) {
                    return value;
                }
            }
        }
    }
    return "";
}

// ====== FIND VALUE AFTER A SPECIFIC LABEL ======
function findValueAfterLabel(rows, labelVariants, afterLabelVariants) {
    // First, find the row containing the afterLabel
    let afterLabelRow = -1;
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            if (!cell) continue;
            const normalized = normalize(cell);
            const isMatch = afterLabelVariants.some(v => normalized === normalize(v));
            if (isMatch) {
                afterLabelRow = r;
                break;
            }
        }
        if (afterLabelRow !== -1) break;
    }
    
    // Now search for the label starting from the row after afterLabel
    for (let r = afterLabelRow + 1; r < rows.length; r++) {
        const row = rows[r];
        for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            if (!cell) continue;
            
            const normalized = normalize(cell);
            const isMatch = labelVariants.some(v => normalized === normalize(v));
            
            if (!isMatch) continue;

            // Labels are merged across 3 columns, value is at c+3
            if (c + 3 < row.length && row[c + 3] && String(row[c + 3]).trim() !== "") {
                return String(row[c + 3]).trim();
            }
            // Fallback: try c+1 if c+3 is empty
            if (c + 1 < row.length && row[c + 1] && String(row[c + 1]).trim() !== "") {
                return String(row[c + 1]).trim();
            }
        }
    }
    return "";
}

// ====== FIND VENDOR ADDRESS ======
function findVendorAddress(rows) {
    // Look for "ADDRESS" label that appears in the first 20 rows
    for (let r = 0; r < Math.min(20, rows.length); r++) {
        const row = rows[r];
        for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            if (!cell) continue;
            
            const normalized = normalize(cell);
            if (normalized === "ADDRESS" || normalized === "VENDOR ADDRESS") {
                // Value should be at c+3 (merged cells) or c+1
                if (c + 3 < row.length && row[c + 3] && String(row[c + 3]).trim() !== "") {
                    return String(row[c + 3]).trim();
                }
                if (c + 1 < row.length && row[c + 1] && String(row[c + 1]).trim() !== "") {
                    return String(row[c + 1]).trim();
                }
            }
        }
    }
    return "";
}

// ====== ITEM TABLE DETECTION ======
function findItemTableStart(rows) {
    const headerKeywords = ["SIZE", "FCID", "QTY", "BILLED", "FREE", "TOTAL"];
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const rowNorm = row.map(normalize);
        const rowText = rowNorm.join(" ");
        const matchCount = headerKeywords.filter(k => rowText.includes(k)).length;
        if (matchCount >= 2) return r;
    }
    return -1;
}

// ====== ITEM EXTRACTION ======
function extractItems(rows, startRow) {
    const headerRow = rows[startRow].map(normalize);
    const idx = {
        fcid: headerRow.findIndex(c => c === "FCID"),
        size: headerRow.findIndex(c => c === "SIZE"),
        billed: headerRow.findIndex(c => c.includes("BILLED")),
        free: headerRow.findIndex(c => c.includes("FREE")),
        total: headerRow.findIndex(c => c.includes("TOTAL"))
    };
    const items = [];
    for (let r = startRow + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.every(v => v === null || v === undefined || String(v).trim() === "")) break;
        const fcid = idx.fcid >= 0 ? row[idx.fcid] : "";
        const size = idx.size >= 0 ? row[idx.size] : "";
        const billed = idx.billed >= 0 ? Number(row[idx.billed] || 0) : 0;
        const free = idx.free >= 0 ? Number(row[idx.free] || 0) : 0;
        let total = idx.total >= 0 ? Number(row[idx.total] || 0) : billed + free;
        if (!fcid && !size && !billed && !free && !total) continue;
        items.push({
            fcid: String(fcid || "").trim(),
            size: String(size || "").trim(),
            billedQty: billed,
            freeQty: free,
            totalQty: total
        });
    }
    return items;
}

// ====== SHEET EXTRACTION (HEADER + ITEMS) ======
function extractDataFromSheet(sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    const merges = sheet["!merges"] || [];
    
    const headerData = {
        poNumber: findHeaderValue(sheet, rows, merges, ["PO NO", "PO NUMBER", "P.O. NO", "P.O NO", "PO No", "PO NO."], 0),
        deliveredTo: findHeaderValue(sheet, rows, merges, ["DELIVERED TO", "DELIVERY TO"], 0),
        deliveryAddress: findValueAfterLabel(rows, ["ADDRESS"], ["DELIVERED TO", "DELIVERY TO"]),
        paymentTerms: findHeaderValue(sheet, rows, merges, ["PAYMENT TERMS", "TERMS"]),
        poDate: findHeaderValue(sheet, rows, merges, ["PO DATE", "DATE"]),
        gstNo: findHeaderValue(sheet, rows, merges, ["GST NO", "GSTIN"]),
        vendorName: findHeaderValue(sheet, rows, merges, ["VENDOR NAME", "SUPPLIER"]),
        vendorAddress: findVendorAddress(rows),
        // Style is NOT auto-filled from Excel - must be entered manually by user
        //color: findHeaderValue(sheet, rows, merges, ["COLOR", "COLOUR"])
    };
    
    const startRow = findItemTableStart(rows);
    const items = startRow !== -1 ? extractItems(rows, startRow) : [];
    return { headerData, items };
}

// ====== EXCELPARSER CLASS - PUBLIC API ======
class ExcelParser {
    static async parseFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (typeof XLSX === "undefined") {
                        resolve({ headerData: {}, items: [], error: "SheetJS library not loaded" });
                        return;
                    }
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const result = extractDataFromSheet(worksheet);
                    resolve({ ...result, error: null });
                } catch (error) {
                    resolve({ headerData: {}, items: [], error: error.message });
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }
}
