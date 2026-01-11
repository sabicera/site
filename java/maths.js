function updateChildren(v) {
    const el = document.getElementById('children');
    el.value = Math.max(0, parseInt(el.value) + v);
    calculate();
}

function calculate() {
    const gross = parseFloat(document.getElementById('grossSalary').value) || 0;
    const installments = parseInt(document.getElementById('installments').value);
    const pfRate = Math.min(parseFloat(document.getElementById('providentFundRate').value) || 0, 10);
    const children = parseInt(document.getElementById('children').value);
    const hhIncome = parseFloat(document.getElementById('hhIncome').value) || 0;
    const rentInput = parseFloat(document.getElementById('rentDeduction').value) || 0;
    const si_monthly_cap = 5742;
    const gesy_monthly_cap = 15000;
    const si_cap = si_monthly_cap * installments; 
    const gesy_cap = gesy_monthly_cap * installments;

    // 1. Mandatory Contributions on Total Annual Gross
    const si = Math.min(gross, si_cap) * 0.088;
    const gesy = Math.min(gross, gesy_cap) * 0.0265;

    // 2. Provident Fund Exclusion (12-month base only)
    const baseMonthlySalary = gross / installments;
    const pf = (baseMonthlySalary * 12) * (pfRate / 100);

    const rentDeduction = Math.min(rentInput, 2000);

    // 3. Family Deduction Logic
    let familyDeduction = 0;
    let threshold = (children <= 2) ? 100000 : (children <= 4 ? 150000 : 200000);
    if (children > 0 && hhIncome <= threshold) {
        if (children >= 1) familyDeduction += 1000;
        if (children >= 2) familyDeduction += 1250;
        if (children >= 3) familyDeduction += (children - 2) * 1500;
    }

    // 4. 2026 Tax Engine (€22k Threshold)
    function computeTax(amount) {
        let t = 0, rem = Math.max(0, amount);
        if (rem > 72000) { t += (rem - 72000) * 0.35; rem = 72000; }
        if (rem > 42000) { t += (rem - 42000) * 0.30; rem = 42000; }
        if (rem > 32000) { t += (rem - 32000) * 0.25; rem = 32000; }
        if (rem > 22000) { t += (rem - 22000) * 0.20; }
        return t;
    }

    // 5. Savings Calculation
    const baseTaxable = gross - si - gesy;
    const baseTax = computeTax(baseTaxable);
    
    const gainPF = baseTax - computeTax(baseTaxable - pf);
    const gainChild = baseTax - computeTax(baseTaxable - familyDeduction);
    const gainRent = baseTax - computeTax(baseTaxable - rentDeduction);

    const actualTaxable = gross - si - gesy - pf - familyDeduction - rentDeduction;
    const actualTax = computeTax(actualTaxable);
    const totalGain = baseTax - actualTax;

    // 6. Output to UI
    const f = (n) => "€" + Math.round(n).toLocaleString();
    const update = (id, val, monthlyBase = installments) => {
        document.getElementById('a' + id).innerText = f(val);
        document.getElementById('m' + id).innerText = f(val / monthlyBase);
    };

    update('Gross', gross, installments);
    update('Soc', si, 12);
    update('Gesy', gesy, 12);
    update('Prov', pf, 12);
    update('Tax', actualTax, 12);
    update('Net', gross - si - gesy - pf - actualTax, installments);

    document.getElementById('sProv').innerText = "+" + f(gainPF);
    document.getElementById('sChild').innerText = "+" + f(gainChild);
    document.getElementById('sRent').innerText = "+" + f(gainRent);
    document.getElementById('tGain').innerText = f(totalGain);
}

calculate();



