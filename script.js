/**
 * Fuzzy Logic Operations Simulator
 * A comprehensive frontend application for fuzzy set operations
 * 
 * Author: AI Assistant
 * Date: 2024
 */

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    setA: [],
    setB: [],
    isValid: false,
    lastResult: null,
    lastOperation: null,
    lastSteps: [],
    charts: {
        bar: null,
        radar: null
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Fuzzy Logic Simulator initialized');
    
    // Initialize theme
    initializeTheme();
    
    // Initialize event listeners
    setupEventListeners();
    
    // Load any saved example
    loadDefaultExample();
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Input validation
    document.getElementById('validateBtn').addEventListener('click', validateSets);
    document.getElementById('resetBtn').addEventListener('click', resetAll);
    document.getElementById('randomizeBtn').addEventListener('click', generateRandomExample);
    
    // Operations
    document.querySelectorAll('.operation-btn').forEach(btn => {
        btn.addEventListener('click', performOperation);
    });
    
    // Export buttons
    document.getElementById('copyResultBtn').addEventListener('click', copyResult);
    document.getElementById('downloadTxtBtn').addEventListener('click', downloadTXT);
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Input field auto-format
    document.getElementById('setA').addEventListener('blur', formatInput);
    document.getElementById('setB').addEventListener('blur', formatInput);
}

// ============================================
// INPUT VALIDATION
// ============================================

function formatInput(event) {
    const input = event.target;
    let value = input.value.trim();
    
    // Remove extra spaces
    value = value.replace(/\s+/g, ' ');
    // Trim spaces around commas
    value = value.replace(/\s*,\s*/g, ', ');
    
    input.value = value;
}

function parseInput(inputString) {
    if (!inputString || typeof inputString !== 'string') {
        return null;
    }
    
    const values = inputString.split(',').map(v => {
        const trimmed = v.trim();
        const num = parseFloat(trimmed);
        return isNaN(num) ? null : num;
    });
    
    return values.includes(null) ? null : values;
}

function validateSets() {
    const setAInput = document.getElementById('setA').value.trim();
    const setBInput = document.getElementById('setB').value.trim();
    
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
    
    // Parse inputs
    const parsedA = parseInput(setAInput);
    const parsedB = parseInput(setBInput);
    
    // Validation checks
    if (!setAInput || !setBInput) {
        showAlert('Please enter values for both sets', 'danger');
        return;
    }
    
    if (!parsedA || !parsedB) {
        showAlert('Invalid input format. Please enter comma-separated numbers.', 'danger');
        return;
    }
    
    if (parsedA.length !== parsedB.length) {
        showAlert(`Set A has ${parsedA.length} elements, but Set B has ${parsedB.length}. Both sets must have the same number of elements.`, 'danger');
        return;
    }
    
    if (!parsedA.every(v => v >= 0 && v <= 1)) {
        showAlert('All values in Set A must be between 0 and 1.', 'danger');
        return;
    }
    
    if (!parsedB.every(v => v >= 0 && v <= 1)) {
        showAlert('All values in Set B must be between 0 and 1.', 'danger');
        return;
    }
    
    // All validations passed
    state.setA = parsedA;
    state.setB = parsedB;
    state.isValid = true;
    
    showAlert(`✓ Validation successful! Set A: [${parsedA.join(', ')}], Set B: [${parsedB.join(', ')}]`, 'success');
    console.log('Sets validated:', { A: state.setA, B: state.setB });
}

// ============================================
// FUZZY OPERATIONS
// ============================================

/**
 * Union Operation: max(A, B)
 * Represents OR operation
 */
function fuzzyUnion(A, B) {
    return A.map((val, i) => Math.max(val, B[i]));
}

/**
 * Intersection Operation: min(A, B)
 * Represents AND operation
 */
function fuzzyIntersection(A, B) {
    return A.map((val, i) => Math.min(val, B[i]));
}

/**
 * Complement Operation: 1 - A
 * Represents NOT operation
 */
function fuzzyComplement(A) {
    return A.map(val => 1 - val);
}

/**
 * Difference Operation: min(A, 1 - B)
 * Elements in A but not in B
 */
function fuzzyDifference(A, B) {
    return A.map((val, i) => Math.min(val, 1 - B[i]));
}

/**
 * Perform the selected fuzzy operation
 */
