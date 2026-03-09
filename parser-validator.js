/**
 * STRICT PARSER VALIDATION SUITE
 * Tests all requirements and functions
 */

class ParserValidator {
    /**
     * Test Suite 1: String Normalization
     */
    static testNormalization() {
        console.log('=== TEST SUITE 1: NORMALIZATION ===');
        const tests = [
            { input: '  PO  NO  ', expected: 'PO NO', name: 'Whitespace collapse' },
            { input: 'po no', expected: 'PO NO', name: 'Lowercase conversion' },
            { input: 'P.O. NO', expected: 'P.O. NO', name: 'Punctuation preserved' },
            { input: '   ', expected: '', name: 'Whitespace only' },
            { input: '', expected: '', name: 'Empty string' },
            { input: null, expected: '', name: 'Null value' },
            { input: 'PO    NUMBER', expected: 'PO NUMBER', name: 'Multiple spaces' }
        ];

        let passed = 0;
        for (const test of tests) {
            const result = ExcelParser.normalize(test.input);
            const success = result === test.expected;
            console.log(`${success ? '✓' : '✗'} ${test.name}`);
            if (success) passed++;
            if (!success) {
                console.log(`  Expected: "${test.expected}"`);
                console.log(`  Got: "${result}"`);
            }
        }

        console.log(`Passed: ${passed}/${tests.length}\n`);
        return passed === tests.length;
    }

    /**
     * Test Suite 2: Label Matching
     */
    static testLabelMatching() {
        console.log('=== TEST SUITE 2: LABEL MATCHING ===');
        const tests = [
            { cell: 'PO NO', variants: ['PO NO'], expected: true, name: 'Exact match' },
            { cell: 'po no', variants: ['PO NO'], expected: true, name: 'Case insensitive' },
            { cell: '  PO NO  ', variants: ['PO NO'], expected: true, name: 'Whitespace ignored' },
            { cell: 'PO NO', variants: ['PO NO', 'PO NUMBER'], expected: true, name: 'First variant' },
            { cell: 'PO NUMBER', variants: ['PO NO', 'PO NUMBER'], expected: true, name: 'Second variant' },
            { cell: 'PO', variants: ['PO NO'], expected: false, name: 'Partial word NO' },
            { cell: 'PO NO:', variants: ['PO NO'], expected: false, name: 'Colon breaks match' },
            { cell: 'PO NOX', variants: ['PO NO'], expected: false, name: 'Extra character NO' },
            { cell: 'PO NO X', variants: ['PO NO'], expected: false, name: 'Extra word NO' },
            { cell: 'DELIVERY TO', variants: ['DELIVERED TO', 'DELIVERY TO'], expected: true, name: 'Variant match' },
            { cell: 'ADDRESS', variants: ['ADDRESS'], expected: true, name: 'Single variant' },
            { cell: 'SIZE', variants: ['SIZE', 'FCID', 'QTY'], expected: true, name: 'Multiple variants' }
        ];

        let passed = 0;
        for (const test of tests) {
            const result = ExcelParser.isLabelMatch(test.cell, test.variants);
            const success = result === test.expected;
            console.log(`${success ? '✓' : '✗'} ${test.name}`);
            if (success) passed++;
            if (!success) {
                console.log(`  Cell: "${test.cell}"`);
                console.log(`  Expected: ${test.expected}, Got: ${result}`);
            }
        }

        console.log(`Passed: ${passed}/${tests.length}\n`);
        return passed === tests.length;
    }

