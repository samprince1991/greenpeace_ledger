// Configuration
const CONFIG = {
    DEFAULT_MAINTENANCE_PER_FLAT: 2000,
    TOTAL_FLATS: 8,
    STORAGE_KEYS: {
        EXPENSES: 'apartment_maintenance_expenses',
        SETTINGS: 'apartment_maintenance_settings',
        COLLECTIONS: 'apartment_maintenance_collections'
    }
};

// Global state
let currentMonth = '';
let currentExpenses = [];
let maintenancePerFlat = CONFIG.DEFAULT_MAINTENANCE_PER_FLAT;

// ============================================
// Data Storage Layer (localStorage)
// ============================================

// Initialize storage with default data if empty
function initializeStorage() {
    // Initialize expenses if not exists
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.EXPENSES)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    }
    
    // Initialize settings if not exists
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS)) {
        const defaultSettings = {
            MaintenancePerFlat: CONFIG.DEFAULT_MAINTENANCE_PER_FLAT.toString()
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
    
    // Initialize collections if not exists
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.COLLECTIONS)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.COLLECTIONS, JSON.stringify([]));
    }
}

// Get all expenses
function getAllExpenses() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.EXPENSES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading expenses:', error);
        return [];
    }
}

// Get expenses by month
function getExpensesByMonth(month) {
    const allExpenses = getAllExpenses();
    return allExpenses.filter(expense => expense.month === month);
}

// Add expense
function addExpense(expenseData) {
    try {
        const expenses = getAllExpenses();
        // Add unique ID and timestamp
        const newExpense = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...expenseData,
            createdAt: new Date().toISOString()
        };
        expenses.push(newExpense);
        localStorage.setItem(CONFIG.STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
        return { success: true, expense: newExpense };
    } catch (error) {
        console.error('Error adding expense:', error);
        return { success: false, error: error.message };
    }
}

// Get all collections
function getAllCollections() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.COLLECTIONS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading collections:', error);
        return [];
    }
}

// Get collections by month
function getCollectionsByMonth(month) {
    const allCollections = getAllCollections();
    return allCollections.filter(collection => collection.month === month);
}

// Add collection
function addCollection(collectionData) {
    try {
        const collections = getAllCollections();
        // Add unique ID and timestamp
        const newCollection = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...collectionData,
            createdAt: new Date().toISOString()
        };
        collections.push(newCollection);
        localStorage.setItem(CONFIG.STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
        return { success: true, collection: newCollection };
    } catch (error) {
        console.error('Error adding collection:', error);
        return { success: false, error: error.message };
    }
}

// Get total collected for a specific month (sum of maintenance collections only)
function getTotalCollectedForMonth(month) {
    const collections = getCollectionsByMonth(month);
    return collections
        .filter(col => col.type === 'Maintenance')
        .reduce((sum, col) => sum + parseFloat(col.amount || 0), 0);
}

// Get total corpus for a specific month (sum of corpus collections only)
function getTotalCorpusForMonth(month) {
    const collections = getCollectionsByMonth(month);
    return collections
        .filter(col => col.type === 'Corpus Amount')
        .reduce((sum, col) => sum + parseFloat(col.amount || 0), 0);
}

// Get settings
function getSettings() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading settings:', error);
        return {};
    }
}

// Update settings
function updateSettings(key, value) {
    try {
        const settings = getSettings();
        settings[key] = value;
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return { success: true };
    } catch (error) {
        console.error('Error updating settings:', error);
        return { success: false, error: error.message };
    }
}

