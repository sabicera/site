document.addEventListener('DOMContentLoaded', function() {
	const yearlySalaryInput = document.getElementById('grossYearlySalary');
	const monthlySalaryInput = document.getElementById('grossMonthlySalary');
	const yearlyNetInput = document.getElementById('netYearlySalary');
	const monthlyNetInput = document.getElementById('netMonthlySalary');

	// Set max length for inputs
	[yearlySalaryInput, monthlySalaryInput, yearlyNetInput, monthlyNetInput].forEach(input => {
		input.setAttribute('maxlength', '8');
	});

	yearlySalaryInput.addEventListener('input', function() {
		const grossYearly = parseFloat(removeCommas(yearlySalaryInput.value));
		if (!isNaN(grossYearly)) {
			monthlySalaryInput.value = formatNumber((grossYearly / 12).toFixed(2));
			calculateTaxFromGross(grossYearly);
		}
	});

	monthlySalaryInput.addEventListener('input', function() {
		const grossMonthly = parseFloat(removeCommas(monthlySalaryInput.value));
		if (!isNaN(grossMonthly)) {
			yearlySalaryInput.value = formatNumber((grossMonthly * 12).toFixed(2));
			calculateTaxFromGross(grossMonthly * 12);
		}
	});

	yearlyNetInput.addEventListener('input', function() {
		const netYearly = parseFloat(removeCommas(yearlyNetInput.value));
		if (!isNaN(netYearly)) {
			monthlyNetInput.value = formatNumber((netYearly / 12).toFixed(2));
			calculateGrossFromNet(netYearly);
		}
	});

	monthlyNetInput.addEventListener('input', function() {
		const netMonthly = parseFloat(removeCommas(monthlyNetInput.value));
		if (!isNaN(netMonthly)) {
			yearlyNetInput.value = formatNumber((netMonthly * 12).toFixed(2));
			calculateGrossFromNet(netMonthly * 12);
		}
	});
});

function calculateTaxFromGross(grossSalary) {
	let tax = 0;
	let tax0 = 0,
		tax20 = 0,
		tax25 = 0,
		tax30 = 0,
		tax35 = 0;

	if (grossSalary > 60000) {
		tax35 = (grossSalary - 60000) * 0.35;
		tax30 = (60000 - 36300) * 0.30;
		tax25 = (36300 - 28000) * 0.25;
		tax20 = (28000 - 19500) * 0.20;
		tax0 = 19500 * 0; // No tax for first 19500
	} else if (grossSalary > 36300) {
		tax30 = (grossSalary - 36300) * 0.30;
		tax25 = (36300 - 28000) * 0.25;
		tax20 = (28000 - 19500) * 0.20;
		tax0 = 19500 * 0;
	} else if (grossSalary > 28000) {
		tax25 = (grossSalary - 28000) * 0.25;
		tax20 = (28000 - 19500) * 0.20;
		tax0 = 19500 * 0;
	} else if (grossSalary > 19500) {
		tax20 = (grossSalary - 19500) * 0.20;
		tax0 = 19500 * 0;
	} else {
		tax0 = grossSalary * 0; // All income is tax-free if below 19500
	}

	tax = tax35 + tax30 + tax25 + tax20 + tax0;

	// Apply the social deduction with a maximum of 62.868
	let social = grossSalary * 0.088;
	if (social > 62868) {
		social = 62868;
	}

	const gesi = grossSalary * 0.0265;

	const totalDeductions = tax + social + gesi;
	const netYear = grossSalary - totalDeductions;
	const netMonth = netYear / 12;
	const deductionsMonth = totalDeductions / 12;

	updateMainTable(grossSalary, tax, social, gesi, netYear, totalDeductions, netMonth, deductionsMonth);
	updateBracketTable(tax0, tax20, tax25, tax30, tax35);

	// Update net salary inputs
	document.getElementById('netYearlySalary').value = formatNumber(netYear.toFixed(2));
	document.getElementById('netMonthlySalary').value = formatNumber(netMonth.toFixed(2));
}

