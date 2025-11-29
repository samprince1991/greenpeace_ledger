// Configuration - loaded from config files
// Note: Config files must be loaded before this script
const CONFIG = {
    TOTAL_FLATS: APP_CONFIG.TOTAL_FLATS
};

// Global state
let currentMonth = ''; // Format: YYYY-MM for month selector (Dashboard)
let currentMonthFormatted = ''; // Format: MonthName-YYYY for storage
let collectionsMonth = ''; // Format: YYYY-MM for Collections tab
let expensesMonth = ''; // Format: YYYY-MM for Expenses tab
let reportsMonth = ''; // Format: YYYY-MM for Reports tab
let currentExpenses = [];
let currentCollections = [];
let activeTab = UI_CONFIG.TABS.DASHBOARD;
let collectionType = APP_CONFIG.DEFAULTS.COLLECTION_TYPE; // 'maintenance' or 'corpus'
let expenseDeductionSource = APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE; // 'maintenance' or 'corpus'

// ============================================
// Data Storage Layer (API calls to MySQL)
// ============================================

// Get all expenses
async function getAllExpenses() {
    try {
        const response = await fetch('/api/expenses');
        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }
        return await response.json();
    } catch (error) {
        console.error('Error reading expenses:', error);
        return [];
    }
}

// Get all collections
async function getAllCollections() {
    try {
        const response = await fetch('/api/collections');
        if (!response.ok) {
            throw new Error('Failed to fetch collections');
        }
        return await response.json();
    } catch (error) {
        console.error('Error reading collections:', error);
        return [];
    }
}

// Get expenses by month (expects YYYY-MM format)
async function getExpensesByMonth(month) {
    try {
        // Ensure month is in YYYY-MM format
        const monthKey = month.includes('-') && month.length > 7 ? 
            convertMonthFormatReverse(month) : month;
        const response = await fetch(`/api/expenses?month=${encodeURIComponent(monthKey)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }
        return await response.json();
    } catch (error) {
        console.error('Error reading expenses by month:', error);
        return [];
    }
}

// Get collections by month (expects YYYY-MM format)
async function getCollectionsByMonth(month) {
    try {
        // Ensure month is in YYYY-MM format
        const monthKey = month.includes('-') && month.length > 7 ? 
            convertMonthFormatReverse(month) : month;
        const response = await fetch(`/api/collections?month=${encodeURIComponent(monthKey)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch collections');
        }
        return await response.json();
    } catch (error) {
        console.error('Error reading collections by month:', error);
        return [];
    }
}

// Add expense
async function addExpense(expenseData) {
    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add expense');
        }
        
        const newExpense = await response.json();
        return { success: true, expense: newExpense };
    } catch (error) {
        console.error('Error adding expense:', error);
        return { success: false, error: error.message };
    }
}

// Add collection
async function addCollection(collectionData) {
    try {
        const response = await fetch('/api/collections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(collectionData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add collection');
        }
        
        const newCollection = await response.json();
        return { success: true, collection: newCollection };
    } catch (error) {
        console.error('Error adding collection:', error);
        return { success: false, error: error.message };
    }
}

// Delete expense
async function deleteExpense(id) {
    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete expense');
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting expense:', error);
        return { success: false, error: error.message };
    }
}