    /**
     * Test Suite 3: Column Index Matching
     */
    static testColumnIndexMatching() {
        console.log('=== TEST SUITE 3: COLUMN INDEX MATCHING ===');
        const tests = [
            {
                headerRow: ['SIZE', 'FCID', 'QTY'],
                variants: ['SIZE'],
                expected: 0,
                name: 'Size at index 0'
            },
            {
                headerRow: ['SIZE', 'FCID', 'QTY'],
                variants: ['FCID', 'ITEM CODE'],
                expected: 1,
                name: 'FCID at index 1'
            },
            {
                headerRow: ['SIZE', 'FCID', 'QTY'],
                variants: ['QTY', 'QUANTITY'],
                expected: 2,
                name: 'QTY at index 2'
            },
            {
                headerRow: ['size', 'fcid', 'qty'],
                variants: ['SIZE', 'FCID'],
                expected: 0,
                name: 'Lowercase matching'
            },
            {
                headerRow: ['SIZE', 'FCID', 'QTY'],
                variants: ['BILLED', 'BILLED QTY'],
                expected: -1,
                name: 'Not found'
            },
            {
                headerRow: [],
                variants: ['SIZE'],
                expected: -1,
                name: 'Empty header row'
            }
        ];

        let passed = 0;
        for (const test of tests) {
            const result = ExcelParser.findColumnIndexStrict(test.headerRow, test.variants);
            const success = result === test.expected;
            console.log(`${success ? '✓' : '✗'} ${test.name}`);
            if (success) passed++;
            if (!success) {
                console.log(`  Expected: ${test.expected}, Got: ${result}`);
            }
        }

        console.log(`Passed: ${passed}/${tests.length}\n`);
        return passed === tests.length;
    }

    /**
     * Test Suite 4: Item Table Detection
     */
    static testItemTableDetection() {
        console.log('=== TEST SUITE 4: ITEM TABLE DETECTION ===');
        const tests = [
            {
                rows: [
                    ['PO NO', 'pin123'],
                    ['SIZE', 'FCID', 'QTY'],
                    ['M', 'ABC001', '100']
                ],
                expected: 1,
                name: 'Basic header row'
            },
            {
                rows: [
                    ['SIZE', 'FCID', 'BILLED'],
                    ['M', 'ABC001', '100']
                ],
                expected: 0,
                name: 'Header at row 0'
            },
            {
                rows: [
                    ['SIZE', 'FCID'],
                    ['M', 'ABC001']
                ],
                expected: 0,
                name: 'Minimum 2 keywords'
            },
            {
                rows: [
                    ['SIZE'],
                    ['FCID'],
                    ['M']
                ],
                expected: -1,
                name: 'Less than 2 keywords'
            },
            {
                rows: [
                    ['DESCRIPTION'],
                    ['SIZE']
                ],
                expected: -1,
                name: 'Only 1 keyword'
            },
            {
                rows: [
                    ['size', 'fcid', 'qty'],
                    ['M', 'ABC', '100']
                ],
                expected: 0,
                name: 'Lowercase keywords'
            },
            {
                rows: [
                    ['SIZE', 'FCID', 'QTY', 'BILLED', 'FREE', 'TOTAL'],
                    ['M', 'ABC', '100', '10', '5', '15']
                ],
                expected: 0,
                name: 'All 6 keywords'
            }
        ];

        let passed = 0;
        for (const test of tests) {
            const result = ExcelParser.findItemTableStart(test.rows);
            const success = result === test.expected;
            console.log(`${success ? '✓' : '✗'} ${test.name}`);
            if (success) passed++;
            if (!success) {
                console.log(`  Expected: ${test.expected}, Got: ${result}`);
            }
        }

        console.log(`Passed: ${passed}/${tests.length}\n`);
        return passed === tests.length;
    }

