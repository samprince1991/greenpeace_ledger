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
let activityMonth = ''; // Format: YYYY-MM for Activity tab
let activityType = 'all'; // 'all', 'collection', or 'expense' for Activity tab
let selectedYear = new Date().getFullYear(); // Selected year for yearly breakdown
let showMaintenanceYearly = true; // Show maintenance in yearly breakdown
let showCorpusYearly = false; // Show corpus in yearly breakdown
let currentExpenses = [];
let currentCollections = [];
let activeTab = UI_CONFIG.TABS.DASHBOARD;
let collectionType = APP_CONFIG.DEFAULTS.COLLECTION_TYPE; // 'maintenance' or 'corpus'
let expenseDeductionSource = APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE; // 'maintenance' or 'corpus'

// Chart instances
let monthlyTrendsChart = null;
let expenseCategoriesChart = null;
let incomeExpensesChart = null;

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

function switchCollectionsSubTab(subTabName) {
    // Hide all sub-tab contents
    document.querySelectorAll('.collections-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Update sub-tab button styles
    document.querySelectorAll('.collections-subtab').forEach(btn => {
        btn.className = 'collections-subtab flex-1 px-6 py-4 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all';
    });
    
    // Show selected sub-tab content
    if (subTabName === 'monthly') {
        const monthlyContent = document.getElementById('collectionsTabMonthlyContent');
        const monthlyBtn = document.getElementById('collectionsTabMonthly');
        if (monthlyContent) monthlyContent.classList.remove('hidden');
        if (monthlyBtn) {
            monthlyBtn.className = 'collections-subtab flex-1 px-6 py-4 text-sm font-semibold text-slate-700 bg-white border-b-2 border-indigo-600 transition-all relative -mb-px';
        }
        // Month filter is already inside the monthly tab content, so it will show automatically
    } else if (subTabName === 'yearly') {
        const yearlyContent = document.getElementById('collectionsTabYearlyContent');
        const yearlyBtn = document.getElementById('collectionsTabYearly');
        if (yearlyContent) yearlyContent.classList.remove('hidden');
        if (yearlyBtn) {
            yearlyBtn.className = 'collections-subtab flex-1 px-6 py-4 text-sm font-semibold text-slate-700 bg-white border-b-2 border-indigo-600 transition-all relative -mb-px';
        }
        // Initialize checkbox states
        const maintenanceCheckbox = document.getElementById('yearlyFilterMaintenance');
        const corpusCheckbox = document.getElementById('yearlyFilterCorpus');
        if (maintenanceCheckbox) maintenanceCheckbox.checked = showMaintenanceYearly;
        if (corpusCheckbox) corpusCheckbox.checked = showCorpusYearly;
        
        updateYearlyHouseBreakdown();
        // Initialize icons for chevron buttons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } else if (subTabName === 'allTime') {
        const allTimeContent = document.getElementById('collectionsTabAllTimeContent');
        const allTimeBtn = document.getElementById('collectionsTabAllTime');
        if (allTimeContent) allTimeContent.classList.remove('hidden');
        if (allTimeBtn) {
            allTimeBtn.className = 'collections-subtab flex-1 px-6 py-4 text-sm font-semibold text-slate-700 bg-white border-b-2 border-indigo-600 transition-all relative -mb-px';
        }
        // Month filter is hidden automatically when monthly tab content is hidden
    }
}

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
        
        // Initialize icons when switching to reports tab
        if (tabName === UI_CONFIG.TABS.REPORTS && typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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
        updateAllTimeHouseTotals();
        updateYearlyHouseBreakdown();
        // Default to monthly tab and show month filter
        switchCollectionsSubTab('monthly');
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
    } else if (tabName === UI_CONFIG.TABS.ACTIVITY) {
        if (!activityMonth) {
            activityMonth = defaultMonth;
            if (activityMonthPicker) {
                activityMonthPicker.setDate(now, true);
            }
        }
        displayAllActivities();
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
    document.getElementById('totalCorpusFund').textContent = formatCurrency(corpusFundBalance);
    
    // Update recent activity
    await updateRecentActivity();
    
    // Update charts
    await updateCharts();
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

async function updateYearlyHouseBreakdown() {
    const tbody = document.getElementById('yearlyHouseTotalsBody');
    const headerRow = document.getElementById('yearlyTableHeader');
    const footerRow = document.getElementById('yearlyTableFooter');
    const grandTotalEl = document.getElementById('yearlyGrandTotal');
    const yearDisplayEl = document.getElementById('selectedYearDisplay');
    const nextYearBtn = document.getElementById('nextYearCollections');
    
    if (!tbody || !headerRow || !footerRow || !grandTotalEl) return;
    
    // Update year display
    if (yearDisplayEl) {
        yearDisplayEl.textContent = selectedYear;
    }
    
    // Disable/enable next year button based on current year
    const currentYear = new Date().getFullYear();
    if (nextYearBtn) {
        if (selectedYear >= currentYear) {
            nextYearBtn.disabled = true;
            nextYearBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            nextYearBtn.disabled = false;
            nextYearBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
    
    // Get all collections
    const allCollections = await getAllCollections();
    
    // Get flats from config
    const flats = FLATS_CONFIG.FLATS;
    
    // Generate all 12 months of the selected year (January to December)
    const months = [];
    for (let i = 0; i < 12; i++) {
        const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
        const monthName = APP_CONFIG.MONTH_NAMES[i].substring(0, 3);
        months.push({
            key: monthKey,
            label: `${monthName} ${selectedYear}`
        });
    }
    
    // Clear existing month headers (if any) and insert new ones before the Total column
    const totalHeader = headerRow.querySelector('th:last-child');
    const existingMonthHeaders = headerRow.querySelectorAll('th:not(:first-child):not(:last-child)');
    existingMonthHeaders.forEach(th => th.remove());
    
    months.forEach(m => {
        const th = document.createElement('th');
        th.className = 'px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap';
        th.textContent = m.label;
        if (totalHeader) {
            totalHeader.insertAdjacentElement('beforebegin', th);
        }
    });
    
    // Calculate collections per house per month
    const flatData = {};
    const monthTotals = new Array(12).fill(0);
    let grandTotal = 0;
    
    flats.forEach(flat => {
        const flatCollections = allCollections.filter(c => (c.flatNumber || c.category) === flat);
        const monthlyAmounts = months.map((month, index) => {
            const monthCollections = flatCollections.filter(c => c.month === month.key);
            
            // Filter by type based on checkboxes
            let filteredCollections = monthCollections;
            if (!showMaintenanceYearly && !showCorpusYearly) {
                // If both are unchecked, show nothing
                filteredCollections = [];
            } else if (!showMaintenanceYearly) {
                // Show only corpus
                filteredCollections = monthCollections.filter(c => 
                    c.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE || 
                    c.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE
                );
            } else if (!showCorpusYearly) {
                // Show only maintenance
                filteredCollections = monthCollections.filter(c => 
                    c.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                    c.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE
                );
            }
            // If both are checked, show all (no filter needed)
            
            const total = filteredCollections.reduce((sum, c) => {
                const amount = parseFloat(c.amount || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            monthTotals[index] += total;
            grandTotal += total;
            return total;
        });
        
        const flatTotal = monthlyAmounts.reduce((sum, amt) => sum + amt, 0);
        
        flatData[flat] = {
            monthlyAmounts: monthlyAmounts,
            total: flatTotal
        };
    });
    
    // Generate table rows
    if (flats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" class="px-6 py-8 text-center text-slate-400">No flats found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = flats.map(flat => {
        const data = flatData[flat];
        const cells = data.monthlyAmounts.map((amount, index) => {
            const hasPayment = amount > 0;
            return `
                <td class="px-3 py-3 text-center text-sm ${hasPayment ? 'text-emerald-600 font-semibold' : 'text-slate-400'}">
                    ${formatCurrency(amount)}
                </td>
            `;
        }).join('');
        
        return `
            <tr class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200 group-hover:bg-slate-50/80">${flat}</td>
                ${cells}
                <td class="px-4 py-3 text-right font-bold text-slate-900">${formatCurrency(data.total)}</td>
            </tr>
        `;
    }).join('');
    
    // Clear existing month totals (if any) and insert new ones before the Grand Total column
    const grandTotalCell = footerRow.querySelector('td:last-child');
    const existingMonthTotals = footerRow.querySelectorAll('td:not(:first-child):not(:last-child)');
    existingMonthTotals.forEach(td => td.remove());
    
    monthTotals.forEach(total => {
        const td = document.createElement('td');
        td.className = 'px-3 py-4 text-center text-sm text-slate-900 font-semibold';
        td.textContent = formatCurrency(total);
        if (grandTotalCell) {
            grandTotalCell.insertAdjacentElement('beforebegin', td);
        }
    });
    
    // Update grand total
    grandTotalEl.textContent = formatCurrency(grandTotal);
}

async function updateAllTimeHouseTotals() {
    const tbody = document.getElementById('allTimeHouseTotalsBody');
    if (!tbody) return;
    
    // Get all collections (no month filter)
    const allCollections = await getAllCollections();
    
    // Get flats from config
    const flats = FLATS_CONFIG.FLATS;
    
    // Calculate maintenance and corpus separately per flat across all time
    const flatData = {};
    let grandTotalMaintenance = 0;
    let grandTotalCorpus = 0;
    
    flats.forEach(flat => {
        const flatCollections = allCollections.filter(c => (c.flatNumber || c.category) === flat);
        
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
        
        const total = maintenance + corpus;
        
        flatData[flat] = {
            maintenance: maintenance,
            corpus: corpus,
            total: total
        };
        
        grandTotalMaintenance += maintenance;
        grandTotalCorpus += corpus;
    });
    
    // Generate HTML for table rows
    if (flats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">No flats found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = flats.map(flat => {
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
    
    // Update footer totals
    const allTimeTotalMaintenanceEl = document.getElementById('allTimeTotalMaintenance');
    const allTimeTotalCorpusEl = document.getElementById('allTimeTotalCorpus');
    const allTimeGrandTotalEl = document.getElementById('allTimeGrandTotal');
    
    if (allTimeTotalMaintenanceEl) allTimeTotalMaintenanceEl.textContent = formatCurrency(grandTotalMaintenance);
    if (allTimeTotalCorpusEl) allTimeTotalCorpusEl.textContent = formatCurrency(grandTotalCorpus);
    if (allTimeGrandTotalEl) allTimeGrandTotalEl.textContent = formatCurrency(grandTotalMaintenance + grandTotalCorpus);
}

async function updateReports() {
    const combinedCollectionsTbody = document.getElementById('combinedCollectionsTableBody');
    const maintenanceExpensesTbody = document.getElementById('maintenanceExpensesTableBody');
    const corpusExpensesTbody = document.getElementById('corpusExpensesTableBody');
    
    if (!combinedCollectionsTbody || !maintenanceExpensesTbody || !corpusExpensesTbody) return;
    
    // Get collections and expenses for selected month
    const monthKey = reportsMonth || currentMonth;
    const monthCollections = monthKey ? await getCollectionsByMonth(monthKey) : [];
    const monthExpenses = monthKey ? await getExpensesByMonth(monthKey) : [];
    
    // Get flats from config
    const flats = FLATS_CONFIG.FLATS;
    
    // Calculate collections per flat (separated by maintenance and corpus)
    const maintenanceCollectionsData = {};
    const corpusCollectionsData = {};
    let totalMaintenanceCollections = 0;
    let totalCorpusCollections = 0;
    
    flats.forEach(flat => {
        const flatCollections = monthCollections.filter(c => (c.flatNumber || c.category) === flat);
        
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
        
        maintenanceCollectionsData[flat] = maintenance;
        corpusCollectionsData[flat] = corpus;
        totalMaintenanceCollections += maintenance;
        totalCorpusCollections += corpus;
    });
    
    // Calculate expenses by category (separated by maintenance and corpus)
    const maintenanceCategoryExpenses = {};
    const corpusCategoryExpenses = {};
    let totalMaintenanceExpenses = 0;
    let totalCorpusExpenses = 0;
    
    monthExpenses.forEach(expense => {
        const category = expense.category || 'Uncategorized';
        const amount = parseFloat(expense.amount || 0);
        if (isNaN(amount)) return;
        
        const isCorpus = expense.deductionSource === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                        expense.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE ||
                        expense.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
        
        if (isCorpus) {
            if (!corpusCategoryExpenses[category]) {
                corpusCategoryExpenses[category] = 0;
            }
            corpusCategoryExpenses[category] += amount;
            totalCorpusExpenses += amount;
        } else {
            if (!maintenanceCategoryExpenses[category]) {
                maintenanceCategoryExpenses[category] = 0;
            }
            maintenanceCategoryExpenses[category] += amount;
            totalMaintenanceExpenses += amount;
        }
    });
    
    // Generate HTML for Combined Collections table
    if (flats.length === 0) {
        combinedCollectionsTbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-slate-400">No flats found.</td></tr>';
    } else {
        // Create one row per flat with Maintenance and Corpus as columns
        combinedCollectionsTbody.innerHTML = flats.map(flat => {
            const maintenanceAmount = maintenanceCollectionsData[flat] || 0;
            const corpusAmount = corpusCollectionsData[flat] || 0;
            
            return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-4 py-4 font-medium text-slate-900">${flat}</td>
                    <td class="px-4 py-4 text-right font-semibold ${maintenanceAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}">
                        ${formatCurrency(maintenanceAmount)}
                    </td>
                    <td class="px-4 py-4 text-right font-semibold ${corpusAmount > 0 ? 'text-amber-600' : 'text-slate-400'}">
                        ${formatCurrency(corpusAmount)}
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Generate HTML for Maintenance Expenses table
    const maintenanceCategories = Object.keys(maintenanceCategoryExpenses).sort();
    if (maintenanceCategories.length === 0) {
        maintenanceExpensesTbody.innerHTML = '<tr><td colspan="2" class="px-4 py-8 text-center text-slate-400">No expenses found.</td></tr>';
    } else {
        maintenanceExpensesTbody.innerHTML = maintenanceCategories.map(category => {
            const amount = maintenanceCategoryExpenses[category];
            
            return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-4 py-4 font-medium text-slate-900">${category}</td>
                    <td class="px-4 py-4 text-right font-semibold ${amount > 0 ? 'text-red-600' : 'text-slate-400'}">
                        ${formatCurrency(amount)}
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Generate HTML for Corpus Expenses table
    const corpusCategories = Object.keys(corpusCategoryExpenses).sort();
    if (corpusCategories.length === 0) {
        corpusExpensesTbody.innerHTML = '<tr><td colspan="2" class="px-6 py-8 text-center text-slate-400">No expenses found.</td></tr>';
    } else {
        corpusExpensesTbody.innerHTML = corpusCategories.map(category => {
            const amount = corpusCategoryExpenses[category];
            
            return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-4 font-medium text-slate-900">${category}</td>
                    <td class="px-6 py-4 text-right font-semibold ${amount > 0 ? 'text-red-600' : 'text-slate-400'}">
                        ${formatCurrency(amount)}
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Update totals for Combined Collections
    const totalMaintenanceCollectionsEl = document.getElementById('totalMaintenanceCollections');
    const totalCorpusCollectionsEl = document.getElementById('totalCorpusCollections');
    
    if (totalMaintenanceCollectionsEl) totalMaintenanceCollectionsEl.textContent = formatCurrency(totalMaintenanceCollections);
    if (totalCorpusCollectionsEl) totalCorpusCollectionsEl.textContent = formatCurrency(totalCorpusCollections);
    
    // Update totals for Expenses
    const totalMaintenanceExpensesEl = document.getElementById('totalMaintenanceExpenses');
    const totalCorpusExpensesEl = document.getElementById('totalCorpusExpenses');
    
    if (totalMaintenanceExpensesEl) totalMaintenanceExpensesEl.textContent = formatCurrency(totalMaintenanceExpenses);
    if (totalCorpusExpensesEl) totalCorpusExpensesEl.textContent = formatCurrency(totalCorpusExpenses);
    
    // Calculate previous month's balance (all data up to and including previous month)
    // Get previous month key
    const currentDate = monthKey ? new Date(monthKey + '-01') : new Date();
    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all collections and expenses to calculate cumulative balance up to previous month
    const allCollections = await getAllCollections();
    const allExpenses = await getAllExpenses();
    
    // Filter collections and expenses up to and including previous month
    const prevMonthCollections = allCollections.filter(c => {
        const collectionMonth = c.month || '';
        return collectionMonth <= prevMonthKey;
    });
    
    const prevMonthExpenses = allExpenses.filter(exp => {
        const expenseMonth = exp.month || '';
        return expenseMonth <= prevMonthKey;
    });
    
    // Calculate cumulative Maintenance Collections up to previous month
    const prevMaintenanceCollections = prevMonthCollections
        .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                    c.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE)
        .reduce((sum, c) => {
            const amount = parseFloat(c.amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    
    // Calculate cumulative Maintenance Expenses up to previous month
    const prevMaintenanceExpenses = prevMonthExpenses
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
    
    // Calculate previous month's Maintenance Balance (cumulative up to previous month)
    const maintenancePreviousBalance = prevMaintenanceCollections - prevMaintenanceExpenses;
    
    // Calculate cumulative Corpus Collections up to previous month
    const prevCorpusCollections = prevMonthCollections
        .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE || 
                    c.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE)
        .reduce((sum, c) => {
            const amount = parseFloat(c.amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    
    // Calculate cumulative Corpus Expenses up to previous month
    const prevCorpusExpenses = prevMonthExpenses
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
    
    // Calculate previous month's Corpus Balance (cumulative up to previous month)
    const corpusPreviousBalance = prevCorpusCollections - prevCorpusExpenses;
    
    // Calculate current month balances including previous month's balance
    // Balance = Current Month Collections - Current Month Expenses + Previous Month Balance
    const maintenanceBalance = totalMaintenanceCollections - totalMaintenanceExpenses + maintenancePreviousBalance;
    const corpusBalance = totalCorpusCollections - totalCorpusExpenses + corpusPreviousBalance;
    
    // Update Maintenance Balance Summary (using current month data)
    const totalMaintenanceCollectionsAmountEl = document.getElementById('totalMaintenanceCollectionsAmount');
    const totalMaintenanceExpensesAmountEl = document.getElementById('totalMaintenanceExpensesAmount');
    const balanceAmountEl = document.getElementById('balanceAmount');
    const maintenanceBalanceCardEl = document.getElementById('maintenanceBalanceCard');
    const maintenancePreviousBalanceAmountEl = document.getElementById('maintenancePreviousBalanceAmount');
    const maintenancePreviousBalanceCardEl = document.getElementById('maintenancePreviousBalanceCard');
    
    if (totalMaintenanceCollectionsAmountEl) totalMaintenanceCollectionsAmountEl.textContent = formatCurrency(totalMaintenanceCollections);
    if (totalMaintenanceExpensesAmountEl) totalMaintenanceExpensesAmountEl.textContent = formatCurrency(totalMaintenanceExpenses);
    if (maintenancePreviousBalanceAmountEl) {
        maintenancePreviousBalanceAmountEl.textContent = formatCurrency(maintenancePreviousBalance);
        maintenancePreviousBalanceAmountEl.className = `text-lg font-bold ${maintenancePreviousBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
        
        if (maintenancePreviousBalanceCardEl) {
            maintenancePreviousBalanceCardEl.className = `rounded-lg p-3 ${maintenancePreviousBalance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`;
            const prevBalanceLabel = maintenancePreviousBalanceCardEl.querySelector('p.text-blue-600, p.text-emerald-600, p.text-red-600');
            if (prevBalanceLabel) {
                prevBalanceLabel.className = `text-xs mb-1 ${maintenancePreviousBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
            }
        }
    }
    if (balanceAmountEl) {
        balanceAmountEl.textContent = formatCurrency(maintenanceBalance);
        // Update color based on balance
        balanceAmountEl.className = `text-lg font-bold ${maintenanceBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
        
        // Update balance card background color
        if (maintenanceBalanceCardEl) {
            maintenanceBalanceCardEl.className = `rounded-lg p-3 ${maintenanceBalance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`;
            const balanceLabel = maintenanceBalanceCardEl.querySelector('p.text-indigo-600, p.text-emerald-600, p.text-red-600');
            if (balanceLabel) {
                balanceLabel.className = `text-xs mb-1 ${maintenanceBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
            }
        }
    }
    
    // Update Corpus Balance Summary (using current month data)
    const totalCorpusCollectionsAmountEl = document.getElementById('totalCorpusCollectionsAmount');
    const totalCorpusExpensesAmountEl = document.getElementById('totalCorpusExpensesAmount');
    const corpusBalanceAmountEl = document.getElementById('corpusBalanceAmount');
    const corpusBalanceCardEl = document.getElementById('corpusBalanceCard');
    const corpusPreviousBalanceAmountEl = document.getElementById('corpusPreviousBalanceAmount');
    const corpusPreviousBalanceCardEl = document.getElementById('corpusPreviousBalanceCard');
    
    if (totalCorpusCollectionsAmountEl) totalCorpusCollectionsAmountEl.textContent = formatCurrency(totalCorpusCollections);
    if (totalCorpusExpensesAmountEl) totalCorpusExpensesAmountEl.textContent = formatCurrency(totalCorpusExpenses);
    if (corpusPreviousBalanceAmountEl) {
        corpusPreviousBalanceAmountEl.textContent = formatCurrency(corpusPreviousBalance);
        corpusPreviousBalanceAmountEl.className = `text-lg font-bold ${corpusPreviousBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
        
        if (corpusPreviousBalanceCardEl) {
            corpusPreviousBalanceCardEl.className = `rounded-lg p-3 ${corpusPreviousBalance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`;
            const prevBalanceLabel = corpusPreviousBalanceCardEl.querySelector('p.text-blue-600, p.text-emerald-600, p.text-red-600');
            if (prevBalanceLabel) {
                prevBalanceLabel.className = `text-xs mb-1 ${corpusPreviousBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
            }
        }
    }
    if (corpusBalanceAmountEl) {
        corpusBalanceAmountEl.textContent = formatCurrency(corpusBalance);
        // Update color based on balance
        corpusBalanceAmountEl.className = `text-lg font-bold ${corpusBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
        
        // Update balance card background color
        if (corpusBalanceCardEl) {
            corpusBalanceCardEl.className = `rounded-lg p-3 ${corpusBalance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`;
            const corpusBalanceLabel = corpusBalanceCardEl.querySelector('p.text-amber-600, p.text-emerald-600, p.text-red-600');
            if (corpusBalanceLabel) {
                corpusBalanceLabel.className = `text-xs mb-1 ${corpusBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
            }
        }
    }
}

async function printReportAsPDF() {
    const reportsView = document.getElementById('reportsView');
    if (!reportsView) {
        showNotification('Report view not found.', UI_CONFIG.NOTIFICATION.TYPES.ERROR);
        return;
    }
    
    // Get the month for the report
    const monthKey = reportsMonth || currentMonth;
    const monthFormatted = monthKey ? convertMonthFormat(monthKey) : 'Unknown Month';
    
    // Create a new window for printing with selectable text
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
        showNotification('Please allow popups to print the report.', UI_CONFIG.NOTIFICATION.TYPES.ERROR);
        return;
    }
    
    // Temporarily show the reports view to ensure content is rendered
    const wasHidden = reportsView.classList.contains('view-hidden');
    if (wasHidden) {
        reportsView.classList.remove('view-hidden');
    }
    
    // Wait a bit for content to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clone the entire reports view content
    const reportsContent = reportsView.cloneNode(true);
    
    // Restore original visibility state
    if (wasHidden) {
        reportsView.classList.add('view-hidden');
    }
    
    // Remove the header section with buttons
    const headerSection = reportsContent.querySelector('.flex.flex-col.sm\\:flex-row');
    if (headerSection) {
        headerSection.remove();
    }
    
    // Remove elements that shouldn't be printed
    const noPrintElements = reportsContent.querySelectorAll('.no-print, button, input, nav, [data-lucide]');
    noPrintElements.forEach(el => {
        if (el) el.remove();
    });
    
    // Get all content sections
    let balanceSummary = null;
    let collectionsGrid = null;
    
    // Iterate through all children to find the sections
    for (let i = 0; i < reportsContent.children.length; i++) {
        const child = reportsContent.children[i];
        if (!child || child.tagName !== 'DIV') continue;
        const classes = child.className || '';
        
        // Find balance summary (has bg-white, rounded-2xl, shadow-lg, p-4)
        if (!balanceSummary && classes.includes('bg-white') && classes.includes('rounded-2xl') && classes.includes('shadow-lg') && classes.includes('p-4')) {
            balanceSummary = child;
        }
        // Find collections grid (has grid, grid-cols-1)
        if (!collectionsGrid && classes.includes('grid') && classes.includes('grid-cols-1')) {
            collectionsGrid = child;
        }
        if (balanceSummary && collectionsGrid) break;
    }
    
    // Build HTML content for print window
    let printHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Report - ${monthFormatted}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: white;
            color: #1e293b;
            font-size: 12px;
            line-height: 1.5;
        }
        .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #1e293b;
        }
        .print-header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
        }
        .print-header p {
            font-size: 14px;
            color: #64748b;
            margin: 2px 0;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1e293b;
        }
        .balance-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }
        .balance-item {
            padding: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
        }
        .balance-label {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-weight: 600;
        }
        .balance-value {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }
        th {
            background-color: #f1f5f9;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            color: #475569;
            border: 1px solid #e2e8f0;
        }
        td {
            padding: 10px 8px;
            border: 1px solid #e2e8f0;
            color: #1e293b;
        }
        tfoot td {
            background-color: #f8fafc;
            font-weight: 600;
        }
        .table-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .table-section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1e293b;
        }
        .table-section-subtitle {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 12px;
        }
        @media print {
            body {
                padding: 15px;
            }
            .section {
                page-break-inside: avoid;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>Monthly Report</h1>
        <p>${monthFormatted}</p>
        <p>Greenpeace Willowbrook</p>
    </div>
`;
    
    // Add balance summary
    if (balanceSummary) {
        printHTML += '<div class="section"><div class="section-title">Balance Summary</div>';
        
        // Extract balance data
        const maintenanceCollections = balanceSummary.querySelector('#totalMaintenanceCollectionsAmount')?.textContent || '₹0';
        const maintenanceExpenses = balanceSummary.querySelector('#totalMaintenanceExpensesAmount')?.textContent || '₹0';
        const maintenancePrevBalance = balanceSummary.querySelector('#maintenancePreviousBalanceAmount')?.textContent || '₹0';
        const maintenanceBalance = balanceSummary.querySelector('#balanceAmount')?.textContent || '₹0';
        const corpusCollections = balanceSummary.querySelector('#totalCorpusCollectionsAmount')?.textContent || '₹0';
        const corpusExpenses = balanceSummary.querySelector('#totalCorpusExpensesAmount')?.textContent || '₹0';
        const corpusPrevBalance = balanceSummary.querySelector('#corpusPreviousBalanceAmount')?.textContent || '₹0';
        const corpusBalance = balanceSummary.querySelector('#corpusBalanceAmount')?.textContent || '₹0';
        
        printHTML += `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 8px; color: #475569;">MAINTENANCE</div>
                <div class="balance-grid">
                    <div class="balance-item">
                        <div class="balance-label">Collections</div>
                        <div class="balance-value">${maintenanceCollections}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">Expenses</div>
                        <div class="balance-value" style="color: #dc2626;">${maintenanceExpenses}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">Prev Month Balance</div>
                        <div class="balance-value">${maintenancePrevBalance}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">Balance</div>
                        <div class="balance-value">${maintenanceBalance}</div>
                    </div>
                </div>
            </div>
            <div>
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 8px; color: #475569;">CORPUS</div>
                <div class="balance-grid">
                    <div class="balance-item">
                        <div class="balance-label">Collections</div>
                        <div class="balance-value">${corpusCollections}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">Expenses</div>
                        <div class="balance-value" style="color: #dc2626;">${corpusExpenses}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">Prev Month Balance</div>
                        <div class="balance-value">${corpusPrevBalance}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">Balance</div>
                        <div class="balance-value">${corpusBalance}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }
    
    // Add collections and expenses tables
    if (collectionsGrid) {
        const sections = Array.from(collectionsGrid.children);
        
        sections.forEach(section => {
            if (!section || section.tagName !== 'DIV') return;
            
            const titleElement = section.querySelector('h3');
            const subtitleElement = section.querySelector('p');
            const table = section.querySelector('table');
            
            if (titleElement && table) {
                const title = titleElement.textContent || '';
                const subtitle = subtitleElement?.textContent || '';
                
                printHTML += `
                    <div class="table-section">
                        <div class="table-section-title">${title}</div>
                        ${subtitle ? `<div class="table-section-subtitle">${subtitle}</div>` : ''}
                `;
                
                // Convert table to HTML
                const tableHTML = table.outerHTML;
                printHTML += tableHTML + '</div>';
            }
        });
    }
    
    printHTML += `
</body>
</html>`;
    
    // Write content to print window
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.addEventListener('load', function() {
        setTimeout(() => {
            printWindow.print();
        }, 250);
    });
    
    // Also try immediate print if window is already loaded
    setTimeout(() => {
        if (printWindow.document.readyState === 'complete') {
            printWindow.print();
        }
    }, 500);
    
    showNotification('Opening print dialog...', UI_CONFIG.NOTIFICATION.TYPES.SUCCESS);
}

// ============================================
// Chart Functions
// ============================================

// Get data for the last N months
function getLastNMonths(n = 6) {
    const months = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = APP_CONFIG.MONTH_NAMES[date.getMonth()];
        months.push({ key: monthKey, name: monthName });
    }
    return months;
}

// Update all charts
// Flag to prevent multiple simultaneous chart updates
let isUpdatingCharts = false;

async function updateCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }
    
    // Only update charts if dashboard view is visible
    const dashboardView = document.getElementById('dashboardView');
    if (!dashboardView || dashboardView.classList.contains('view-hidden')) {
        return;
    }
    
    // Prevent multiple simultaneous updates
    if (isUpdatingCharts) {
        return;
    }
    
    isUpdatingCharts = true;
    try {
        await updateMonthlyTrendsChart();
        await updateIncomeExpensesChart();
    } finally {
        isUpdatingCharts = false;
    }
}

// Update Monthly Trends Chart
async function updateMonthlyTrendsChart() {
    const canvas = document.getElementById('monthlyTrendsChart');
    const loader = document.getElementById('monthlyTrendsChartLoader');
    if (!canvas) return;
    
    // Show loader if chart doesn't exist yet
    const isInitialLoad = !monthlyTrendsChart;
    if (isInitialLoad && loader) {
        loader.classList.remove('hidden');
    }
    
    const months = getLastNMonths(6);
    
    // Fetch all data once instead of making multiple API calls
    const allCollections = await getAllCollections();
    const allExpenses = await getAllExpenses();
    
    const maintenanceData = [];
    const corpusData = [];
    const expenseData = [];
    
    // Helper function to get month key from date string or use month field
    function getMonthKey(item) {
        // Use month field if available (YYYY-MM format)
        if (item.month) {
            return item.month;
        }
        // Otherwise parse date field (DD-MM-YYYY format)
        if (item.date) {
            const parts = item.date.split('-');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}`; // YYYY-MM from DD-MM-YYYY
            }
        }
        // Fallback: try to parse as date string
        try {
            const date = new Date(item.date || item.collectionDate || item.expenseDate || '');
            if (!isNaN(date.getTime())) {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
        } catch (e) {
            // Ignore parse errors
        }
        return '';
    }
    
    for (const month of months) {
        // Filter collections and expenses for this month from already fetched data
        const monthCollections = allCollections.filter(c => {
            const monthKey = getMonthKey(c);
            return monthKey === month.key;
        });
        
        const monthExpenses = allExpenses.filter(e => {
            const monthKey = getMonthKey(e);
            return monthKey === month.key;
        });
        
        const maintenance = monthCollections
            .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                        c.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE)
            .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        
        const corpus = monthCollections
            .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE || 
                        c.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE)
            .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        
        const expensesTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        
        maintenanceData.push(maintenance);
        corpusData.push(corpus);
        expenseData.push(expensesTotal);
    }
    
    const ctx = canvas.getContext('2d');
    
    // Use update instead of destroy/recreate if chart exists
    if (monthlyTrendsChart) {
        monthlyTrendsChart.data.labels = months.map(m => m.name);
        monthlyTrendsChart.data.datasets[0].data = maintenanceData;
        monthlyTrendsChart.data.datasets[1].data = corpusData;
        monthlyTrendsChart.data.datasets[2].data = expenseData;
        monthlyTrendsChart.update('none'); // 'none' mode = no animation on updates
        return;
    }
    
    monthlyTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.name),
            datasets: [
                {
                    label: 'Maintenance',
                    data: maintenanceData,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Corpus',
                    data: corpusData,
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000, // Smooth animation on initial load
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
    
    // Hide loader after chart is created
    if (loader) {
        loader.classList.add('hidden');
    }
}


// Update Expense Categories Chart
async function updateExpenseCategoriesChart() {
    const canvas = document.getElementById('expenseCategoriesChart');
    if (!canvas) return;
    
    const allExpenses = await getAllExpenses();
    
    const categoryData = {};
    allExpenses.forEach(expense => {
        const category = expense.category || 'Other';
        const amount = parseFloat(expense.amount || 0);
        categoryData[category] = (categoryData[category] || 0) + amount;
    });
    
    const categories = Object.keys(categoryData).sort((a, b) => categoryData[b] - categoryData[a]);
    const amounts = categories.map(cat => categoryData[cat]);
    
    // Color palette for categories
    const colors = [
        'rgba(239, 68, 68, 0.8)',   // red
        'rgba(249, 115, 22, 0.8)',  // orange
        'rgba(234, 179, 8, 0.8)',   // yellow
        'rgba(34, 197, 94, 0.8)',   // green
        'rgba(59, 130, 246, 0.8)',  // blue
        'rgba(147, 51, 234, 0.8)',  // purple
        'rgba(236, 72, 153, 0.8)',  // pink
        'rgba(168, 85, 247, 0.8)'   // violet
    ];
    
    const ctx = canvas.getContext('2d');
    
    if (expenseCategoriesChart) {
        expenseCategoriesChart.destroy();
    }
    
    expenseCategoriesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: categories.map((_, i) => colors[i % colors.length]),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return label + ': ' + value + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Update Income vs Expenses Chart (Maintenance only)
async function updateIncomeExpensesChart() {
    const canvas = document.getElementById('incomeExpensesChart');
    const loader = document.getElementById('incomeExpensesChartLoader');
    if (!canvas) return;
    
    // Show loader if chart doesn't exist yet
    const isInitialLoad = !incomeExpensesChart;
    if (isInitialLoad && loader) {
        loader.classList.remove('hidden');
    }
    
    const months = getLastNMonths(6);
    
    // Fetch all data once instead of making multiple API calls
    const allCollections = await getAllCollections();
    const allExpenses = await getAllExpenses();
    
    const incomeData = [];
    const expenseData = [];
    
    // Helper function to get month key from date string or use month field
    function getMonthKey(item) {
        // Use month field if available (YYYY-MM format)
        if (item.month) {
            return item.month;
        }
        // Otherwise parse date field (DD-MM-YYYY format)
        if (item.date) {
            const parts = item.date.split('-');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}`; // YYYY-MM from DD-MM-YYYY
            }
        }
        // Fallback: try to parse as date string
        try {
            const date = new Date(item.date || item.collectionDate || item.expenseDate || '');
            if (!isNaN(date.getTime())) {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
        } catch (e) {
            // Ignore parse errors
        }
        return '';
    }
    
    for (const month of months) {
        // Filter collections and expenses for this month from already fetched data
        const monthCollections = allCollections.filter(c => {
            const monthKey = getMonthKey(c);
            return monthKey === month.key;
        });
        
        const monthExpenses = allExpenses.filter(e => {
            const monthKey = getMonthKey(e);
            return monthKey === month.key;
        });
        
        // Only count maintenance collections
        const maintenanceIncome = monthCollections
            .filter(c => c.type === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.TYPE || 
                        c.subType === APP_CONFIG.COLLECTION_TYPES.MAINTENANCE.VALUE)
            .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        
        // Only count maintenance expenses (not corpus expenses)
        const maintenanceExpenses = monthExpenses
            .filter(exp => {
                const isCorpus = exp.deductionSource === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                                exp.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE ||
                                exp.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
                return !isCorpus;
            })
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        
        incomeData.push(maintenanceIncome);
        expenseData.push(maintenanceExpenses);
    }
    
    const ctx = canvas.getContext('2d');
    
    // Use update instead of destroy/recreate if chart exists
    if (incomeExpensesChart) {
        incomeExpensesChart.data.labels = months.map(m => m.name);
        incomeExpensesChart.data.datasets[0].data = incomeData;
        incomeExpensesChart.data.datasets[1].data = expenseData;
        incomeExpensesChart.update('none'); // 'none' mode = no animation on updates
        return;
    }
    
    incomeExpensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months.map(m => m.name),
            datasets: [
                {
                    label: 'Maintenance Income',
                    data: incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1
                },
                {
                    label: 'Maintenance Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000, // Smooth animation on initial load
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
    
    // Hide loader after chart is created
    if (loader) {
        loader.classList.add('hidden');
    }
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

async function displayAllActivities() {
    const tbody = document.getElementById('allActivitiesTableBody');
    if (!tbody) return;
    
    // Get expenses and collections, filtered by month if specified
    let allExpenses = await getAllExpenses();
    let allCollections = await getAllCollections();
    
    // Filter by month if a month is selected (empty string means show all)
    if (activityMonth && activityMonth !== '') {
        allExpenses = await getExpensesByMonth(activityMonth);
        allCollections = await getCollectionsByMonth(activityMonth);
    }
    
    // Combine and sort by date (newest first)
    let allTransactions = [
        ...allExpenses.map(e => ({ ...e, transactionType: 'expense' })),
        ...allCollections.map(c => ({ ...c, transactionType: 'collection' }))
    ];
    
    // Filter by transaction type if specified
    if (activityType && activityType !== 'all') {
        allTransactions = allTransactions.filter(t => t.transactionType === activityType);
    }
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date);
        const dateB = new Date(b.createdAt || b.date);
        return dateB - dateA;
    });
    
    if (allTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No transactions found matching the selected filters.</td></tr>';
        return;
    }
    
    tbody.innerHTML = allTransactions.map(t => {
        const isCollection = t.transactionType === 'collection';
        const isCorpus = t.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                        t.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
        const amount = parseFloat(t.amount || 0);
        const flatOrCategory = t.flatNumber || t.category || '-';
        const description = t.description || '-';
        const paymentMode = t.paymentMode || '-';
        const date = formatDate(t.date || t.createdAt);
        
        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <div class="p-1.5 rounded-full ${isCollection ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}">
                            <i data-lucide="${isCollection ? 'trending-up' : 'trending-down'}" class="w-4 h-4"></i>
                        </div>
                        <span class="text-sm font-medium text-slate-900">${isCollection ? 'Collection' : 'Expense'}</span>
                        ${isCorpus ? '<span class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Corpus</span>' : ''}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-700">${date}</td>
                <td class="px-6 py-4 text-sm font-medium text-slate-900">${flatOrCategory}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${description}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${paymentMode}</td>
                <td class="px-6 py-4 text-right">
                    <span class="text-sm font-bold ${isCollection ? 'text-emerald-600' : 'text-rose-600'}">
                        ${isCollection ? '+' : '-'} ${formatCurrency(amount)}
                    </span>
                </td>
            </tr>
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
    
    // Initialize consolidatedData with all apartments from config (to always show all apartments)
    const consolidatedData = {};
    const allFlats = FLATS_CONFIG.FLATS || [];
    
    // Initialize all apartments with zero amounts
    allFlats.forEach(flatNumber => {
        consolidatedData[flatNumber] = {
            flatNumber: flatNumber,
            maintenance: 0,
            corpus: 0
        };
    });
    
    // Process collections and update amounts
    collections.forEach(c => {
        const flatNumber = c.flatNumber || c.category || '-';
        
        // Initialize if flatNumber is not in the standard list (for edge cases)
        if (!consolidatedData[flatNumber]) {
            consolidatedData[flatNumber] = {
                flatNumber: flatNumber,
                maintenance: 0,
                corpus: 0
            };
        }
        
        const isCorpus = c.subType === APP_CONFIG.COLLECTION_TYPES.CORPUS.VALUE || 
                        c.type === APP_CONFIG.COLLECTION_TYPES.CORPUS.TYPE;
        const amount = parseFloat(c.amount || 0);
        
        if (isCorpus) {
            consolidatedData[flatNumber].corpus += isNaN(amount) ? 0 : amount;
        } else {
            consolidatedData[flatNumber].maintenance += isNaN(amount) ? 0 : amount;
        }
    });
    
    // Convert to array and sort by flat number
    const consolidatedArray = Object.values(consolidatedData).sort((a, b) => {
        // Sort by flat number (e.g., 1A, 1B, 2A, 2B, etc.)
        const flatA = a.flatNumber;
        const flatB = b.flatNumber;
        
        // Extract floor number and letter
        const matchA = flatA.match(/(\d+)([A-Z])?/);
        const matchB = flatB.match(/(\d+)([A-Z])?/);
        
        if (matchA && matchB) {
            const floorA = parseInt(matchA[1]);
            const floorB = parseInt(matchB[1]);
            const letterA = matchA[2] || '';
            const letterB = matchB[2] || '';
            
            if (floorA !== floorB) {
                return floorA - floorB;
            }
            return letterA.localeCompare(letterB);
        }
        
        return flatA.localeCompare(flatB);
    });
    
    // Calculate totals
    let totalMaintenance = 0;
    let totalCorpus = 0;
    let grandTotal = 0;
    
    // Generate table rows
    const rowsHtml = consolidatedArray.map(item => {
        const total = item.maintenance + item.corpus;
        totalMaintenance += item.maintenance;
        totalCorpus += item.corpus;
        grandTotal += total;
        
        // Style amounts: emerald color for non-zero, gray for zero (matching yearly breakdown)
        const maintenanceClass = item.maintenance > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400';
        const corpusClass = item.corpus > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400';
        const totalClass = total > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400';
        
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900">${item.flatNumber}</td>
                <td class="px-6 py-4 text-right ${maintenanceClass}">${formatCurrency(item.maintenance)}</td>
                <td class="px-6 py-4 text-right ${corpusClass}">${formatCurrency(item.corpus)}</td>
                <td class="px-6 py-4 text-right ${totalClass}">${formatCurrency(total)}</td>
            </tr>
        `;
    }).join('');
    
    // Add total row at the bottom
    const totalRow = `
        <tr class="bg-slate-50 border-t-2 border-slate-200">
            <td class="px-6 py-4 font-semibold text-slate-900">Total</td>
            <td class="px-6 py-4 text-right font-bold text-lg text-slate-900">${formatCurrency(totalMaintenance)}</td>
            <td class="px-6 py-4 text-right font-bold text-lg text-slate-900">${formatCurrency(totalCorpus)}</td>
            <td class="px-6 py-4 text-right font-bold text-lg text-slate-900">${formatCurrency(grandTotal)}</td>
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
    
    // Calculate total amount
    const totalAmount = expenses.reduce((sum, e) => {
        const amount = parseFloat(e.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    // Generate table rows
    const rowsHtml = expenses.map(e => {
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
    
    // Add total row at the bottom
    const totalRow = `
        <tr class="bg-slate-50 border-t-2 border-slate-200">
            <td class="px-6 py-4 font-semibold text-slate-900" colspan="5">Total</td>
            <td class="px-6 py-4 text-right font-bold text-lg text-slate-900">${formatCurrency(totalAmount)}</td>
            <td class="px-6 py-4"></td>
        </tr>
    `;
    
    tbody.innerHTML = rowsHtml + totalRow;
    
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
        await updateAllTimeHouseTotals();
        await updateYearlyHouseBreakdown();
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
        await updateAllTimeHouseTotals();
        await updateYearlyHouseBreakdown();
        await updateDashboard();
    } else {
        showNotification('Error adding collection: ' + (result.error || 'Unknown error'), 'error');
    }
}

// ============================================
// Month Navigation
// ============================================


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

function changeActivityMonth(direction) {
    if (activityMonthPicker) {
        const currentDate = activityMonthPicker.selectedDates[0] || new Date();
        const newDate = new Date(currentDate);
        
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        
        activityMonthPicker.setDate(newDate, true);
    } else {
        // Fallback if Flatpickr not initialized
        const now = new Date();
        if (!activityMonth) {
            activityMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        const [year, month] = activityMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        
        activityMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        displayAllActivities();
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

let collectionsMonthPicker = null;
let expensesMonthPicker = null;
let reportsMonthPicker = null;
let activityMonthPicker = null;
let collectionDatePicker = null;
let expenseDatePicker = null;

function initializeFlatpickr() {
    // Check if Flatpickr is loaded
    if (typeof flatpickr === 'undefined') {
        console.warn('Flatpickr not loaded');
        return;
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
    
    // Initialize Activity month selector
    const activityMonthInput = document.getElementById('monthSelectorActivity');
    if (activityMonthInput && typeof monthSelectPlugin !== 'undefined') {
        const now = new Date();
        activityMonthPicker = flatpickr(activityMonthInput, {
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
                    activityMonth = month;
                    await displayAllActivities();
                }
            }
        });
        activityMonthInput.value = activityMonthPicker.input.value;
    }
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    
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
    
    // Tab switching for buttons with data-tab attribute (like "View All" in dashboard)
    document.querySelectorAll('button[data-tab]').forEach(btn => {
        // Skip if already handled by nav-tab listener
        if (!btn.classList.contains('nav-tab') && !btn.classList.contains('mobile-nav-tab')) {
            btn.addEventListener('click', function() {
                const tab = this.getAttribute('data-tab');
                if (tab) switchTab(tab);
            });
        }
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
// Month selector change is handled by Flatpickr's onChange callback
    
    // Month navigation (Collections)
    document.getElementById('prevMonthCollections')?.addEventListener('click', () => changeCollectionsMonth('prev'));
    document.getElementById('nextMonthCollections')?.addEventListener('click', () => changeCollectionsMonth('next'));
    
    // Collections sub-tab switching
    document.getElementById('collectionsTabMonthly')?.addEventListener('click', () => switchCollectionsSubTab('monthly'));
    document.getElementById('collectionsTabYearly')?.addEventListener('click', () => switchCollectionsSubTab('yearly'));
    document.getElementById('collectionsTabAllTime')?.addEventListener('click', () => switchCollectionsSubTab('allTime'));
    
    // Year navigation for yearly breakdown
    document.getElementById('prevYearCollections')?.addEventListener('click', () => {
        selectedYear--;
        updateYearlyHouseBreakdown();
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
    document.getElementById('nextYearCollections')?.addEventListener('click', () => {
        const currentYear = new Date().getFullYear();
        if (selectedYear < currentYear) {
            selectedYear++;
            updateYearlyHouseBreakdown();
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    });
    
    // Type filter checkboxes for yearly breakdown
    document.getElementById('yearlyFilterMaintenance')?.addEventListener('change', (e) => {
        showMaintenanceYearly = e.target.checked;
        updateYearlyHouseBreakdown();
    });
    document.getElementById('yearlyFilterCorpus')?.addEventListener('change', (e) => {
        showCorpusYearly = e.target.checked;
        updateYearlyHouseBreakdown();
    });
    
    // Month navigation (Expenses)
    document.getElementById('prevMonthExpenses')?.addEventListener('click', () => changeExpensesMonth('prev'));
    document.getElementById('nextMonthExpenses')?.addEventListener('click', () => changeExpensesMonth('next'));
    
    // Activity month navigation
    document.getElementById('prevMonthActivity')?.addEventListener('click', () => changeActivityMonth('prev'));
    document.getElementById('nextMonthActivity')?.addEventListener('click', () => changeActivityMonth('next'));
    
    // Activity type filter
    document.getElementById('activityTypeFilter')?.addEventListener('change', async function() {
        activityType = this.value;
        await displayAllActivities();
    });
    
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
    
    // Print report button
    document.getElementById('printReportBtn')?.addEventListener('click', printReportAsPDF);
}