// Export data to JSON file
function exportToJSON() {
    try {
        const data = {
            expenses: getAllExpenses(),
            settings: getSettings(),
            collections: getAllCollections(),
            exportedAt: new Date().toISOString()
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `apartment-maintenance-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true };
    } catch (error) {
        console.error('Error exporting JSON:', error);
        return { success: false, error: error.message };
    }
}

// Import data from JSON file
function importFromJSON(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        if (data.expenses) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses));
        }
        if (data.settings) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        if (data.collections) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.COLLECTIONS, JSON.stringify(data.collections));
        }
        return { success: true };
    } catch (error) {
        console.error('Error importing JSON:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Application Logic
// ============================================

// Helper function to format month as "MonthName-YYYY"
function formatMonth(date) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
}

// Helper function to parse month from "MonthName-YYYY" format
function parseMonth(monthStr) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = monthStr.split('-');
    if (parts.length === 2) {
        const monthName = parts[0];
        const year = parseInt(parts[1]);
        const monthIndex = monthNames.indexOf(monthName);
        if (monthIndex !== -1 && !isNaN(year)) {
            return new Date(year, monthIndex, 1);
        }
    }
    return null;
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    // Initialize storage
    initializeStorage();
    
    // Set current month as default in "MonthName-YYYY" format
    const now = new Date();
    currentMonth = formatMonth(now);
    
    // Populate report month selector (keep as dropdown)
    populateMonthSelectors();
    
    // Set default month in report selector
    document.getElementById('reportMonthSelector').value = currentMonth;
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    const collectionDateEl = document.getElementById('collectionDate');
    if (collectionDateEl) {
        collectionDateEl.value = today;
    }
    
    // Initialize Flatpickr for month selection
    initializeFlatpickr();
    
    // Load settings
    loadSettings();
    
    // Load expenses and collections for current month
    loadExpenses(currentMonth);
    loadCollections(currentMonth);
    
    // Event listeners
    setupEventListeners();
}

// Initialize Flatpickr for month selection fields
function initializeFlatpickr() {
    if (typeof flatpickr === 'undefined') {
        console.warn('Flatpickr not loaded');
        return;
    }
    
    // Check if monthSelectPlugin is available
    if (typeof monthSelectPlugin === 'undefined') {
        console.warn('monthSelectPlugin not loaded');
        return;
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Format function to convert date to "MonthName-YYYY"
    const formatMonth = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${monthNames[d.getMonth()]}-${d.getFullYear()}`;
    };
    
    // Parse function to convert "MonthName-YYYY" to date
    const parseMonth = (str) => {
        if (!str) return null;
        const parts = str.split('-');
        if (parts.length === 2) {
            const monthName = parts[0];
            const year = parseInt(parts[1]);
            const monthIndex = monthNames.indexOf(monthName);
            if (monthIndex !== -1 && !isNaN(year)) {
                return new Date(year, monthIndex, 1);
            }
        }
        return null;
    };
    
    // Common Flatpickr config for month selection using monthSelect plugin
    const monthPickerConfig = {
        plugins: [
            new monthSelectPlugin({
                shorthand: false, // Show full month name (January, February, etc.)
                dateFormat: "F Y", // Format: "January 2025"
                altFormat: "F-Y" // Alternative format: "January-2025"
            })
        ],
        dateFormat: "F Y",
        defaultDate: parseMonth(currentMonth) || new Date(),
        onChange: function(selectedDates, dateStr, instance) {
            // Convert to our format "MonthName-YYYY"
            if (selectedDates.length > 0) {
                const formatted = formatMonth(selectedDates[0]);
                // Update the actual input value
                this.input.value = formatted;
            }
        }
    };
    
    // Initialize for collection month
    const collectionMonthInput = document.getElementById('collectionMonth');
    if (collectionMonthInput) {
        const initialDate = parseMonth(currentMonth) || new Date();
        const collectionPicker = flatpickr(collectionMonthInput, {
            ...monthPickerConfig,
            defaultDate: initialDate
        });
        // Set initial value in our format
        if (currentMonth) {
            collectionMonthInput.value = currentMonth;
        }
    }
    
    // Initialize for expense month
    const expenseMonthInput = document.getElementById('expenseMonth');
    if (expenseMonthInput) {
        const initialDate = parseMonth(currentMonth) || new Date();
        const expensePicker = flatpickr(expenseMonthInput, {
            ...monthPickerConfig,
            defaultDate: initialDate
        });
        // Set initial value in our format
        if (currentMonth) {
            expenseMonthInput.value = currentMonth;
        }
    }
    
    // Initialize for month selector (dashboard)
    const monthSelectorInput = document.getElementById('monthSelector');
    if (monthSelectorInput) {
        const initialDate = parseMonth(currentMonth) || new Date();
        const monthSelectorPicker = flatpickr(monthSelectorInput, {
            ...monthPickerConfig,
            defaultDate: initialDate,
            onChange: function(selectedDates, dateStr, instance) {
                // Convert to our format "MonthName-YYYY"
                if (selectedDates.length > 0) {
                    const formatted = formatMonth(selectedDates[0]);
                    // Update the actual input value
                    this.input.value = formatted;
                    // Update current month and reload data
                    currentMonth = formatted;
                    loadExpenses(currentMonth);
                    loadCollections(currentMonth);
                }
            }
        });
        // Set initial value in our format
        if (currentMonth) {
            monthSelectorInput.value = currentMonth;
        }
    }
}

// Populate report month selector with last 12 months (keep as dropdown)
function populateMonthSelectors() {
    const selector = document.getElementById('reportMonthSelector');
    if (!selector) return;
    
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = formatMonth(date);
        months.push({ value: monthStr, label: monthStr });
    }
    
    selector.innerHTML = months.map(m => 
        `<option value="${m.value}">${m.label}</option>`
    ).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Expense form submission
    document.getElementById('expenseForm').addEventListener('submit', handleAddExpense);
    
    // Collection form submission
    const collectionForm = document.getElementById('collectionForm');
    if (collectionForm) {
        collectionForm.addEventListener('submit', handleAddCollection);
    }
    
    // Month selector change is handled by Flatpickr's onChange in initializeFlatpickr()
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadExpenses(currentMonth);
        loadCollections(currentMonth);
    });
    
    // Generate report button
    document.getElementById('generateReportBtn').addEventListener('click', function() {
        const month = document.getElementById('reportMonthSelector').value;
        generateReport(month);
    });
    
    // Export CSV button
    document.getElementById('exportCSVBtn').addEventListener('click', function() {
        const month = document.getElementById('reportMonthSelector').value;
        exportToCSV(month);
    });
    
    // Export JSON button (if exists)
    const exportJSONBtn = document.getElementById('exportJSONBtn');
    if (exportJSONBtn) {
        exportJSONBtn.addEventListener('click', function() {
            const result = exportToJSON();
            if (result.success) {
                showNotification('Data exported to JSON successfully!');
            } else {
                showNotification('Error exporting JSON: ' + result.error, 'error');
            }
        });
    }
    
    // Import JSON button (if exists)
    const importJSONBtn = document.getElementById('importJSONBtn');
    if (importJSONBtn) {
        importJSONBtn.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const result = importFromJSON(event.target.result);
                    if (result.success) {
                        showNotification('Data imported successfully! Refreshing...');
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
                    } else {
                        showNotification('Error importing JSON: ' + result.error, 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
    }
    
    // Save settings button
    document.getElementById('saveSettingsBtn').addEventListener('click', handleSaveSettings);
    
    // Update total collection when maintenance amount changes
    document.getElementById('maintenanceAmount').addEventListener('input', function() {
        const amount = parseFloat(this.value) || 0;
        document.getElementById('totalCollection').textContent = (amount * CONFIG.TOTAL_FLATS).toFixed(2);
    });
}

// Load settings
function loadSettings() {
    const settings = getSettings();
    const maintenanceSetting = settings.MaintenancePerFlat;
    if (maintenanceSetting) {
        maintenancePerFlat = parseFloat(maintenanceSetting) || CONFIG.DEFAULT_MAINTENANCE_PER_FLAT;
    }
    updateSettingsUI();
}

// Update settings UI
function updateSettingsUI() {
    document.getElementById('maintenanceAmount').value = maintenancePerFlat;
    document.getElementById('totalCollection').textContent = (maintenancePerFlat * CONFIG.TOTAL_FLATS).toFixed(2);
}

// Save settings
function handleSaveSettings() {
    const amount = parseFloat(document.getElementById('maintenanceAmount').value);
    
    if (isNaN(amount) || amount < 0) {
        showNotification('Please enter a valid maintenance amount.', 'error');
        return;
    }
    
    const result = updateSettings('MaintenancePerFlat', amount.toString());
    
    if (result.success) {
        maintenancePerFlat = amount;
        updateSettingsUI();
        showNotification('Settings saved successfully!');
        // Update summary with new maintenance amount
        updateMonthlySummary();
    } else {
        showNotification('Error saving settings: ' + (result.error || 'Unknown error'), 'error');
    }
}

// Handle add expense form submission
function handleAddExpense(e) {
    e.preventDefault();
    
    const expenseData = {
        month: document.getElementById('expenseMonth').value,
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        paidBy: document.getElementById('expensePaidBy').value,
        paymentMode: document.getElementById('expensePaymentMode').value
    };
    
    // Validation
    if (!expenseData.month || !expenseData.date || !expenseData.category || 
        !expenseData.description || !expenseData.amount || !expenseData.paidBy || !expenseData.paymentMode) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }
    
    if (expenseData.amount <= 0) {
        showNotification('Amount must be greater than 0.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    
    // Add expense
    const result = addExpense(expenseData);
    
    if (result.success) {
        showNotification('Expense added successfully!');
        // Reset form
        e.target.reset();
        document.getElementById('expenseMonth').value = currentMonth;
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        
        // Reload expenses if it's the current month
        if (expenseData.month === currentMonth) {
            loadExpenses(currentMonth);
        }
    } else {
        showNotification('Error adding expense: ' + (result.error || 'Unknown error'), 'error');
    }
    
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Expense';
}

// Load expenses for a specific month
function loadExpenses(month) {
    currentMonth = month;
    currentExpenses = getExpensesByMonth(month);
    displayExpenses(currentExpenses);
    updateMonthlySummary();
}

// Load collections for a specific month
function loadCollections(month) {
    const collections = getCollectionsByMonth(month);
    displayCollections(collections);
    updateMonthlySummary();
}

// Handle add collection form submission
function handleAddCollection(e) {
    e.preventDefault();
    
    const collectionData = {
        month: document.getElementById('collectionMonth').value,
        date: document.getElementById('collectionDate').value,
        type: document.getElementById('collectionType').value,
        flatNumber: document.getElementById('collectionFlatNumber').value,
        amount: parseFloat(document.getElementById('collectionAmount').value),
        collectedBy: document.getElementById('collectionCollectedBy').value,
        paymentMode: document.getElementById('collectionPaymentMode').value
    };
    
    // Validation
    if (!collectionData.month || !collectionData.date || !collectionData.type || !collectionData.flatNumber || 
        !collectionData.amount || !collectionData.collectedBy || !collectionData.paymentMode) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }
    
    const validFlats = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'];
    if (!validFlats.includes(collectionData.flatNumber)) {
        showNotification('Please select a valid flat number.', 'error');
        return;
    }
    
    if (collectionData.amount <= 0) {
        showNotification('Amount must be greater than 0.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    
    // Add collection
    const result = addCollection(collectionData);
    
    if (result.success) {
        showNotification('Collection added successfully!');
        // Reset form
        e.target.reset();
        document.getElementById('collectionMonth').value = currentMonth;
        document.getElementById('collectionDate').value = new Date().toISOString().split('T')[0];
        
        // Reload collections if it's the current month
        if (collectionData.month === currentMonth) {
            loadCollections(currentMonth);
        }
    } else {
        showNotification('Error adding collection: ' + (result.error || 'Unknown error'), 'error');
    }
    
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Collection';
}

// Display collections in separate tables
function displayCollections(collections) {
    // Separate maintenance and corpus collections
    const maintenanceCollections = collections.filter(col => col.type === 'Maintenance');
    const corpusCollections = collections.filter(col => col.type === 'Corpus Amount');
    
    // Display maintenance collections
    const maintenanceTbody = document.getElementById('maintenanceCollectionTableBody');
    if (maintenanceTbody) {
        if (maintenanceCollections.length === 0) {
            maintenanceTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                        No maintenance collections found for selected month.
                    </td>
                </tr>
            `;
        } else {
            maintenanceTbody.innerHTML = maintenanceCollections.map(collection => {
                return `
                <tr class="hover:bg-gray-50">
                    <td class="border border-gray-300 px-4 py-3">${collection.month || '-'}</td>
                    <td class="border border-gray-300 px-4 py-3">${formatDate(collection.date)}</td>
                    <td class="border border-gray-300 px-4 py-3 font-semibold">Flat ${collection.flatNumber}</td>
                    <td class="border border-gray-300 px-4 py-3 font-semibold">₹${parseFloat(collection.amount).toFixed(2)}</td>
                    <td class="border border-gray-300 px-4 py-3">${collection.collectedBy}</td>
                    <td class="border border-gray-300 px-4 py-3">${collection.paymentMode}</td>
                </tr>
                `;
            }).join('');
        }
    }
    
    // Display corpus collections
    const corpusTbody = document.getElementById('corpusCollectionTableBody');
    if (corpusTbody) {
        if (corpusCollections.length === 0) {
            corpusTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                        No corpus collections found for selected month.
                    </td>
                </tr>
            `;
        } else {
            corpusTbody.innerHTML = corpusCollections.map(collection => {
                return `
                <tr class="hover:bg-gray-50">
                    <td class="border border-gray-300 px-4 py-3">${collection.month || '-'}</td>
                    <td class="border border-gray-300 px-4 py-3">${formatDate(collection.date)}</td>
                    <td class="border border-gray-300 px-4 py-3 font-semibold">Flat ${collection.flatNumber}</td>
                    <td class="border border-gray-300 px-4 py-3 font-semibold">₹${parseFloat(collection.amount).toFixed(2)}</td>
                    <td class="border border-gray-300 px-4 py-3">${collection.collectedBy}</td>
                    <td class="border border-gray-300 px-4 py-3">${collection.paymentMode}</td>
                </tr>
                `;
            }).join('');
        }
    }
}

// Display expenses in table
function displayExpenses(expenses) {
    const tbody = document.getElementById('expenseTableBody');
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No expenses found for selected month. Add an expense to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = expenses.map(expense => `
        <tr class="hover:bg-gray-50">
            <td class="border border-gray-300 px-4 py-3">${formatDate(expense.date)}</td>
            <td class="border border-gray-300 px-4 py-3">${expense.category}</td>
            <td class="border border-gray-300 px-4 py-3">${expense.description}</td>
            <td class="border border-gray-300 px-4 py-3 font-semibold">₹${parseFloat(expense.amount).toFixed(2)}</td>
            <td class="border border-gray-300 px-4 py-3">${expense.paidBy}</td>
            <td class="border border-gray-300 px-4 py-3">${expense.paymentMode}</td>
        </tr>
    `).join('');
}

// Update monthly summary dashboard
function updateMonthlySummary() {
    document.getElementById('selectedMonth').textContent = currentMonth || '-';
    
    // Calculate totals separately
    const totalCollected = getTotalCollectedForMonth(currentMonth); // Maintenance only
    const totalCorpus = getTotalCorpusForMonth(currentMonth); // Corpus only (separate fund, not for expenses)
    const totalExpenses = currentExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const balance = totalCollected - totalExpenses; // Balance only from maintenance, corpus is separate
    
    document.getElementById('totalCollected').textContent = `₹${totalCollected.toFixed(2)}`;
    document.getElementById('totalCorpus').textContent = `₹${totalCorpus.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
    document.getElementById('remainingBalance').textContent = `₹${balance.toFixed(2)}`;
    
    // Color code balance
    const balanceElement = document.getElementById('remainingBalance');
    if (balance < 0) {
        balanceElement.classList.add('text-red-600');
        balanceElement.classList.remove('text-gray-800');
    } else {
        balanceElement.classList.remove('text-red-600');
        balanceElement.classList.add('text-gray-800');
    }
}

// Generate monthly report
function generateReport(month) {
    const expenses = getExpensesByMonth(month);
    const totalMaintenance = getTotalCollectedForMonth(month) || 0;
    const totalCorpus = getTotalCorpusForMonth(month) || 0;
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const balance = totalMaintenance - totalExpenses; // Balance only from maintenance, corpus is separate
    
    // Update report summary
    document.getElementById('reportTotalIncome').textContent = `₹${totalMaintenance.toFixed(2)}`;
    document.getElementById('reportTotalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
    document.getElementById('reportBalanceRemaining').textContent = `₹${balance.toFixed(2)}`;
    
    // Display report table
    const tbody = document.getElementById('reportTableBody');
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No expenses found for this month.
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = expenses.map(expense => `
            <tr class="hover:bg-gray-50">
                <td class="border border-gray-300 px-4 py-3">${formatDate(expense.date)}</td>
                <td class="border border-gray-300 px-4 py-3">${expense.category}</td>
                <td class="border border-gray-300 px-4 py-3">${expense.description}</td>
                <td class="border border-gray-300 px-4 py-3 font-semibold">₹${parseFloat(expense.amount).toFixed(2)}</td>
                <td class="border border-gray-300 px-4 py-3">${expense.paidBy}</td>
                <td class="border border-gray-300 px-4 py-3">${expense.paymentMode}</td>
            </tr>
        `).join('');
    }
    
    // Show report section
    document.getElementById('reportSection').classList.remove('hidden');
    showNotification('Report generated successfully!');
}

// Export to CSV
function exportToCSV(month) {
    const expenses = getExpensesByMonth(month);
    const totalMaintenance = getTotalCollectedForMonth(month) || 0;
    const totalCorpus = getTotalCorpusForMonth(month) || 0;
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const balance = totalMaintenance - totalExpenses; // Balance only from maintenance, corpus is separate
    
    // Create CSV content
    let csv = `Monthly Report - ${month}\n\n`;
    csv += `Total Maintenance,₹${totalMaintenance.toFixed(2)}\n`;
    csv += `Total Corpus (Separate Fund),₹${totalCorpus.toFixed(2)}\n`;
    csv += `Total Expenses,₹${totalExpenses.toFixed(2)}\n`;
    csv += `Balance Remaining (Maintenance),₹${balance.toFixed(2)}\n\n`;
    csv += `Date,Category,Description,Amount,Paid By,Payment Mode\n`;
    
    expenses.forEach(expense => {
        csv += `${expense.date},${expense.category},"${expense.description}",${expense.amount},${expense.paidBy},${expense.paymentMode}\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `apartment-maintenance-${month}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('CSV exported successfully!');
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const content = document.getElementById('notification-content');
    
    // Set message and color
    content.textContent = message;
    if (type === 'error') {
        content.className = 'bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
    } else {
        content.className = 'bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    }
    
    // Show notification
    notification.classList.remove('hidden');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