function performOperation(event) {
    if (!state.isValid) {
        showAlert('Please validate your sets first!', 'warning');
        return;
    }
    
    const operation = event.target.closest('.operation-btn').dataset.op;
    let result, steps, operationName;
    
    try {
        switch(operation) {
            case 'union':
                result = fuzzyUnion(state.setA, state.setB);
                operationName = 'Union';
                steps = generateUnionSteps(state.setA, state.setB, result);
                break;
            case 'intersection':
                result = fuzzyIntersection(state.setA, state.setB);
                operationName = 'Intersection';
                steps = generateIntersectionSteps(state.setA, state.setB, result);
                break;
            case 'complementA':
                result = fuzzyComplement(state.setA);
                operationName = "Complement of A";
                steps = generateComplementSteps(state.setA, result, 'A');
                break;
            case 'complementB':
                result = fuzzyComplement(state.setB);
                operationName = "Complement of B";
                steps = generateComplementSteps(state.setB, result, 'B');
                break;
            case 'difference':
                result = fuzzyDifference(state.setA, state.setB);
                operationName = 'Difference (A - B)';
                steps = generateDifferenceSteps(state.setA, state.setB, result);
                break;
            default:
                showAlert('Unknown operation', 'danger');
                return;
        }
        
        // Store results
        state.lastResult = result;
        state.lastOperation = operationName;
        state.lastSteps = steps;
        
        // Display results
        displayResult(result, operationName);
        displaySteps(steps);
        updateCharts(result);
        
        // Show export buttons
        document.getElementById('copyResultBtn').style.display = 'inline-block';
        document.getElementById('downloadTxtBtn').style.display = 'inline-block';
        document.getElementById('downloadPdfBtn').style.display = 'inline-block';
        
        showToast(`${operationName} operation completed!`, 'success');
        console.log(`Operation: ${operationName}`, result);
        
    } catch (error) {
        showAlert(`Error performing operation: ${error.message}`, 'danger');
        console.error(error);
    }
}

// ============================================
// STEP GENERATION
// ============================================

function generateUnionSteps(A, B, result) {
    const steps = [];
    A.forEach((valA, i) => {
        steps.push({
            label: `Element ${i + 1}`,
            calculation: `max(${valA}, ${B[i]})`,
            result: result[i]
        });
    });
    return steps;
}

function generateIntersectionSteps(A, B, result) {
    const steps = [];
    A.forEach((valA, i) => {
        steps.push({
            label: `Element ${i + 1}`,
            calculation: `min(${valA}, ${B[i]})`,
            result: result[i]
        });
    });
    return steps;
}

function generateComplementSteps(A, result, setName) {
    const steps = [];
    A.forEach((val, i) => {
        steps.push({
            label: `Element ${i + 1}`,
            calculation: `1 - ${val}`,
            result: result[i]
        });
    });
    return steps;
}

function generateDifferenceSteps(A, B, result) {
    const steps = [];
    A.forEach((valA, i) => {
        steps.push({
            label: `Element ${i + 1}`,
            calculation: `min(${valA}, ${1 - B[i]})`,
            result: result[i]
        });
    });
    return steps;
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

function displayResult(result, operationName) {
    const resultDisplay = document.getElementById('resultDisplay');
    const formattedResult = result.map(v => v.toFixed(4)).join(', ');
    
    resultDisplay.innerHTML = `
        <div class="result-value">
            <strong>${operationName}</strong><br>
            [${formattedResult}]
        </div>
    `;
}

function displaySteps(steps) {
    const stepsDisplay = document.getElementById('stepsDisplay');
    
    if (!steps || steps.length === 0) {
        stepsDisplay.innerHTML = '<p class="text-muted">No steps available</p>';
        return;
    }
    
    const stepsHTML = steps.map((step, index) => `
        <div class="step-item completed">
            <div class="step-label">${step.label}: ${step.calculation}</div>
            <div class="step-value">= ${step.result.toFixed(4)}</div>
        </div>
    `).join('');
    
    stepsDisplay.innerHTML = stepsHTML;
}

// ============================================
// CHART FUNCTIONS
// ============================================

function updateCharts(result) {
    updateBarChart(result);
    updateRadarChart(result);
}

function updateBarChart(result) {
    const ctx = document.getElementById('barChart').getContext('2d');
    
    if (state.charts.bar) {
        state.charts.bar.destroy();
    }
    
    const labels = state.lastSteps.map(s => s.label);
    
    state.charts.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Set A',
                    data: state.setA,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Set B',
                    data: state.setB,
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Result',
                    data: result,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).color
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        color: getComputedStyle(document.body).color
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body).color
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function updateRadarChart(result) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    if (state.charts.radar) {
        state.charts.radar.destroy();
    }
    
    const labels = state.lastSteps.map(s => s.label);
    
    state.charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Set A',
                    data: state.setA,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)'
                },
                {
                    label: 'Set B',
                    data: state.setB,
                    borderColor: 'rgba(139, 92, 246, 1)',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(139, 92, 246, 1)'
                },
                {
                    label: 'Result',
                    data: result,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        color: getComputedStyle(document.body).color
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).color
                    }
                }
            }
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function resetAll() {
    document.getElementById('setA').value = '';
    document.getElementById('setB').value = '';
    document.getElementById('alertContainer').innerHTML = '';
    document.getElementById('resultDisplay').innerHTML = '<p class="text-muted text-center"><i class="bi bi-info-circle"></i> Validate your sets and perform an operation to see results</p>';
    document.getElementById('stepsDisplay').innerHTML = '<p class="text-muted text-center"><i class="bi bi-info-circle"></i> Steps will appear here</p>';
    
    document.getElementById('copyResultBtn').style.display = 'none';
    document.getElementById('downloadTxtBtn').style.display = 'none';
    document.getElementById('downloadPdfBtn').style.display = 'none';
    
    state.setA = [];
    state.setB = [];
    state.isValid = false;
    state.lastResult = null;
    state.lastOperation = null;
    state.lastSteps = [];
    
    showToast('All fields cleared', 'info');
}

