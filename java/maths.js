// Define utility functions at the beginning so they're available throughout the code
function removeCommas(value) {
    return value.replace(/,/g, '');
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

document.addEventListener('DOMContentLoaded', function () {
    const yearlySalaryInput = document.getElementById('grossYearlySalary');
    const monthlySalaryInput = document.getElementById('grossMonthlySalary');
    const yearlyNetInput = document.getElementById('netYearlySalary');
    const monthlyNetInput = document.getElementById('netMonthlySalary');
    const providentFundPercentageInput = document.getElementById('providentFundPercentage');
    const thirteenthSalaryCheckbox = document.getElementById('thirteenthSalary');

    // Set max length for inputs
    [yearlySalaryInput, monthlySalaryInput, yearlyNetInput, monthlyNetInput].forEach(input => {
        input.setAttribute('maxlength', '10');
    });

    // Input formatting and validation
    [yearlySalaryInput, monthlySalaryInput, yearlyNetInput, monthlyNetInput, providentFundPercentageInput].forEach(input => {
        input.addEventListener('focus', function() {
            if (this.value === '0') {
                this.value = '';
            }
        });
        
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.value = '0';
            }
        });
    });

    function parseInputValue(input) {
        return parseFloat(removeCommas(input.value)) || 0;
    }

    yearlySalaryInput.addEventListener('input', function () {
        const grossYearly = parseFloat(removeCommas(yearlySalaryInput.value));
        if (!isNaN(grossYearly)) {
            // Monthly salary is always based on 12 months
            monthlySalaryInput.value = formatNumber((grossYearly / 12).toFixed(2));
            calculateNetFromGross(grossYearly);
        }
    });

    monthlySalaryInput.addEventListener('input', function () {
        const grossMonthly = parseFloat(removeCommas(monthlySalaryInput.value));
        if (!isNaN(grossMonthly)) {
            // Calculate yearly based on whether 13th month is included
            const yearMultiplier = thirteenthSalaryCheckbox.checked ? 13 : 12;
            const grossYearly = grossMonthly * yearMultiplier;
            yearlySalaryInput.value = formatNumber(grossYearly.toFixed(2));
            calculateNetFromGross(grossYearly);
        }
    });

    yearlyNetInput.addEventListener('input', function () {
        const netYearly = parseFloat(removeCommas(yearlyNetInput.value));
        if (!isNaN(netYearly)) {
            // Monthly net is always based on 12 months
            monthlyNetInput.value = formatNumber((netYearly / 12).toFixed(2));
            calculateGrossFromNet(netYearly);
        }
    });

    monthlyNetInput.addEventListener('input', function () {
        const netMonthly = parseFloat(removeCommas(monthlyNetInput.value));
        if (!isNaN(netMonthly)) {
            // Calculate yearly based on whether 13th month is included
            const yearMultiplier = thirteenthSalaryCheckbox.checked ? 13 : 12;
            const netYearly = netMonthly * yearMultiplier;
            yearlyNetInput.value = formatNumber(netYearly.toFixed(2));
            calculateGrossFromNet(netYearly);
        }
    });

    thirteenthSalaryCheckbox.addEventListener('change', function() {
        const monthlyGross = parseFloat(removeCommas(monthlySalaryInput.value));
        if (!isNaN(monthlyGross)) {
            // Recalculate yearly amount with or without 13th month
            const yearMultiplier = this.checked ? 13 : 12;
            const grossYearly = monthlyGross * yearMultiplier;
            yearlySalaryInput.value = formatNumber(grossYearly.toFixed(2));
            calculateNetFromGross(grossYearly);
        }
    });

    providentFundPercentageInput.addEventListener('input', function () {
        // Ensure provident fund percentage is valid (0-10%)
        let value = parseFloat(this.value);
        if (isNaN(value)) {
            value = 0;
        } else if (value > 10) {
            value = 10;
            this.value = "10";
        } else if (value < 0) {
            value = 0;
            this.value = "0";
        }
        
        const grossYearly = parseInputValue(yearlySalaryInput);
        calculateNetFromGross(grossYearly);
    });

    // Initialize the calculator with default values
    calculateNetFromGross(0);

    // Listen for theme changes to update table styles if needed
    document.addEventListener('themeChanged', function(e) {
        // No specific action needed here as CSS handles the styling changes
        // This listener is here for potential future enhancements
    });
});

