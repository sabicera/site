document.addEventListener('DOMContentLoaded', function () {
    const yearlySalaryInput = document.getElementById('grossYearlySalary');
    const monthlySalaryInput = document.getElementById('grossMonthlySalary');
    const yearlyNetInput = document.getElementById('netYearlySalary');
    const monthlyNetInput = document.getElementById('netMonthlySalary');
    const providentFundPercentageInput = document.getElementById('providentFundPercentage');

    // Set max length for inputs
    [yearlySalaryInput, monthlySalaryInput, yearlyNetInput, monthlyNetInput].forEach(input => {
        input.setAttribute('maxlength', '8');
    });

    function parseInputValue(input) {
        return parseFloat(removeCommas(input.value)) || 0;
    }

    yearlySalaryInput.addEventListener('input', function () {
        const grossYearly = parseFloat(removeCommas(yearlySalaryInput.value));
        if (!isNaN(grossYearly)) {
            monthlySalaryInput.value = formatNumber((grossYearly / 12).toFixed(2));
            calculateNetFromGross(grossYearly);
        }
    });

    monthlySalaryInput.addEventListener('input', function () {
        const grossMonthly = parseFloat(removeCommas(monthlySalaryInput.value));
        if (!isNaN(grossMonthly)) {
            const grossYearly = grossMonthly * 12;
            yearlySalaryInput.value = formatNumber(grossYearly.toFixed(2));
            calculateNetFromGross(grossYearly);
        }
    });

    yearlyNetInput.addEventListener('input', function () {
        const netYearly = parseFloat(removeCommas(yearlyNetInput.value));
        if (!isNaN(netYearly)) {
            monthlyNetInput.value = formatNumber((netYearly / 12).toFixed(2));
            calculateGrossFromNet(netYearly);
        }
    });

    monthlyNetInput.addEventListener('input', function () {
        const netMonthly = parseFloat(removeCommas(monthlyNetInput.value));
        if (!isNaN(netMonthly)) {
            const netYearly = netMonthly * 12;
            yearlyNetInput.value = formatNumber(netYearly.toFixed(2));
            calculateGrossFromNet(netYearly);
        }
    });

    providentFundPercentageInput.addEventListener('input', function () {
        const providentFundPercentage = parseFloat(providentFundPercentageInput.value) / 100;
        if (!isNaN(providentFundPercentage)) {
            const grossYearly = parseInputValue(yearlySalaryInput);
            calculateNetFromGross(grossYearly);
        }
    });
});

function calculateNetFromGross(grossSalary) {
    const providentFundRate = parseFloat(document.getElementById('providentFundPercentage').value) / 100;
    const providentFund = grossSalary * providentFundRate;

    const { tax, social, gesi, brackets } = calculateDeductions(grossSalary - providentFund);
    const totalDeductions = tax + social + gesi + providentFund;
    const netYear = grossSalary - totalDeductions;
    const netMonth = netYear / 12;

    // Update net salary inputs
    document.getElementById('netYearlySalary').value = formatNumber(netYear.toFixed(2));
    document.getElementById('netMonthlySalary').value = formatNumber(netMonth.toFixed(2));

    // Update tables
    updateMainTable(grossSalary, tax, social, gesi, providentFund, netYear, totalDeductions);
    updateBracketTable(brackets);
}

function calculateGrossFromNet(netSalary) {
    let low = netSalary;
    let high = netSalary * 2; // A reasonable upper bound
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

    // Update gross salary inputs
    document.getElementById('grossYearlySalary').value = formatNumber(grossYear.toFixed(2));
    document.getElementById('grossMonthlySalary').value = formatNumber(grossMonth.toFixed(2));

    // Recalculate the exact deductions for the final gross
    const { tax, social, gesi, providentFund, brackets } = calculateDeductions(grossYear);
    const totalDeductions = tax + social + gesi + providentFund;

    // Update tables
    updateMainTable(grossYear, tax, social, gesi, providentFund, netSalary, totalDeductions);
    updateBracketTable(brackets);
}

function calculateNetFromGrossInternal(grossSalary) {
    const providentFundRate = parseFloat(document.getElementById('providentFundPercentage').value) / 100;
    const providentFund = grossSalary * providentFundRate;

    const { tax, social, gesi } = calculateDeductions(grossSalary - providentFund);
    const totalDeductions = tax + social + gesi + providentFund;
    const netYear = grossSalary - totalDeductions;

    return { netYear };
}

