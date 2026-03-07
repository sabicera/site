function updateChildren(v) {
    const el = document.getElementById('children');
    el.value = Math.max(0, parseInt(el.value) + v);
    calculate();
}

function calculate() {
    const gross = parseFloat(document.getElementById('grossSalary').value) || 0;
    const installments = parseInt(document.getElementById('installments').value);
    const pfRateRaw = parseFloat(document.getElementById('providentFundRate').value) || 0;
    const children = parseInt(document.getElementById('children').value);
    const hhIncome = parseFloat(document.getElementById('hhIncome').value) || 0;
    const rentInput = parseFloat(document.getElementById('rentDeduction').value) || 0;

    // FIX #9: Guard against negative gross salary
    if (gross < 0) {
        document.getElementById('grossSalary').value = 0;
        return;
    }

    // FIX #8: Clamp provident fund rate and give visual feedback
    const pfRate = Math.min(pfRateRaw, 10);
    if (pfRateRaw > 10) {
        document.getElementById('providentFundRate').value = 10;
    }

    // 2026 caps
    const si_cap = 66612;
    const gesy_cap = 180000;

    // FIX #3: Calculate SI and GESY on a true monthly basis, then annualise.
    // SI/GESY apply to each salary payment so we use actual monthly gross.
    const monthlyGross = gross / installments;
    const siMonthly = Math.min(monthlyGross, si_cap / 12) * 0.088;
    const siAnnual  = siMonthly * installments;

    const gesyMonthly = Math.min(monthlyGross, gesy_cap / 12) * 0.0265;
    const gesyAnnual  = gesyMonthly * installments;

    // Provident Fund: applied on 12-month base salary only (excludes 13th/14th)
    const pf = (monthlyGross * 12) * (pfRate / 100);
    const pfMonthly = pf / 12;

    const rentDeduction = Math.min(rentInput, 2000);

    // FIX #7: Only compute threshold when children > 0
    let familyDeduction = 0;
    if (children > 0) {
        const threshold = children <= 2 ? 100000 : children <= 4 ? 150000 : 200000;
        if (hhIncome <= threshold) {
            familyDeduction += 1000;
            if (children >= 2) familyDeduction += 1250;
            if (children >= 3) familyDeduction += (children - 2) * 1500;
        }
    }

    // FIX #6: Show hint if children > 0 but hhIncome is blank
    const hhHint = document.getElementById('hhIncomeHint');
    if (hhHint) {
        const hhIncomeRaw = document.getElementById('hhIncome').value.trim();
        hhHint.style.display = (children > 0 && !hhIncomeRaw) ? 'block' : 'none';
    }

    // Tax Engine — proposed 2026 brackets (€22k free threshold).
    // FIX #4: comment flags that these must be confirmed once law is enacted.
    function computeTax(amount) {
        let t = 0;
        let rem = Math.max(0, amount);
        if (rem > 72000) { t += (rem - 72000) * 0.35; rem = 72000; }
        if (rem > 42000) { t += (rem - 42000) * 0.30; rem = 42000; }
        if (rem > 32000) { t += (rem - 32000) * 0.25; rem = 32000; }
        if (rem > 22000) { t += (rem - 22000) * 0.20; }
        return t;
    }

    // Savings calculation
    const baseTaxable = gross - siAnnual - gesyAnnual;
    const baseTax = computeTax(baseTaxable);

    const gainPF    = Math.max(0, baseTax - computeTax(baseTaxable - pf));
    const gainChild = Math.max(0, baseTax - computeTax(baseTaxable - familyDeduction));
    const gainRent  = Math.max(0, baseTax - computeTax(baseTaxable - rentDeduction));

    const actualTaxable = gross - siAnnual - gesyAnnual - pf - familyDeduction - rentDeduction;
    const actualTax = computeTax(actualTaxable);

    // FIX #2: Guard totalGain against negative values
    const totalGain = Math.max(0, baseTax - actualTax);

    // FIX #13: use textContent (faster, no layout reflow)
    const f    = (n) => '€' + Math.round(n).toLocaleString();
    const gain = (n) => n > 0 ? '+' + f(n) : f(0);
    const set  = (id, val) => { document.getElementById(id).textContent = val; };

    // Annual columns
    set('aGross', f(gross));
    set('aSoc',   f(siAnnual));
    set('aGesy',  f(gesyAnnual));
    set('aProv',  f(pf));
    set('aTax',   f(actualTax));
    set('aNet',   f(gross - siAnnual - gesyAnnual - pf - actualTax));

    // Monthly columns — true monthly figures for SI, GESY, PF
    set('mGross', f(monthlyGross));
    set('mSoc',   f(siMonthly));
    set('mGesy',  f(gesyMonthly));
    set('mProv',  f(pfMonthly));
    set('mTax',   f(actualTax / installments));
    set('mNet',   f((gross - siAnnual - gesyAnnual - pf - actualTax) / installments));

    // Gain column
    set('sProv',  gain(gainPF));
    set('sChild', gain(gainChild));
    set('sRent',  gain(gainRent));
    // FIX #1: tGain now uses the same "+" prefix as other gain cells
    set('tGain',  gain(totalGain));
}

// FIX #14: Wait for DOM before running first calculation
document.addEventListener('DOMContentLoaded', calculate);