function calculateNetFromGross(grossSalary) {
    const is13thMonthEnabled = document.getElementById('thirteenthSalary').checked;
    const monthlyGross = grossSalary / (is13thMonthEnabled ? 13 : 12);
    
    // Calculate taxable amount (excluding 13th month for tax and provident fund)
    const taxableAmount = is13thMonthEnabled ? (monthlyGross * 12) : grossSalary;
    
    const providentFundRate = parseFloat(document.getElementById('providentFundPercentage').value) / 100;
    // Apply provident fund only on taxable amount (excluding 13th month)
    const providentFund = taxableAmount * providentFundRate;

    // Calculate tax on taxable amount (excluding 13th month)
    const { tax, brackets } = calculateTax(taxableAmount - providentFund);
    
    // Calculate social and GESI on full amount (including 13th month)
    const { social, gesi } = calculateSocialAndGesi(grossSalary - providentFund);
    
    const totalDeductions = tax + social + gesi + providentFund;
    const netYear = grossSalary - totalDeductions;
    const netMonth = netYear / 12;

    document.getElementById('netYearlySalary').value = formatNumber(netYear.toFixed(2));
    document.getElementById('netMonthlySalary').value = formatNumber(netMonth.toFixed(2));

    updateTables(grossSalary, tax, social, gesi, providentFund, netYear, totalDeductions);
    updateBracketTable(brackets);
}

function calculateGrossFromNet(netSalary) {
    let low = netSalary;
    let high = netSalary * 2;
    let estimatedGross;

    while (high - low > 0.01) {
        estimatedGross = (low + high) / 2;
        const { netYear } = calculateNetFromGrossInternal(estimatedGross);
        if (netYear < netSalary) {
            low = estimatedGross;
        } else {
            high = estimatedGross;
        }
    }

    const grossYear = estimatedGross;
    const grossMonth = grossYear / 12;

    document.getElementById('grossYearlySalary').value = formatNumber(grossYear.toFixed(2));
    document.getElementById('grossMonthlySalary').value = formatNumber(grossMonth.toFixed(2));

    const is13thMonthEnabled = document.getElementById('thirteenthSalary').checked;
    const monthlyGross = grossYear / (is13thMonthEnabled ? 13 : 12);
    
    // Calculate taxable amount (excluding 13th month for tax and provident fund)
    const taxableAmount = is13thMonthEnabled ? (monthlyGross * 12) : grossYear;
    
    const providentFundRate = parseFloat(document.getElementById('providentFundPercentage').value) / 100;
    // Apply provident fund only on taxable amount (excluding 13th month)
    const providentFund = taxableAmount * providentFundRate;

    // Calculate tax on taxable amount (excluding 13th month)
    const { tax, brackets } = calculateTax(taxableAmount - providentFund);
    
    // Calculate social and GESI on full amount (including 13th month)
    const { social, gesi } = calculateSocialAndGesi(grossYear - providentFund);
    
    const totalDeductions = tax + social + gesi + providentFund;

    updateTables(grossYear, tax, social, gesi, providentFund, netSalary, totalDeductions);
    updateBracketTable(brackets);
}

function calculateNetFromGrossInternal(grossSalary) {
    const is13thMonthEnabled = document.getElementById('thirteenthSalary').checked;
    const monthlyGross = grossSalary / (is13thMonthEnabled ? 13 : 12);
    
    // Calculate taxable amount (excluding 13th month for tax and provident fund)
    const taxableAmount = is13thMonthEnabled ? (monthlyGross * 12) : grossSalary;

    const providentFundRate = parseFloat(document.getElementById('providentFundPercentage').value) / 100;
    // Apply provident fund only on taxable amount (excluding 13th month)
    const providentFund = taxableAmount * providentFundRate;

    // Calculate tax on taxable amount (excluding 13th month)
    const { tax } = calculateTax(taxableAmount - providentFund);
    
    // Calculate social and GESI on full amount (including 13th month)
    const { social, gesi } = calculateSocialAndGesi(grossSalary - providentFund);
    
    const totalDeductions = tax + social + gesi + providentFund;
    const netYear = grossSalary - totalDeductions;

    return { netYear };
}

function calculateTax(taxableAmount) {
    let tax = 0;
    const brackets = {
        tax0: 0,
        tax20: 0,
        tax25: 0,
        tax30: 0,
        tax35: 0,
    };

    if (taxableAmount > 72000) {
        brackets.tax35 = (taxableAmount - 72001) * 0.35;
        brackets.tax30 = (72000 - 42001) * 0.30;
        brackets.tax25 = (42000 - 32001) * 0.25;
        brackets.tax20 = (32000 - 22001) * 0.20;
        brackets.tax0 = 22000 * 0;
    } else if (taxableAmount > 42000) {
        brackets.tax30 = (taxableAmount - 42001) * 0.30;
        brackets.tax25 = (42000 - 32001) * 0.25;
        brackets.tax20 = (32000 - 22001) * 0.20;
        brackets.tax0 = 22000 * 0;
    } else if (taxableAmount > 28000) {
        brackets.tax25 = (taxableAmount - 32001) * 0.25;
        brackets.tax20 = (32000 - 22001) * 0.20;
        brackets.tax0 = 22000 * 0;
    } else if (taxableAmount > 22000) {
        brackets.tax20 = (taxableAmount - 22001) * 0.20;
        brackets.tax0 = 22000 * 0;
    } else {
        brackets.tax0 = taxableAmount * 0;
    }

    tax = brackets.tax35 + brackets.tax30 + brackets.tax25 + brackets.tax20 + brackets.tax0;

    return {
        tax,
        brackets
    };
}