function calculateDeductions(grossSalary) {
    let tax = 0;
    const brackets = {
        tax0: 0,
        tax20: 0,
        tax25: 0,
        tax30: 0,
        tax35: 0,
    };

    if (grossSalary > 60000) {
        brackets.tax35 = (grossSalary - 60000) * 0.35;
        brackets.tax30 = (60000 - 36300) * 0.30;
        brackets.tax25 = (36300 - 28000) * 0.25;
        brackets.tax20 = (28000 - 19500) * 0.20;
        brackets.tax0 = 19500 * 0; // No tax for first 19500
    } else if (grossSalary > 36300) {
        brackets.tax30 = (grossSalary - 36300) * 0.30;
        brackets.tax25 = (36300 - 28000) * 0.25;
        brackets.tax20 = (28000 - 19500) * 0.20;
        brackets.tax0 = 19500 * 0;
    } else if (grossSalary > 28000) {
        brackets.tax25 = (grossSalary - 28000) * 0.25;
        brackets.tax20 = (28000 - 19500) * 0.20;
        brackets.tax0 = 19500 * 0;
    } else if (grossSalary > 19500) {
        brackets.tax20 = (grossSalary - 19500) * 0.20;
        brackets.tax0 = 19500 * 0;
    } else {
        brackets.tax0 = grossSalary * 0;
    }

    tax = brackets.tax35 + brackets.tax30 + brackets.tax25 + brackets.tax20 + brackets.tax0;

    // Apply the social deduction with a maximum of 62,868
    let social = grossSalary * 0.088;
    if (social > 62868) {
        social = 62868;
    }

    let gesi = grossSalary * 0.0265;
    if (gesi > 180000) {
        gesi = 180000;
    }

    const providentFundRate = parseFloat(document.getElementById('providentFundPercentage').value) / 100;
    const providentFund = grossSalary * providentFundRate;

    return {
        tax,
        social,
        gesi,
        providentFund,
        brackets
    };
}

function updateMainTable(grossSalary, tax, social, gesi, providentFund, netYear, totalDeductions, netMonth, deductionsMonth) {

    console.log('grossSalary:', grossSalary);
    console.log('tax:', tax);
    console.log('social:', social);
    console.log('gesi:', gesi);
    console.log('providentFund:', providentFund);
    console.log('netYear:', netYear);
    console.log('totalDeductions:', totalDeductions);

    document.getElementById('gross').textContent = '€' + formatNumber(grossSalary.toFixed(2));
    document.getElementById('monthlygross').textContent = '€' + formatNumber((grossSalary / 12).toFixed(2));
    document.getElementById('tax').textContent = '€' + formatNumber(tax.toFixed(2));
    document.getElementById('monthlytax').textContent = '€' + formatNumber((tax / 12).toFixed(2));
    document.getElementById('social').textContent = '€' + formatNumber(social.toFixed(2));
    document.getElementById('monthlysocial').textContent = '€' + formatNumber((social / 12).toFixed(2));
    document.getElementById('gesi').textContent = '€' + formatNumber(gesi.toFixed(2));
    document.getElementById('monthlygesi').textContent = '€' + formatNumber((gesi / 12).toFixed(2));
    document.getElementById('providentFund').textContent = '€' + formatNumber(providentFund.toFixed(2));
    document.getElementById('monthlyProvidentFund').textContent = '€' + formatNumber((providentFund / 12).toFixed(2));
    document.getElementById('netYear').textContent = '€' + formatNumber(netYear.toFixed(2));
    document.getElementById('deductionsYear').textContent = '€' + formatNumber(totalDeductions.toFixed(2));
    document.getElementById('deductionsYearPercentage').textContent = '-' + ((totalDeductions / grossSalary) * 100).toFixed(2) + '%';
    document.getElementById('netMonth').textContent = '€' + formatNumber((netYear / 12).toFixed(2));
    document.getElementById('deductionsMonth').textContent = '€' + formatNumber((totalDeductions / 12).toFixed(2));
    document.getElementById('AccumulatedYear').textContent = '€' + formatNumber((netYear + providentFund).toFixed(2));
    document.getElementById('AccumulatedMonth').textContent = '€' + formatNumber(((netYear / 12) + (providentFund / 12)).toFixed(2));
}

function updateBracketTable(brackets) {
    document.getElementById('tax0').textContent = '€' + formatNumber(brackets.tax0.toFixed(2));
    document.getElementById('tax20').textContent = '€' + formatNumber(brackets.tax20.toFixed(2));
    document.getElementById('tax25').textContent = '€' + formatNumber(brackets.tax25.toFixed(2));
    document.getElementById('tax30').textContent = '€' + formatNumber(brackets.tax30.toFixed(2));
    document.getElementById('tax35').textContent = '€' + formatNumber(brackets.tax35.toFixed(2));
}

function removeCommas(value) {
    return value.replace(/,/g, '');
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}