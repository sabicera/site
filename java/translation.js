function changeLanguage(lang) {
    const translations = {
      en: {
        trgrossYearlySalary: "Yearly Gross Salary:",
        trnetYearlySalary: "Yearly Net Salary",
        trgrossMonthlySalary: "Monthly Gross",
        trnetMonthlySalary: "Monthly Net",
        mainTableCaption: "In detail",
        yearlyHeader: "Yearly",
        monthlyHeader: "Monthly",
        grossHeader: "Gross",
        taxHeader: "Tax",
        socialHeader: "Social",
        gesiHeader: "GESI",
        yearlyDeductionsHeader: "Yearly Deductions",
        deductedPercentageHeader: "Deducted Percentage",
        netHeader: "Net",
        bracketTableCaption: "Tax Breakdown",
        taxBracketHeader: "Tax Bracket",
        rateHeader: "Rate",
        taxDeductedHeader: "Tax Deducted",
        fromHeader: "From",
        untilHeader: "Until"
      },
      gr: {
        trgrossYearlySalary: "Ετήσιος ακαθάριστος μισθός:",
        trnetYearlySalary: "Ετήσιος καθαρός μισθός",
        trgrossMonthlySalary: "Μηνιαίο μικτός",
        trnetMonthlySalary: "Μηνιαίο Καθαρό",
        mainTableCaption: "Αναλυτικά",
        yearlyHeader: "Ετήσιος",
        monthlyHeader: "Μηνιαίος",
        grossHeader: "Ακαθάριστο",
        taxHeader: "Φόρος",
        socialHeader: "Κοινωνικές Ασφαλίσεις",
        gesiHeader: "ΓΕΣΥ",
        yearlyDeductionsHeader: "Ετήσιες Κρατήσεις",
        deductedPercentageHeader: "Ποσοστό Κρατήσεων",
        netHeader: "Καθαρό",
        bracketTableCaption: "Ανάλυση Φόρου",
        taxBracketHeader: "Φορολογική Κλίμακα",
        rateHeader: "Ποσοστό",
        taxDeductedHeader: "Παρακρατήθηκε Φόρος",
        fromHeader: "Από",
        untilHeader: "Μέχρι"
      },
      ru: {
        trgrossYearlySalary: "Годовая валовая зарплата:",
        trnetYearlySalary: "Годовая чистая зарплата",
        trgrossMonthlySalary: "Ежемесячный валовой доход",
        trnetMonthlySalary: "Ежемесячно нетто",
        mainTableCaption: "Подробно",
        yearlyHeader: "Годовой",
        monthlyHeader: "Ежемесячный",
        grossHeader: "Валовой",
        taxHeader: "Налог",
        socialHeader: "Социальное страхование",
        gesiHeader: "ГЕСИ",
        yearlyDeductionsHeader: "Годовые Вычеты",
        deductedPercentageHeader: "Процент Вычетов",
        netHeader: "Чистый",
        bracketTableCaption: "Разбивка Налога",
        taxBracketHeader: "Налоговая Ставка",
        rateHeader: "Процент",
        taxDeductedHeader: "Налог Удержан",
        fromHeader: "От",
        untilHeader: "До"
      }
    };

    const elementsToTranslate = [
      'mainTableCaption', 'trgrossMonthlySalary', 'trnetMonthlySalary','yearlyHeader', 'trnetYearlySalary', 'trgrossYearlySalary', 'monthlyHeader', 'grossHeader', 'taxHeader', 'socialHeader', 'gesiHeader', 'yearlyDeductionsHeader',
      'deductedPercentageHeader', 'netHeader', 'bracketTableCaption',
      'taxBracketHeader', 'rateHeader', 'taxDeductedHeader', 'fromHeader', 'untilHeader'
    ];

    elementsToTranslate.forEach(id => {
      document.getElementById(id).innerText = translations[lang][id];
    });
  }