// Delete collection
async function deleteCollection(id) {
    try {
        const response = await fetch(`/api/collections/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete collection');
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting collection:', error);
        return { success: false, error: error.message };
    }
}

    // Get total collected for a specific month (maintenance only)
async function getTotalCollectedForMonth(month) {
    const collections = await getCollectionsByMonth(month);
    return collections
        .filter(col => col.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                      col.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE)
        .reduce((sum, col) => sum + parseFloat(col.amount || 0), 0);
}

// Get total corpus for all time
async function getTotalCorpusAllTime() {
    const allCollections = await getAllCollections();
    const corpusCollections = allCollections.filter(col => {
        const isCorpus = col.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE || 
                        col.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE;
        return isCorpus;
    });
    return corpusCollections.reduce((sum, col) => {
        const amount = parseFloat(col.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
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
    const monthIndex = parseInt(month) - 1;
    return `${APP_CONFIG.MONTH_NAMES[monthIndex]}-${year}`;
}

// Convert MonthName-YYYY to YYYY-MM
function convertMonthFormatReverse(monthStr) {
    if (!monthStr) return '';
    if (monthStr.match(/^\d{4}-\d{2}$/)) {
        // Already in YYYY-MM format
        return monthStr;
    }
    // Convert MonthName-YYYY to YYYY-MM
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const monthName = parts[0];
    const year = parts[1];
    const monthIndex = APP_CONFIG.MONTH_NAMES.indexOf(monthName);
    if (monthIndex === -1) return monthStr;
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat(APP_CONFIG.CURRENCY.LOCALE, {
        style: 'currency',
        currency: APP_CONFIG.CURRENCY.CODE,
        maximumFractionDigits: APP_CONFIG.CURRENCY.MAX_FRACTION_DIGITS
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
    if (type === UI_CONFIG.NOTIFICATION.TYPES.ERROR) {
        content.className = 'bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
    } else {
        content.className = 'bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    }
    
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, UI_CONFIG.NOTIFICATION.TIMEOUT);
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
    
    // Initialize month selectors if not already set
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Refresh data for the active tab
    if (tabName === UI_CONFIG.TABS.DASHBOARD) {
        updateDashboard();
    } else if (tabName === UI_CONFIG.TABS.COLLECTIONS) {
        if (!collectionsMonth) {
            collectionsMonth = defaultMonth;
            if (collectionsMonthPicker) {
                collectionsMonthPicker.setDate(now, true);
            }
        }
        displayCollectionsTable();
        updateHousesSummary();
    } else if (tabName === UI_CONFIG.TABS.EXPENSES) {
        if (!expensesMonth) {
            expensesMonth = defaultMonth;
            if (expensesMonthPicker) {
                expensesMonthPicker.setDate(now, true);
            }
        }
        displayExpensesTable();
    } else if (tabName === UI_CONFIG.TABS.REPORTS) {
        if (!reportsMonth) {
            reportsMonth = defaultMonth;
            if (reportsMonthPicker) {
                reportsMonthPicker.setDate(now, true);
            }
        }
        updateReports();
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
    collectionType = APP_CONFIG.DEFAULTS.COLLECTION_TYPE;
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
    // Reset deduction source to default
    expenseDeductionSource = APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE;
    updateExpenseDeductionButtons();
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
    
    if (collectionType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE) {
        maintenanceBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all bg-white text-indigo-600 shadow-sm';
        corpusBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all text-slate-500 hover:text-slate-700';
    } else {
        maintenanceBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all text-slate-500 hover:text-slate-700';
        corpusBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all bg-white text-amber-600 shadow-sm';
    }
}

function updateExpenseDeductionButtons() {
    const maintenanceBtn = document.getElementById('expenseDeductionMaintenance');
    const corpusBtn = document.getElementById('expenseDeductionCorpus');
    
    if (maintenanceBtn && corpusBtn) {
        if (expenseDeductionSource === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE) {
            maintenanceBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all bg-white text-indigo-600 shadow-sm';
            corpusBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all text-slate-500 hover:text-slate-700';
        } else {
            maintenanceBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all text-slate-500 hover:text-slate-700';
            corpusBtn.className = 'flex-1 py-1.5 text-sm font-medium rounded-md transition-all bg-white text-amber-600 shadow-sm';
        }
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

async function updateDashboard() {
    const monthKey = currentMonth;
    const expenses = await getExpensesByMonth(monthKey);
    const collections = await getCollectionsByMonth(monthKey);
    
    // Calculate monthly stats (for this month)
    const maintenanceIncome = collections
        .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                    c.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE)
        .reduce((sum, c) => {
            const amount = parseFloat(c.amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    
    const corpusIncome = collections
        .filter(c => {
            const isCorpus = c.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE || 
                           c.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE;
            return isCorpus;
        })
        .reduce((sum, c) => {
            const amount = parseFloat(c.amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    
    // Separate expenses by deduction source
    const maintenanceExpenses = expenses.filter(exp => {
        const isCorpus = exp.deductionSource === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                        exp.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE ||
                        exp.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
        return !isCorpus;
    });
    
    const corpusExpenses = expenses.filter(exp => {
        const isCorpus = exp.deductionSource === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                        exp.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE ||
                        exp.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
        return isCorpus;
    });
    
    const totalExpense = expenses.reduce((sum, exp) => {
        const amount = parseFloat(exp.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    // Calculate all-time stats for Current Balance
    const allCollections = await getAllCollections();
    const allExpenses = await getAllExpenses();
    
    const allTimeMaintenance = allCollections
        .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                    c.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE)
        .reduce((sum, c) => {
            const amount = parseFloat(c.amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    
    // Separate all-time expenses by deduction source
    const allTimeMaintenanceExpenses = allExpenses
        .filter(exp => {
            const isCorpus = exp.deductionSource === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                            exp.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE ||
                            exp.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
            return !isCorpus;
        })
        .reduce((sum, exp) => {
            const amount = parseFloat(exp.amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    
    // Current Balance = All-time maintenance - All-time maintenance expenses (not corpus expenses)
    const balance = allTimeMaintenance - allTimeMaintenanceExpenses;
    
    // Calculate corpus fund: all-time corpus collections - all-time corpus expenses
    const allTimeCorpus = await getTotalCorpusAllTime();
    const allTimeCorpusExpenses = allExpenses
        .filter(exp => {
            const isCorpus = exp.deductionSource === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                            exp.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE ||
                            exp.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
            return isCorpus;
        })
        .reduce((sum, exp) => {
            const amount = parseFloat(exp.amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    
    const corpusFundBalance = allTimeCorpus - allTimeCorpusExpenses;
    
    // Update stat cards
    document.getElementById('currentBalance').textContent = formatCurrency(balance);
    document.getElementById('maintenanceCollected').textContent = formatCurrency(maintenanceIncome);
    document.getElementById('corpusCollected').textContent = formatCurrency(corpusIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpense);
    document.getElementById('totalCorpusFund').textContent = formatCurrency(corpusFundBalance);
    
    // Update recent activity
    await updateRecentActivity();
}

async function updateHousesSummary() {
    const container = document.getElementById('housesSummary');
    if (!container) return;
    
    // Use collectionsMonth if on collections page, otherwise use currentMonth (for dashboard)
    const monthKey = activeTab === UI_CONFIG.TABS.COLLECTIONS && collectionsMonth ? collectionsMonth : currentMonth;
    const collections = await getCollectionsByMonth(monthKey);
    
    // Get flats from config
    const flats = FLATS_CONFIG.FLATS;
    
    // Calculate maintenance and corpus separately per flat
    const flatData = {};
    flats.forEach(flat => {
        const flatCollections = collections.filter(c => (c.flatNumber || c.category) === flat);
        
        const maintenance = flatCollections
            .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                        c.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE)
            .reduce((sum, c) => {
                const amount = parseFloat(c.amount || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
        
        const corpus = flatCollections
            .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE || 
                        c.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE)
            .reduce((sum, c) => {
                const amount = parseFloat(c.amount || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
        
        flatData[flat] = {
            maintenance: maintenance,
            corpus: corpus,
            total: maintenance + corpus
        };
    });
    
    // Generate HTML for table rows
    if (flats.length === 0) {
        container.innerHTML = '<tr><td colSpan="4" class="px-6 py-8 text-center text-slate-400">No flats found.</td></tr>';
        return;
    }
    
    container.innerHTML = flats.map(flat => {
        const data = flatData[flat];
        const hasCollection = data.total > 0;
        
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900">${flat}</td>
                <td class="px-6 py-4 text-right font-semibold ${data.maintenance > 0 ? 'text-emerald-600' : 'text-slate-400'}">
                    ${formatCurrency(data.maintenance)}
                </td>
                <td class="px-6 py-4 text-right font-semibold ${data.corpus > 0 ? 'text-amber-600' : 'text-slate-400'}">
                    ${formatCurrency(data.corpus)}
                </td>
                <td class="px-6 py-4 text-right font-bold ${hasCollection ? 'text-slate-900' : 'text-slate-400'}">
                    ${formatCurrency(data.total)}
                </td>
            </tr>
        `;
    }).join('');
}

