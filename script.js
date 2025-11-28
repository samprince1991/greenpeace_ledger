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
let currentMonth = ''; // Format: YYYY-MM for month selector
let currentMonthFormatted = ''; // Format: MonthName-YYYY for storage
let currentExpenses = [];
let currentCollections = [];
let maintenancePerFlat = CONFIG.DEFAULT_MAINTENANCE_PER_FLAT;
let activeTab = 'dashboard';
let collectionType = 'maintenance'; // 'maintenance' or 'corpus'

// ============================================
// Data Storage Layer (localStorage)
// ============================================

// Initialize storage with default data if empty
function initializeStorage() {
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.EXPENSES)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS)) {
        const defaultSettings = {
            MaintenancePerFlat: CONFIG.DEFAULT_MAINTENANCE_PER_FLAT.toString()
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
    
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

// Get expenses by month (supports both YYYY-MM and MonthName-YYYY)
function getExpensesByMonth(month) {
    const allExpenses = getAllExpenses();
    return allExpenses.filter(expense => {
        const expenseMonth = expense.month || '';
        // Check if month matches either format
        return expenseMonth === month || expenseMonth === convertMonthFormat(month);
    });
}

// Get collections by month (supports both YYYY-MM and MonthName-YYYY)
function getCollectionsByMonth(month) {
    const allCollections = getAllCollections();
    return allCollections.filter(collection => {
        const collectionMonth = collection.month || '';
        return collectionMonth === month || collectionMonth === convertMonthFormat(month);
    });
}

// Add expense
function addExpense(expenseData) {
    try {
        const expenses = getAllExpenses();
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

// Add collection
function addCollection(collectionData) {
    try {
        const collections = getAllCollections();
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

// Delete expense
function deleteExpense(id) {
    try {
        const expenses = getAllExpenses();
        const filtered = expenses.filter(exp => exp.id !== id);
        localStorage.setItem(CONFIG.STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
        return { success: true };
    } catch (error) {
        console.error('Error deleting expense:', error);
        return { success: false, error: error.message };
    }
}

// Delete collection
function deleteCollection(id) {
    try {
        const collections = getAllCollections();
        const filtered = collections.filter(col => col.id !== id);
        localStorage.setItem(CONFIG.STORAGE_KEYS.COLLECTIONS, JSON.stringify(filtered));
        return { success: true };
    } catch (error) {
        console.error('Error deleting collection:', error);
        return { success: false, error: error.message };
    }
}

// Get total collected for a specific month (maintenance only)
function getTotalCollectedForMonth(month) {
    const collections = getCollectionsByMonth(month);
    return collections
        .filter(col => col.type === 'Maintenance' || col.subType === 'maintenance')
        .reduce((sum, col) => sum + parseFloat(col.amount || 0), 0);
}

// Get total corpus for all time
function getTotalCorpusAllTime() {
    const allCollections = getAllCollections();
    return allCollections
        .filter(col => col.type === 'Corpus Amount' || col.subType === 'corpus')
        .reduce((sum, col) => sum + parseFloat(col.amount || 0), 0);
}

// ============================================
// Helper Functions
// ============================================

// Convert YYYY-MM to MonthName-YYYY
function convertMonthFormat(monthStr) {
    if (!monthStr) return '';
    if (monthStr.includes('-') && monthStr.length > 7) {
        // Already in MonthName-YYYY format
        return monthStr;
    }
    // Convert YYYY-MM to MonthName-YYYY
    const [year, month] = monthStr.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]}-${year}`;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// Format date for display (DD-MM-YYYY format)
function formatDate(dateString) {
    if (!dateString) return '-';
    
    // Handle DD-MM-YYYY format
    if (dateString.includes('-') && dateString.split('-').length === 3) {
        const parts = dateString.split('-');
        // Check if it's already in DD-MM-YYYY format
        if (parts[0].length <= 2 && parts[1].length <= 2) {
            return dateString; // Already in correct format
        }
    }
    
    // Try to parse as Date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString; // Return as-is if can't parse
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const content = document.getElementById('notification-content');
    
    content.textContent = message;
    if (type === 'error') {
        content.className = 'bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
    } else {
        content.className = 'bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    }
    
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// ============================================
// Tab Management
// ============================================

function switchTab(tabName) {
    activeTab = tabName;
    
    // Hide all views
    document.querySelectorAll('[id$="View"]').forEach(view => {
        view.classList.add('view-hidden');
    });
    
    // Show active view
    const activeView = document.getElementById(`${tabName}View`);
    if (activeView) {
        activeView.classList.remove('view-hidden');
    }
    
    // Update navigation buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        const btnTab = btn.getAttribute('data-tab');
        if (btnTab === tabName) {
            btn.className = 'nav-tab flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-indigo-600 text-white shadow-md shadow-indigo-900/20';
        } else {
            btn.className = 'nav-tab flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800';
        }
    });
    
    // Update mobile navigation buttons
    document.querySelectorAll('.mobile-nav-tab').forEach(btn => {
        const btnTab = btn.getAttribute('data-tab');
        if (btnTab === tabName) {
            btn.className = 'mobile-nav-tab w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-indigo-600 text-white';
        } else {
            btn.className = 'mobile-nav-tab w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white';
        }
    });
    
    // Close mobile menu
    closeMobileMenu();
    
    // Refresh data for the active tab
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'collections') {
        displayCollectionsTable();
    } else if (tabName === 'expenses') {
        displayExpensesTable();
    }
}

// ============================================
// Modal Management
// ============================================

function openCollectionModal() {
    const modal = document.getElementById('collectionModal');
    modal.classList.remove('hidden');
    // Reset form
    document.getElementById('collectionForm').reset();
    // Set default date using Flatpickr
    if (collectionDatePicker) {
        collectionDatePicker.setDate(new Date(), true);
    }
    collectionType = 'maintenance';
    updateCollectionTypeButtons();
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeCollectionModal() {
    const modal = document.getElementById('collectionModal');
    modal.classList.add('hidden');
}

function openExpenseModal() {
    const modal = document.getElementById('expenseModal');
    modal.classList.remove('hidden');
    // Reset form
    document.getElementById('expenseForm').reset();
    // Set default date using Flatpickr
    if (expenseDatePicker) {
        expenseDatePicker.setDate(new Date(), true);
    }
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeExpenseModal() {
    const modal = document.getElementById('expenseModal');
    modal.classList.add('hidden');
}

function updateCollectionTypeButtons() {
    const maintenanceBtn = document.getElementById('collectionTypeMaintenance');
    const corpusBtn = document.getElementById('collectionTypeCorpus');
    
    if (collectionType === 'maintenance') {
        maintenanceBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all bg-white text-indigo-600 shadow-sm';
        corpusBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all text-slate-500 hover:text-slate-700';
    } else {
        maintenanceBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all text-slate-500 hover:text-slate-700';
        corpusBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all bg-white text-amber-600 shadow-sm';
    }
}

// ============================================
// Mobile Menu
// ============================================

function openMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.remove('view-hidden');
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.add('view-hidden');
}

// ============================================
// Display Functions
// ============================================

function updateDashboard() {
    const monthKey = currentMonth;
    const expenses = getExpensesByMonth(monthKey);
    const collections = getCollectionsByMonth(monthKey);
    
    // Calculate stats
    const maintenanceIncome = collections
        .filter(c => c.type === 'Maintenance' || c.subType === 'maintenance')
        .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    
    const totalExpense = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const balance = maintenanceIncome - totalExpense;
    const allTimeCorpus = getTotalCorpusAllTime();
    
    // Update stat cards
    document.getElementById('currentBalance').textContent = formatCurrency(balance);
    document.getElementById('maintenanceCollected').textContent = formatCurrency(maintenanceIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpense);
    document.getElementById('totalCorpusFund').textContent = formatCurrency(allTimeCorpus);
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    const allExpenses = getAllExpenses();
    const allCollections = getAllCollections();
    
    // Combine and sort by date
    const allTransactions = [
        ...allExpenses.map(e => ({ ...e, transactionType: 'expense' })),
        ...allCollections.map(c => ({ ...c, transactionType: 'collection' }))
    ].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date);
        const dateB = new Date(b.createdAt || b.date);
        return dateB - dateA;
    }).slice(0, 5);
    
    if (allTransactions.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-slate-400">No transactions recorded yet.</div>';
        return;
    }
    
    container.innerHTML = allTransactions.map(t => {
        const isCollection = t.transactionType === 'collection';
        const isCorpus = t.subType === 'corpus' || t.type === 'Corpus Amount';
        const amount = parseFloat(t.amount || 0);
        
        return `
            <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="p-2 rounded-full ${isCollection ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}">
                        <i data-lucide="${isCollection ? 'trending-up' : 'trending-down'}" class="w-[18px] h-[18px]"></i>
                    </div>
                    <div>
                        <p class="font-medium text-slate-900">${t.category || t.flatNumber || '-'}</p>
                        <p class="text-xs text-slate-500">${formatDate(t.date)} • ${t.paymentMode || '-'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold ${isCollection ? 'text-emerald-600' : 'text-slate-900'}">
                        ${isCollection ? '+' : '-'} ${formatCurrency(amount)}
                    </p>
                    ${isCorpus ? '<span class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Corpus</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function displayCollectionsTable() {
    const tbody = document.getElementById('collectionsTableBody');
    const collections = getAllCollections().sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
    });
    
    if (collections.length === 0) {
        tbody.innerHTML = '<tr><td colSpan="6" class="px-6 py-8 text-center text-slate-400">No collections found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = collections.map(c => {
        const isCorpus = c.subType === 'corpus' || c.type === 'Corpus Amount';
        const flatNumber = c.flatNumber || c.category || '-';
        
        return `
            <tr class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-6 py-4 text-slate-600">${formatDate(c.date)}</td>
                <td class="px-6 py-4 font-medium text-slate-900">${flatNumber}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${isCorpus ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">
                        ${isCorpus ? 'Corpus Fund' : 'Maintenance'}
                    </span>
                </td>
                <td class="px-6 py-4 text-slate-600">${c.paymentMode || '-'}</td>
                <td class="px-6 py-4 text-right font-bold text-slate-700">${formatCurrency(parseFloat(c.amount || 0))}</td>
                <td class="px-6 py-4 text-center">
                    <button onclick="handleDeleteCollection('${c.id}')" class="text-slate-300 hover:text-rose-500 transition-colors p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function displayExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    const expenses = getAllExpenses().sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
    });
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colSpan="6" class="px-6 py-8 text-center text-slate-400">No expenses found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = expenses.map(e => {
        return `
            <tr class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-6 py-4 text-slate-600">${formatDate(e.date)}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        ${e.category || '-'}
                    </span>
                </td>
                <td class="px-6 py-4 text-slate-500 italic truncate max-w-[200px]">${e.description || '-'}</td>
                <td class="px-6 py-4 text-slate-600">${e.paymentMode || '-'}</td>
                <td class="px-6 py-4 text-right font-bold text-rose-600">${formatCurrency(parseFloat(e.amount || 0))}</td>
                <td class="px-6 py-4 text-center">
                    <button onclick="handleDeleteExpense('${e.id}')" class="text-slate-300 hover:text-rose-500 transition-colors p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ============================================
// Delete Handlers (global for onclick)
// ============================================

function handleDeleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    const result = deleteExpense(id);
    if (result.success) {
        showNotification('Expense deleted successfully!');
        displayExpensesTable();
        updateDashboard();
    } else {
        showNotification('Error deleting expense: ' + (result.error || 'Unknown error'), 'error');
    }
}

function handleDeleteCollection(id) {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    const result = deleteCollection(id);
    if (result.success) {
        showNotification('Collection deleted successfully!');
        displayCollectionsTable();
        updateDashboard();
    } else {
        showNotification('Error deleting collection: ' + (result.error || 'Unknown error'), 'error');
    }
}

// ============================================
// Form Handlers
// ============================================

function handleAddExpense(e) {
    e.preventDefault();
    
    // Get date from Flatpickr or input
    let dateValue;
    if (expenseDatePicker && expenseDatePicker.selectedDates.length > 0) {
        const selectedDate = expenseDatePicker.selectedDates[0];
        // Format as DD-MM-YYYY
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const year = selectedDate.getFullYear();
        dateValue = `${day}-${month}-${year}`;
    } else {
        dateValue = document.getElementById('expenseDate').value;
    }
    
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value;
    const paymentMode = document.querySelector('input[name="expensePaymentMode"]:checked').value;
    
    if (!dateValue || !amount || !category || !paymentMode) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    if (amount <= 0) {
        showNotification('Amount must be greater than 0.', 'error');
        return;
    }
    
    // Parse date from DD-MM-YYYY format
    const dateParts = dateValue.split('-');
    const dateObj = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
    const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const monthFormatted = convertMonthFormat(month);
    
    const expenseData = {
        month: monthFormatted,
        date: dateValue,
        category: category,
        description: description,
        amount: amount,
        paymentMode: paymentMode,
        type: 'expense'
    };
    
    const result = addExpense(expenseData);
    
    if (result.success) {
        showNotification('Expense added successfully!');
        closeExpenseModal();
        displayExpensesTable();
        updateDashboard();
    } else {
        showNotification('Error adding expense: ' + (result.error || 'Unknown error'), 'error');
    }
}

function handleAddCollection(e) {
    e.preventDefault();
    
    // Get date from Flatpickr or input
    let dateValue;
    if (collectionDatePicker && collectionDatePicker.selectedDates.length > 0) {
        const selectedDate = collectionDatePicker.selectedDates[0];
        // Format as DD-MM-YYYY
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const year = selectedDate.getFullYear();
        dateValue = `${day}-${month}-${year}`;
    } else {
        dateValue = document.getElementById('collectionDate').value;
    }
    
    const amount = parseFloat(document.getElementById('collectionAmount').value);
    const flatNumber = document.getElementById('collectionFlatNumber').value;
    const description = document.getElementById('collectionDescription').value;
    const paymentMode = document.querySelector('input[name="collectionPaymentMode"]:checked').value;
    
    if (!dateValue || !amount || !flatNumber || !paymentMode) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    if (amount <= 0) {
        showNotification('Amount must be greater than 0.', 'error');
        return;
    }
    
    // Parse date from DD-MM-YYYY format
    const dateParts = dateValue.split('-');
    const dateObj = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
    const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const monthFormatted = convertMonthFormat(month);
    
    const collectionData = {
        month: monthFormatted,
        date: dateValue,
        type: collectionType === 'corpus' ? 'Corpus Amount' : 'Maintenance',
        subType: collectionType,
        flatNumber: flatNumber,
        category: flatNumber, // For compatibility
        amount: amount,
        description: description,
        paymentMode: paymentMode,
        collectedBy: 'Admin' // Default value
    };
    
    const result = addCollection(collectionData);
    
    if (result.success) {
        showNotification('Collection added successfully!');
        closeCollectionModal();
        displayCollectionsTable();
        updateDashboard();
    } else {
        showNotification('Error adding collection: ' + (result.error || 'Unknown error'), 'error');
    }
}

// ============================================
// Month Navigation
// ============================================

function updateMonthSelector() {
    const monthInput = document.getElementById('monthSelector');
    if (monthInput) {
        monthInput.value = currentMonth;
    }
}

function changeMonth(direction) {
    if (monthSelectorPicker) {
        const currentDate = monthSelectorPicker.selectedDates[0] || new Date();
        const newDate = new Date(currentDate);
        
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        
        monthSelectorPicker.setDate(newDate, true);
    } else {
        // Fallback if Flatpickr not initialized
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        
        currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        currentMonthFormatted = convertMonthFormat(currentMonth);
        updateMonthSelector();
        updateDashboard();
    }
}

// ============================================
// Flatpickr Initialization
// ============================================

let monthSelectorPicker = null;
let collectionDatePicker = null;
let expenseDatePicker = null;

function initializeFlatpickr() {
    // Check if Flatpickr is loaded
    if (typeof flatpickr === 'undefined') {
        console.warn('Flatpickr not loaded');
        return;
    }
    
    // Initialize month selector with monthSelectPlugin
    const monthSelectorInput = document.getElementById('monthSelector');
    if (monthSelectorInput && typeof monthSelectPlugin !== 'undefined') {
        const now = new Date();
        const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        monthSelectorPicker = flatpickr(monthSelectorInput, {
            plugins: [new monthSelectPlugin({
                shorthand: false,
                dateFormat: "F Y",
                altFormat: "F Y"
            })],
            dateFormat: "Y-m",
            defaultDate: now,
            onChange: function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                    const date = selectedDates[0];
                    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    currentMonth = month;
                    currentMonthFormatted = convertMonthFormat(month);
                    updateDashboard();
                }
            }
        });
        
        // Set initial value
        monthSelectorInput.value = monthSelectorPicker.input.value;
    }
    
    // Initialize collection date picker
    const collectionDateInput = document.getElementById('collectionDate');
    if (collectionDateInput) {
        collectionDatePicker = flatpickr(collectionDateInput, {
            dateFormat: "d-m-Y",
            defaultDate: new Date(),
            allowInput: true,
            clickOpens: true,
            animate: true
        });
    }
    
    // Initialize expense date picker
    const expenseDateInput = document.getElementById('expenseDate');
    if (expenseDateInput) {
        expenseDatePicker = flatpickr(expenseDateInput, {
            dateFormat: "d-m-Y",
            defaultDate: new Date(),
            allowInput: true,
            clickOpens: true,
            animate: true
        });
    }
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeStorage();
    
    // Set current month
    const now = new Date();
    currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    currentMonthFormatted = convertMonthFormat(currentMonth);
    
    // Initialize month selector
    updateMonthSelector();
    
    // Initialize Flatpickr (this will set default dates)
    initializeFlatpickr();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize dashboard
    updateDashboard();
    displayCollectionsTable();
    displayExpensesTable();
    
    // Initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.nav-tab, .mobile-nav-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });
    
    // Modal buttons
    document.getElementById('addCollectionBtn')?.addEventListener('click', openCollectionModal);
    document.getElementById('addCollectionBtn2')?.addEventListener('click', openCollectionModal);
    document.getElementById('mobileAddCollectionBtn')?.addEventListener('click', openCollectionModal);
    document.getElementById('closeCollectionModal')?.addEventListener('click', closeCollectionModal);
    
    document.getElementById('addExpenseBtn')?.addEventListener('click', openExpenseModal);
    document.getElementById('addExpenseBtn2')?.addEventListener('click', openExpenseModal);
    document.getElementById('mobileAddExpenseBtn')?.addEventListener('click', openExpenseModal);
    document.getElementById('closeExpenseModal')?.addEventListener('click', closeExpenseModal);
    
    // Collection type buttons
    document.getElementById('collectionTypeMaintenance')?.addEventListener('click', function() {
        collectionType = 'maintenance';
        updateCollectionTypeButtons();
    });
    document.getElementById('collectionTypeCorpus')?.addEventListener('click', function() {
        collectionType = 'corpus';
        updateCollectionTypeButtons();
    });
    
    // Forms
    document.getElementById('collectionForm')?.addEventListener('submit', handleAddCollection);
    document.getElementById('expenseForm')?.addEventListener('submit', handleAddExpense);
    
    // Month navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => changeMonth('prev'));
    document.getElementById('nextMonth')?.addEventListener('click', () => changeMonth('next'));
    // Month selector change is handled by Flatpickr's onChange callback
    
    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', openMobileMenu);
    document.getElementById('closeMobileMenu')?.addEventListener('click', closeMobileMenu);
    document.getElementById('mobileMenuBackdrop')?.addEventListener('click', closeMobileMenu);
    
    // Reports download button
    document.getElementById('downloadSampleBtn')?.addEventListener('click', function() {
        showNotification('Report generation feature coming soon!');
    });
}