    /**
     * Test Suite 5: Header Value Extraction
     */
    static testHeaderValueExtraction() {
        console.log('=== TEST SUITE 5: HEADER VALUE EXTRACTION ===');
        const tests = [
            {
                name: 'Priority 1: Right cell',
                rows: [['PO NO', 'pin12345']],
                variants: ['PO NO'],
                expected: 'pin12345'
            },
            {
                name: 'Priority 2: Below cell',
                rows: [['PO NO'], ['pin12345']],
                variants: ['PO NO'],
                expected: 'pin12345'
            },
            {
                name: 'Priority 3: After colon',
                rows: [['PO NO: pin12345']],
                variants: ['PO NO'],
                expected: 'pin12345'
            },
            {
                name: 'Right cell preferred over below',
                rows: [['PO NO', 'pin12345'], ['pin99999']],
                variants: ['PO NO'],
                expected: 'pin12345'
            },
            {
                name: 'Empty if no value found',
                rows: [['PO NO'], ['']],
                variants: ['PO NO'],
                expected: ''
            },
            {
                name: 'Skip count works',
                rows: [['ADDRESS', '123 Vendor St'], ['ADDRESS', '123 Delivery St']],
                variants: ['ADDRESS'],
                skipCount: 1,
                expected: '123 Delivery St'
            },
            {
                name: 'Case insensitive match',
                rows: [['po no', 'pin12345']],
                variants: ['PO NO'],
                expected: 'pin12345'
            }
        ];

        let passed = 0;
        for (const test of tests) {
            const result = ExcelParser.findHeaderValue(
                null,
                test.rows,
                null,
                test.variants,
                test.skipCount || 0
            );
            const success = result === test.expected;
            console.log(`${success ? '✓' : '✗'} ${test.name}`);
            if (success) passed++;
            if (!success) {
                console.log(`  Expected: "${test.expected}", Got: "${result}"`);
            }
        }

        console.log(`Passed: ${passed}/${tests.length}\n`);
        return passed === tests.length;
    }

    /**
     * Test Suite 6: Item Extraction
     */
    static testItemExtraction() {
        console.log('=== TEST SUITE 6: ITEM EXTRACTION ===');
        
        const headerRow = ['SIZE', 'FCID', 'BILLED', 'FREE', 'TOTAL'];
        const rows = [
            headerRow,
            ['M', 'ABC001', '100', '10', '110'],
            ['L', 'ABC002', '50', '5', '55'],
            ['', '', '', '', '']  // Blank row to stop parsing
        ];

        const items = ExcelParser.extractItems(rows, 0);

        const tests = [
            { condition: items.length === 2, name: 'Correct number of items' },
            { condition: items[0].size === 'M', name: 'First item size' },
            { condition: items[0].fcid === 'ABC001', name: 'First item FCID' },
            { condition: items[0].billedQty === 100, name: 'First item billed qty' },
            { condition: items[0].freeQty === 10, name: 'First item free qty' },
            { condition: items[0].totalQty === 110, name: 'First item total qty' },
            { condition: items[1].size === 'L', name: 'Second item size' },
            { condition: items[1].fcid === 'ABC002', name: 'Second item FCID' },
            { condition: items[1].billedQty === 50, name: 'Second item billed qty' },
            { condition: items[1].freeQty === 5, name: 'Second item free qty' },
            { condition: items[1].totalQty === 55, name: 'Second item total qty' }
        ];

        let passed = 0;
        for (const test of tests) {
            const success = test.condition;
            console.log(`${success ? '✓' : '✗'} ${test.name}`);
            if (success) passed++;
        }

        console.log(`Passed: ${passed}/${tests.length}\n`);
        return passed === tests.length;
    }

    /**
     * Run All Tests
     */
    static runAll() {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║    STRICT EXCEL PARSER - VALIDATION TEST SUITE         ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        const results = {
            normalization: this.testNormalization(),
            labelMatching: this.testLabelMatching(),
            columnIndexing: this.testColumnIndexMatching(),
            itemTableDetection: this.testItemTableDetection(),
            headerExtraction: this.testHeaderValueExtraction(),
            itemExtraction: this.testItemExtraction()
        };

        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║                    TEST SUMMARY                        ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        
        for (const [name, passed] of Object.entries(results)) {
            const status = passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} - ${name}`);
        }

        const allPassed = Object.values(results).every(r => r === true);
        console.log('\n' + (allPassed ? 
            '✅ ALL TESTS PASSED - PARSER IS READY FOR PRODUCTION' :
            '❌ SOME TESTS FAILED - PLEASE FIX ISSUES'));
        
        return allPassed;
    }
}

// Run tests if this file is loaded in browser console
if (typeof ExcelParser !== 'undefined') {
    ParserValidator.runAll();
} else {
    console.log('ExcelParser not found - load excel-parser.js first');
}