function calculateGrossFromNet(netSalary) {
	let estimatedGross = netSalary;
	let step = 1000;

	while (step > 0.01) {
		let calculatedNet = estimatedGross - calculateTotalDeductions(estimatedGross);
		if (calculatedNet < netSalary) {
			estimatedGross += step;
		} else if (calculatedNet > netSalary) {
			estimatedGross -= step;
			step /= 2; // Decrease step size for finer adjustments
		} else {
			break;
		}
	}

	const grossYear = estimatedGross;
	const grossMonth = grossYear / 12;

	document.getElementById('grossYearlySalary').value = formatNumber(grossYear.toFixed(2));
	document.getElementById('grossMonthlySalary').value = formatNumber(grossMonth.toFixed(2));

	// Calculate tax components
	let tax = 0,
		tax0 = 0,
		tax20 = 0,
		tax25 = 0,
		tax30 = 0,
		tax35 = 0;
	if (grossYear > 60000) {
		tax35 = (grossYear - 60000) * 0.35;
		tax30 = (60000 - 36300) * 0.30;
		tax25 = (36300 - 28000) * 0.25;
		tax20 = (28000 - 19500) * 0.20;
		tax0 = 19500 * 0;
	} else if (grossYear > 36300) {
		tax30 = (grossYear - 36300) * 0.30;
		tax25 = (36300 - 28000) * 0.25;
		tax20 = (28000 - 19500) * 0.20;
		tax0 = 19500 * 0;
	} else if (grossYear > 28000) {
		tax25 = (grossYear - 28000) * 0.25;
		tax20 = (28000 - 19500) * 0.20;
		tax0 = 19500 * 0;
	} else if (grossYear > 19500) {
		tax20 = (grossYear - 19500) * 0.20;
		tax0 = 19500 * 0;
	} else {
		tax0 = grossYear * 0;
	}
	tax = tax35 + tax30 + tax25 + tax20 + tax0;

	// Apply the social deduction with a maximum of 62.868
	let social = grossYear * 0.088;
	if (social > 62868) {
		social = 62868;
	}

	const gesi = grossYear * 0.0265;
	const totalDeductions = tax + social + gesi;
	const deductionsMonth = totalDeductions / 12;

	updateMainTable(grossYear, tax, social, gesi, netSalary, totalDeductions, netSalary / 12, deductionsMonth);
	updateBracketTable(tax0, tax20, tax25, tax30, tax35);
}

function calculateTotalDeductions(grossSalary) {
	let tax = 0;
	if (grossSalary > 60000) {
		tax = (grossSalary - 60000) * 0.35 + (60000 - 36300) * 0.30 + (36300 - 28000) * 0.25 + (28000 - 19500) * 0.20;
	} else if (grossSalary > 36300) {
		tax = (grossSalary - 36300) * 0.30 + (36300 - 28000) * 0.25 + (28000 - 19500) * 0.20;
	} else if (grossSalary > 28000) {
		tax = (grossSalary - 28000) * 0.25 + (28000 - 19500) * 0.20;
	} else if (grossSalary > 19500) {
		tax = (grossSalary - 19500) * 0.20;
	}

	// Apply the social deduction with a maximum of 62.868
	let social = grossSalary * 0.088;
	if (social > 62.868) {
		social = 62.868;
	}

	const gesi = grossSalary * 0.0265;

	return tax + social + gesi;
}


function updateMainTable(grossSalary, tax, social, gesi, netYear, totalDeductions, netMonth, deductionsMonth) {
	document.getElementById('gross').textContent = '€' + formatNumber(grossSalary.toFixed(2));
	document.getElementById('monthlygross').textContent = '€' + formatNumber((grossSalary / 12).toFixed(2));
	document.getElementById('tax').textContent = '- €' + formatNumber(tax.toFixed(2));
	document.getElementById('monthlytax').textContent = '- €' + formatNumber((tax / 12).toFixed(2));
	document.getElementById('social').textContent = '- €' + formatNumber(social.toFixed(2));
	document.getElementById('monthlysocial').textContent = '- €' + formatNumber((social / 12).toFixed(2));
	document.getElementById('gesi').textContent = '- €' + formatNumber(gesi.toFixed(2));
	document.getElementById('monthlygesi').textContent = '- €' + formatNumber((gesi / 12).toFixed(2));
	document.getElementById('netYear').textContent = '€' + formatNumber(netYear.toFixed(2));
	document.getElementById('deductionsYear').textContent = '- €' + formatNumber(totalDeductions.toFixed(2));
	document.getElementById('deductionsYearPercentage').textContent = '-' + ((totalDeductions / grossSalary) * 100).toFixed(2) + '%';
	document.getElementById('netMonth').textContent = '€' + formatNumber(netMonth.toFixed(2));
	document.getElementById('deductionsMonth').textContent = '- €' + formatNumber(deductionsMonth.toFixed(2));
}

function updateBracketTable(tax0, tax20, tax25, tax30, tax35) {
	document.getElementById('tax0').textContent = '€' + formatNumber(tax0.toFixed(2));
	document.getElementById('tax20').textContent = '€' + formatNumber(tax20.toFixed(2));
	document.getElementById('tax25').textContent = '€' + formatNumber(tax25.toFixed(2));
	document.getElementById('tax30').textContent = '€' + formatNumber(tax30.toFixed(2));
	document.getElementById('tax35').textContent = '€' + formatNumber(tax35.toFixed(2));
}

function formatNumber(num) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function removeCommas(numStr) {
	return numStr.replace(/,/g, '');
}