function generateRandomExample() {
    const generateRandomSet = () => {
        const length = Math.floor(Math.random() * 3) + 4; // 4-6 elements
        return Array.from({ length }, () => Math.round(Math.random() * 100) / 100);
    };
    
    const setA = generateRandomSet();
    const setB = generateRandomSet();
    
    document.getElementById('setA').value = setA.join(', ');
    document.getElementById('setB').value = setB.join(', ');
    
    showToast('Random example generated!', 'info');
}

function loadDefaultExample() {
    document.getElementById('setA').value = '0.2, 0.5, 0.7, 1.0';
    document.getElementById('setB').value = '0.4, 0.3, 0.8, 0.6';
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function copyResult() {
    if (!state.lastResult) {
        showAlert('No result to copy', 'warning');
        return;
    }
    
    const result = state.lastResult.map(v => v.toFixed(4)).join(', ');
    const text = `${state.lastOperation}: [${result}]`;
    
    navigator.clipboard.writeText(text)
        .then(() => showToast('Result copied to clipboard!', 'success'))
        .catch(err => {
            console.error('Copy failed:', err);
            showAlert('Failed to copy to clipboard', 'danger');
        });
}

function downloadTXT() {
    if (!state.lastResult) {
        showAlert('No result to download', 'warning');
        return;
    }
    
    const result = state.lastResult.map(v => v.toFixed(4)).join(', ');
    const content = generateTextContent();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuzzy-operation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('TXT file downloaded!', 'success');
}

function downloadPDF() {
    if (!state.lastResult) {
        showAlert('No result to download', 'warning');
        return;
    }
    
    // Note: In a production environment, you would use a PDF library like jsPDF or pdfkit
    // For now, we'll create a simple PDF-like text file
    const content = generateTextContent();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuzzy-operation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('PDF file generated (downloaded as TXT)!', 'success');
}

function generateTextContent() {
    const result = state.lastResult.map(v => v.toFixed(4)).join(', ');
    
    const content = `
Fuzzy Logic Operations Report
Generated: ${new Date().toLocaleString()}
=====================================

Operation: ${state.lastOperation}

Set A:
[${state.setA.map(v => v.toFixed(4)).join(', ')}]

Set B:
[${state.setB.map(v => v.toFixed(4)).join(', ')}]

Result:
[${result}]

Step-by-Step Calculation:
${state.lastSteps.map(s => `${s.label}: ${s.calculation} = ${s.result.toFixed(4)}`).join('\n')}

=====================================
Fuzzy Logic Operations Simulator
https://fuzzy-logic-simulator.com
    `.trim();
    
    return content;
}

// ============================================
// THEME FUNCTIONS
// ============================================

function initializeTheme() {
    const savedTheme = localStorage.getItem('fuzzy-theme') || 'dark';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    localStorage.setItem('fuzzy-theme', newTheme);
}

function applyTheme(theme) {
    const themeToggle = document.getElementById('themeToggle');
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    } else {
        document.body.classList.remove('light-theme');
        themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
    }
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = `alert-${Date.now()}`;
    
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
            <i class="bi bi-${getAlertIcon(type)}"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = alertHTML;
    alertContainer.appendChild(tempDiv.firstElementChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = `toast-${Date.now()}`;
    
    const toastHTML = `
        <div id="${toastId}" class="toast ${type}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-body">
                <i class="bi bi-${getToastIcon(type)}"></i> ${message}
            </div>
        </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = toastHTML;
    toastContainer.appendChild(tempDiv.firstElementChild);
    
    const toast = document.getElementById(toastId);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getToastIcon(type) {
    return getAlertIcon(type);
}

// ============================================
// DEBUG FUNCTIONS
// ============================================

// Enable logging in development
console.log('%c Fuzzy Logic Simulator loaded', 'color: #6366F1; font-size: 16px; font-weight: bold');
console.log('Available functions:', {
    fuzzyUnion: 'Union operation',
    fuzzyIntersection: 'Intersection operation',
    fuzzyComplement: 'Complement operation',
    fuzzyDifference: 'Difference operation'
});