async function updateReports() {
    const totalTbody = document.getElementById('totalReportsTableBody');
    const monthlyTbody = document.getElementById('monthlyReportsTableBody');
    
    if (!totalTbody || !monthlyTbody) return;
    
    // Get all collections (all-time data)
    const allCollections = await getAllCollections();
    
    // Get collections for selected month
    const monthKey = reportsMonth || currentMonth;
    const monthCollections = monthKey ? await getCollectionsByMonth(monthKey) : [];
    
    // Get flats from config
    const flats = FLATS_CONFIG.FLATS;
    
    // Calculate maintenance and corpus separately per flat (all-time and monthly)
    const flatDataAllTime = {};
    const flatDataMonthly = {};
    let totalMaintenanceAllTime = 0;
    let totalCorpusAllTime = 0;
    let totalMaintenanceThisMonth = 0;
    let totalCorpusThisMonth = 0;
    
    flats.forEach(flat => {
        // All-time collections
        const flatCollectionsAllTime = allCollections.filter(c => (c.flatNumber || c.category) === flat);
        
        const maintenanceAllTime = flatCollectionsAllTime
            .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                        c.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE)
            .reduce((sum, c) => {
                const amount = parseFloat(c.amount || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
        
        const corpusAllTime = flatCollectionsAllTime
            .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE || 
                        c.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE)
            .reduce((sum, c) => {
                const amount = parseFloat(c.amount || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
        
        // This month collections
        const flatCollectionsThisMonth = monthCollections.filter(c => (c.flatNumber || c.category) === flat);
        
        const maintenanceThisMonth = flatCollectionsThisMonth
            .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                        c.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE)
            .reduce((sum, c) => {
                const amount = parseFloat(c.amount || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
        
        const corpusThisMonth = flatCollectionsThisMonth
            .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE || 
                        c.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE)
            .reduce((sum, c) => {
                const amount = parseFloat(c.amount || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
        
        flatDataAllTime[flat] = {
            maintenance: maintenanceAllTime,
            corpus: corpusAllTime,
            total: maintenanceAllTime + corpusAllTime
        };
        
        flatDataMonthly[flat] = {
            maintenance: maintenanceThisMonth,
            corpus: corpusThisMonth,
            total: maintenanceThisMonth + corpusThisMonth
        };
        
        totalMaintenanceAllTime += maintenanceAllTime;
        totalCorpusAllTime += corpusAllTime;
        totalMaintenanceThisMonth += maintenanceThisMonth;
        totalCorpusThisMonth += corpusThisMonth;
    });
    
    // Generate HTML for Total Report table
    if (flats.length === 0) {
        totalTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-400">No flats found.</td></tr>';
        monthlyTbody.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-400">No flats found.</td></tr>';
        return;
    }
    
    totalTbody.innerHTML = flats.map(flat => {
        const data = flatDataAllTime[flat];
        
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900">${flat}</td>
                <td class="px-6 py-4 text-right font-semibold ${data.maintenance > 0 ? 'text-emerald-600' : 'text-slate-400'}">
                    ${formatCurrency(data.maintenance)}
                </td>
                <td class="px-6 py-4 text-right font-semibold ${data.corpus > 0 ? 'text-amber-600' : 'text-slate-400'}">
                    ${formatCurrency(data.corpus)}
                </td>
            </tr>
        `;
    }).join('');
    
    // Generate HTML for Monthly Report table
    monthlyTbody.innerHTML = flats.map(flat => {
        const data = flatDataMonthly[flat];
        
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900">${flat}</td>
                <td class="px-6 py-4 text-right font-semibold ${data.maintenance > 0 ? 'text-emerald-600' : 'text-slate-400'}">
                    ${formatCurrency(data.maintenance)}
                </td>
                <td class="px-6 py-4 text-right font-semibold ${data.corpus > 0 ? 'text-amber-600' : 'text-slate-400'}">
                    ${formatCurrency(data.corpus)}
                </td>
            </tr>
        `;
    }).join('');
    
    // Update totals for Total Report
    const totalMaintenanceAllTimeEl = document.getElementById('totalMaintenanceAllTime');
    const totalCorpusAllTimeEl = document.getElementById('totalCorpusAllTime');
    
    if (totalMaintenanceAllTimeEl) totalMaintenanceAllTimeEl.textContent = formatCurrency(totalMaintenanceAllTime);
    if (totalCorpusAllTimeEl) totalCorpusAllTimeEl.textContent = formatCurrency(totalCorpusAllTime);
    
    // Update totals for Monthly Report
    const totalMaintenanceThisMonthEl = document.getElementById('totalMaintenanceThisMonth');
    const totalCorpusThisMonthEl = document.getElementById('totalCorpusThisMonth');
    
    if (totalMaintenanceThisMonthEl) totalMaintenanceThisMonthEl.textContent = formatCurrency(totalMaintenanceThisMonth);
    if (totalCorpusThisMonthEl) totalCorpusThisMonthEl.textContent = formatCurrency(totalCorpusThisMonth);
}

async function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    const allExpenses = await getAllExpenses();
    const allCollections = await getAllCollections();
    
    // Combine and sort by date
    const allTransactions = [
        ...allExpenses.map(e => ({ ...e, transactionType: 'expense' })),
        ...allCollections.map(c => ({ ...c, transactionType: 'collection' }))
    ].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date);
        const dateB = new Date(b.createdAt || b.date);
        return dateB - dateA;
    }).slice(0, UI_CONFIG.DISPLAY_LIMITS.RECENT_ACTIVITY);
    
    if (allTransactions.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-slate-400">No transactions recorded yet.</div>';
        return;
    }
    
    container.innerHTML = allTransactions.map(t => {
        const isCollection = t.transactionType === 'collection';
        const isCorpus = t.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                        t.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
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

async function displayCollectionsTable() {
    const tbody = document.getElementById('collectionsTableBody');
    let collections = await getAllCollections();
    
    // Filter by month if a month is selected (empty string means show all)
    if (collectionsMonth && collectionsMonth !== '') {
        collections = await getCollectionsByMonth(collectionsMonth);
    }
    
    collections = collections.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
    });
    
    // Update houses summary when collections table is displayed
    await updateHousesSummary();
    
    if (collections.length === 0) {
        tbody.innerHTML = '<tr><td colSpan="6" class="px-6 py-8 text-center text-slate-400">No collections found.</td></tr>';
        return;
    }
    
    // Calculate total amount
    const totalAmount = collections.reduce((sum, c) => {
        const amount = parseFloat(c.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    // Generate table rows
    const rowsHtml = collections.map(c => {
        const isCorpus = c.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                        c.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
        const flatNumber = c.flatNumber || c.category || '-';
        
        return `
            <tr class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-6 py-4 text-slate-600">${formatDate(c.date)}</td>
                <td class="px-6 py-4 font-medium text-slate-900">${flatNumber}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${isCorpus ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">
                        ${isCorpus ? APP_CONFIG.COLLECTION_TYPES.CORPUS.DISPLAY : APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.DISPLAY}
                    </span>
                </td>
                <td class="px-6 py-4 text-slate-600">${c.paymentMode || '-'}</td>
                <td class="px-6 py-4 text-right font-bold text-slate-700">${formatCurrency(parseFloat(c.amount || 0))}</td>
                <td class="px-6 py-4 text-center">
                    ${hasPermission('delete_collection') ? `<button onclick="handleDeleteCollection('${c.id}')" class="text-slate-300 hover:text-rose-500 transition-colors p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
    
    // Add total row at the bottom
    const totalRow = `
        <tr class="bg-slate-50 border-t-2 border-slate-200">
            <td class="px-6 py-4 font-semibold text-slate-900" colspan="4">Total</td>
            <td class="px-6 py-4 text-right font-bold text-lg text-slate-900">${formatCurrency(totalAmount)}</td>
            <td class="px-6 py-4"></td>
        </tr>
    `;
    
    tbody.innerHTML = rowsHtml + totalRow;
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

async function displayExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    let expenses = await getAllExpenses();
    
    // Filter by month if a month is selected (empty string means show all)
    if (expensesMonth && expensesMonth !== '') {
        expenses = await getExpensesByMonth(expensesMonth);
    }
    
    expenses = expenses.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
    });
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colSpan="7" class="px-6 py-8 text-center text-slate-400">No expenses found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = expenses.map(e => {
        const isCorpus = e.deductionSource === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                        e.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE ||
                        e.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
        return `
            <tr class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-6 py-4 text-slate-600">${formatDate(e.date)}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        ${e.category || '-'}
                    </span>
                </td>
                <td class="px-6 py-4 text-slate-500 italic truncate" style="max-width: ${UI_CONFIG.DISPLAY_LIMITS.MAX_DESCRIPTION_LENGTH}px">${e.description || '-'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${isCorpus ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">
                        ${isCorpus ? APP_CONFIG.COLLECTION_TYPES.CORPUS.DISPLAY : APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.DISPLAY}
                    </span>
                </td>
                <td class="px-6 py-4 text-slate-600">${e.paymentMode || '-'}</td>
                <td class="px-6 py-4 text-right font-bold text-rose-600">${formatCurrency(parseFloat(e.amount || 0))}</td>
                <td class="px-6 py-4 text-center">
                    ${hasPermission('delete_expense') ? `<button onclick="handleDeleteExpense('${e.id}')" class="text-slate-300 hover:text-rose-500 transition-colors p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>` : ''}
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

async function handleDeleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    const result = await deleteExpense(id);
    if (result.success) {
        showNotification('Expense deleted successfully!');
        await displayExpensesTable();
        await updateDashboard();
    } else {
        showNotification('Error deleting expense: ' + (result.error || 'Unknown error'), 'error');
    }
}

async function handleDeleteCollection(id) {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    const result = await deleteCollection(id);
    if (result.success) {
        showNotification('Collection deleted successfully!');
        await displayCollectionsTable();
        await updateDashboard();
    } else {
        showNotification('Error deleting collection: ' + (result.error || 'Unknown error'), 'error');
    }
}

// ============================================
// Form Handlers
// ============================================

async function handleAddExpense(e) {
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
    
    const expenseData = {
        month: month,
        date: dateValue,
        category: category,
        description: description,
        amount: amount,
        paymentMode: paymentMode,
        type: 'expense',
        deductionSource: expenseDeductionSource, // 'maintenance' or 'corpus'
        subType: expenseDeductionSource // For compatibility
    };
    
    const result = await addExpense(expenseData);
    
    if (result.success) {
        showNotification('Expense added successfully!');
        closeExpenseModal();
        await displayExpensesTable();
        await updateDashboard();
    } else {
        showNotification('Error adding expense: ' + (result.error || 'Unknown error'), 'error');
    }
}

async function handleAddCollection(e) {
    e.preventDefault();
    
    // Get date from Flatpickr or input
    let dateValue;
    if (collectionDatePicker && collectionDatePicker.selectedDates.length > 0) {
        const selectedDate = collectionDatePicker.selectedDates[0];
        // Format as DD-MM-YYYY (using APP_CONFIG.DATE_FORMATS.DISPLAY format)
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
    
    const collectionData = {
        month: month,
        date: dateValue,
        type: collectionType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE ? 
              APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE : 
              APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE,
        subType: collectionType, // 'maintenance' or 'corpus'
        flatNumber: flatNumber,
        category: flatNumber, // For compatibility
        amount: amount,
        description: description,
        paymentMode: paymentMode,
        collectedBy: APP_CONFIG.DEFAULTS.COLLECTED_BY
    };
    
    const result = await addCollection(collectionData);
    
    if (result.success) {
        showNotification('Collection added successfully!');
        closeCollectionModal();
        // Force refresh dashboard and collections to show updated stats
        await displayCollectionsTable();
        await updateDashboard();
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

function changeCollectionsMonth(direction) {
    if (collectionsMonthPicker) {
        const currentDate = collectionsMonthPicker.selectedDates[0] || new Date();
        const newDate = new Date(currentDate);
        
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        
        collectionsMonthPicker.setDate(newDate, true);
    } else {
        // Fallback if Flatpickr not initialized
        const now = new Date();
        if (!collectionsMonth) {
            collectionsMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        const [year, month] = collectionsMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        
        collectionsMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        displayCollectionsTable();
        updateHousesSummary();
    }
}

function changeExpensesMonth(direction) {
    if (expensesMonthPicker) {
        const currentDate = expensesMonthPicker.selectedDates[0] || new Date();
        const newDate = new Date(currentDate);
        
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        
        expensesMonthPicker.setDate(newDate, true);
    } else {
        // Fallback if Flatpickr not initialized
        const now = new Date();
        if (!expensesMonth) {
            expensesMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        const [year, month] = expensesMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        
        expensesMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        displayExpensesTable();
    }
}

function changeReportsMonth(direction) {
    if (reportsMonthPicker) {
        const currentDate = reportsMonthPicker.selectedDates[0] || new Date();
        const newDate = new Date(currentDate);
        
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        
        reportsMonthPicker.setDate(newDate, true);
    } else {
        // Fallback if Flatpickr not initialized
        const now = new Date();
        if (!reportsMonth) {
            reportsMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        const [year, month] = reportsMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        
        reportsMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        updateReports();
    }
}

// ============================================
// Flatpickr Initialization
// ============================================

let monthSelectorPicker = null;
let collectionsMonthPicker = null;
let expensesMonthPicker = null;
let reportsMonthPicker = null;
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
            dateFormat: APP_CONFIG.DATE_FORMATS.MONTH_SELECTOR.replace('YYYY', 'Y').replace('MM', 'm'),
            defaultDate: now,
            onChange: async function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                    const date = selectedDates[0];
                    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    currentMonth = month;
                    currentMonthFormatted = convertMonthFormat(month);
                    await updateDashboard();
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
            dateFormat: APP_CONFIG.DATE_FORMATS.DATE_PICKER,
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
            dateFormat: APP_CONFIG.DATE_FORMATS.DATE_PICKER,
            defaultDate: new Date(),
            allowInput: true,
            clickOpens: true,
            animate: true
        });
    }
    
    // Initialize Collections month selector
    const collectionsMonthInput = document.getElementById('monthSelectorCollections');
    if (collectionsMonthInput && typeof monthSelectPlugin !== 'undefined') {
        const now = new Date();
        collectionsMonthPicker = flatpickr(collectionsMonthInput, {
            plugins: [new monthSelectPlugin({
                shorthand: false,
                dateFormat: "F Y",
                altFormat: "F Y"
            })],
            dateFormat: "Y-m",
            defaultDate: now,
            onChange: async function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                    const date = selectedDates[0];
                    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    collectionsMonth = month;
                    await displayCollectionsTable();
                    await updateHousesSummary();
                }
            }
        });
        collectionsMonthInput.value = collectionsMonthPicker.input.value;
    }
    
    // Initialize Expenses month selector
    const expensesMonthInput = document.getElementById('monthSelectorExpenses');
    if (expensesMonthInput && typeof monthSelectPlugin !== 'undefined') {
        const now = new Date();
        expensesMonthPicker = flatpickr(expensesMonthInput, {
            plugins: [new monthSelectPlugin({
                shorthand: false,
                dateFormat: "F Y",
                altFormat: "F Y"
            })],
            dateFormat: "Y-m",
            defaultDate: now,
            onChange: async function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                    const date = selectedDates[0];
                    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    expensesMonth = month;
                    await displayExpensesTable();
                }
            }
        });
        expensesMonthInput.value = expensesMonthPicker.input.value;
    }
    
    // Initialize Reports month selector
    const reportsMonthInput = document.getElementById('monthSelectorReports');
    if (reportsMonthInput && typeof monthSelectPlugin !== 'undefined') {
        const now = new Date();
        reportsMonthPicker = flatpickr(reportsMonthInput, {
            plugins: [new monthSelectPlugin({
                shorthand: false,
                dateFormat: "F Y",
                altFormat: "F Y"
            })],
            dateFormat: "Y-m",
            defaultDate: now,
            onChange: async function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                    const date = selectedDates[0];
                    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    reportsMonth = month;
                    await updateReports();
                }
            }
        });
        reportsMonthInput.value = reportsMonthPicker.input.value;
    }
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
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
    
    // Ensure correct tab is shown on load
    switchTab(UI_CONFIG.TABS.DASHBOARD);
    
    // Initialize dashboard
    await updateDashboard();
    await displayCollectionsTable();
    await displayExpensesTable();
    
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
        collectionType = APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE;
        updateCollectionTypeButtons();
    });
    document.getElementById('collectionTypeCorpus')?.addEventListener('click', function() {
        collectionType = APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE;
        updateCollectionTypeButtons();
    });
    
    // Expense deduction source buttons
    document.getElementById('expenseDeductionMaintenance')?.addEventListener('click', function() {
        expenseDeductionSource = APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE;
        updateExpenseDeductionButtons();
    });
    document.getElementById('expenseDeductionCorpus')?.addEventListener('click', function() {
        expenseDeductionSource = APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE;
        updateExpenseDeductionButtons();
    });
    
    // Forms
    document.getElementById('collectionForm')?.addEventListener('submit', handleAddCollection);
    document.getElementById('expenseForm')?.addEventListener('submit', handleAddExpense);
    
    // Month navigation (Dashboard)
    document.getElementById('prevMonth')?.addEventListener('click', () => changeMonth('prev'));
    document.getElementById('nextMonth')?.addEventListener('click', () => changeMonth('next'));
    // Month selector change is handled by Flatpickr's onChange callback
    
    // Month navigation (Collections)
    document.getElementById('prevMonthCollections')?.addEventListener('click', () => changeCollectionsMonth('prev'));
    document.getElementById('nextMonthCollections')?.addEventListener('click', () => changeCollectionsMonth('next'));
    
    // Month navigation (Expenses)
    document.getElementById('prevMonthExpenses')?.addEventListener('click', () => changeExpensesMonth('prev'));
    document.getElementById('nextMonthExpenses')?.addEventListener('click', () => changeExpensesMonth('next'));
    
    // Month navigation (Reports)
    document.getElementById('prevMonthReports')?.addEventListener('click', () => changeReportsMonth('prev'));
    document.getElementById('nextMonthReports')?.addEventListener('click', () => changeReportsMonth('next'));
    
    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', openMobileMenu);
    document.getElementById('closeMobileMenu')?.addEventListener('click', closeMobileMenu);
    document.getElementById('mobileMenuBackdrop')?.addEventListener('click', closeMobileMenu);
    
    // Reports download button
    document.getElementById('downloadSampleBtn')?.addEventListener('click', function() {
        showNotification('Report generation feature coming soon!');
    });
}