function calculateSocialAndGesi(amount) {
    // Apply the social deduction with a maximum of 62,868
    let social = amount * 0.088;
    if (social > 62868) {
        social = 62868;
    }

    let gesi = amount * 0.0265;
    if (gesi > 180000) {
        gesi = 180000;
    }

    return {
        social,
        gesi
    };
}

function updateTables(grossSalary, tax, social, gesi, providentFund, netYear, totalDeductions) {
    // Update both main table and summary table with calculated values
    const monthlyGross = grossSalary / 12;
    const monthlyTax = tax / 12;
    const monthlySocial = social / 12;
    const monthlyGesi = gesi / 12;
    const monthlyProvidentFund = providentFund / 12;
    const monthlyNet = netYear / 12;
    const monthlyDeductions = totalDeductions / 12;
    
    // Format percentage for deductions - prevent NaN% when grossSalary is 0
    let deductionsPercentage;
    if (grossSalary === 0 || isNaN(grossSalary)) {
        deductionsPercentage = "0.00";
    } else {
        deductionsPercentage = ((totalDeductions / grossSalary) * 100).toFixed(2);
    }

    // Update the summary table (always visible)
    document.getElementById('gross').textContent = '€' + formatNumber(grossSalary.toFixed(2));
    document.getElementById('monthlygross').textContent = '€' + formatNumber(monthlyGross.toFixed(2));
    document.getElementById('deductionsYear').textContent = '€' + formatNumber(totalDeductions.toFixed(2));
    document.getElementById('deductionsMonth').textContent = '€' + formatNumber(monthlyDeductions.toFixed(2));
    document.getElementById('netYear').textContent = '€' + formatNumber(netYear.toFixed(2));
    document.getElementById('netMonth').textContent = '€' + formatNumber(monthlyNet.toFixed(2));
    document.getElementById('deductionsYearPercentage').textContent = '-' + deductionsPercentage + '%';
    
    // Update the detailed table
    document.getElementById('gross2').textContent = '€' + formatNumber(grossSalary.toFixed(2));
    document.getElementById('monthlygross2').textContent = '€' + formatNumber(monthlyGross.toFixed(2));
    document.getElementById('tax').textContent = '€' + formatNumber(tax.toFixed(2));
    document.getElementById('monthlytax').textContent = '€' + formatNumber(monthlyTax.toFixed(2));
    document.getElementById('social').textContent = '€' + formatNumber(social.toFixed(2));
    document.getElementById('monthlysocial').textContent = '€' + formatNumber(monthlySocial.toFixed(2));
    document.getElementById('gesi').textContent = '€' + formatNumber(gesi.toFixed(2));
    document.getElementById('monthlygesi').textContent = '€' + formatNumber(monthlyGesi.toFixed(2));
    document.getElementById('providentFund').textContent = '€' + formatNumber(providentFund.toFixed(2));
    document.getElementById('monthlyProvidentFund').textContent = '€' + formatNumber(monthlyProvidentFund.toFixed(2));
    document.getElementById('deductionsYear2').textContent = '€' + formatNumber(totalDeductions.toFixed(2));
    document.getElementById('deductionsMonth2').textContent = '€' + formatNumber(monthlyDeductions.toFixed(2));
    document.getElementById('netYear2').textContent = '€' + formatNumber(netYear.toFixed(2));
    document.getElementById('netMonth2').textContent = '€' + formatNumber(monthlyNet.toFixed(2));
    document.getElementById('AccumulatedYear').textContent = '€' + formatNumber((netYear + providentFund).toFixed(2));
    document.getElementById('AccumulatedMonth').textContent = '€' + formatNumber((monthlyNet + monthlyProvidentFund).toFixed(2));
}

function updateBracketTable(brackets) {
    // Update the tax bracket table with the calculated values
    document.getElementById('tax0').textContent = '€' + formatNumber(brackets.tax0.toFixed(2));
    document.getElementById('tax20').textContent = '€' + formatNumber(brackets.tax20.toFixed(2));
    document.getElementById('tax25').textContent = '€' + formatNumber(brackets.tax25.toFixed(2));
    document.getElementById('tax30').textContent = '€' + formatNumber(brackets.tax30.toFixed(2));
    document.getElementById('tax35').textContent = '€' + formatNumber(brackets.tax35.toFixed(2));

}
