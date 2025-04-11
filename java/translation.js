function changeLanguage(lang) {
    // Store the selected language in localStorage
    localStorage.setItem('selectedLanguage', lang);
    
    const translations = {
        en: {
            trgrossYearlySalary: "Annual Gross:",
            trnetYearlySalary: "Annual Net:",
            trgrossMonthlySalary: "Monthly Gross:",
            trnetMonthlySalary: "Monthly Net:",
            mainTableCaption: "In detail",
            yearlyHeader: "Annually",
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
            untilHeader: "Until",
            trProvidentFundPercentage: "Provident Fund (%):",
            trThirteenthSalary: "13th salary",
            totalDeductionsHeader: "Total Deductions"
        },
        gr: {
            trgrossYearlySalary: "Ετήσιος μικτός:",
            trnetYearlySalary: "Ετήσιος καθαρός:",
            trgrossMonthlySalary: "Μηνιαίο μικτός:",
            trnetMonthlySalary: "Μηνιαίο Καθαρό:",
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
            untilHeader: "Μέχρι",
            trProvidentFundPercentage: "Ταμείο Προνοίας (%):",
            trThirteenthSalary: "13ος μισθός",
            totalDeductionsHeader: "Συνολικές Κρατήσεις"
        },
        ru: {
            trgrossYearlySalary: "Годовая валовая:",
            trnetYearlySalary: "Годовая чистая:",
            trgrossMonthlySalary: "Ежемесячный валовой:",
            trnetMonthlySalary: "Ежемесячно нетто:",
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
            untilHeader: "До",
            trProvidentFundPercentage: "Пенсионный фонд (%):",
            trThirteenthSalary: "13-я зарплата",
            totalDeductionsHeader: "Общие Вычеты"
        },
        ua: {
          trgrossYearlySalary: "Річна валова:",
          trnetYearlySalary: "Річна чиста:",
          trgrossMonthlySalary: "Місячна валова:",
          trnetMonthlySalary: "Місячна чиста:",
          yearlyHeader: "Щорічно",
          monthlyHeader: "Щомісячно",
          grossHeader: "Валовий",
          taxHeader: "Податок",
          socialHeader: "Соціальний",
          gesiHeader: "ГЕСИ",
          yearlyDeductionsHeader: "Річні відрахування",
          deductedPercentageHeader: "Відсоток відрахувань",
          netHeader: "Чистий",
          taxBracketHeader: "Податковий діапазон",
          rateHeader: "Ставка",
          taxDeductedHeader: "Вирахуваний податок",
          fromHeader: "Від",
          untilHeader: "До",
          trProvidentFundPercentage: "Пенсійний фонд (%):",
          trThirteenthSalary: "13-та зарплата",
          totalDeductionsHeader: "Загальні відрахування"
        },
        bg: {
            trgrossYearlySalary: "Годишна брутна:",
            trnetYearlySalary: "Годишна нетна:",
            trgrossMonthlySalary: "Месечен брутен:",
            trnetMonthlySalary: "Месечен нетен:",
            yearlyHeader: "Годишно",
            monthlyHeader: "Месечно",
            grossHeader: "Брутно",
            taxHeader: "Данък",
            socialHeader: "Социално осигуряване",
            gesiHeader: "Здравно осигуряване",
            yearlyDeductionsHeader: "Годишни удръжки",
            deductedPercentageHeader: "Процент на удръжките",
            netHeader: "Нетно",
            taxBracketHeader: "Данъчна скала",
            rateHeader: "Процент",
            taxDeductedHeader: "Удържан данък",
            fromHeader: "От",
            untilHeader: "До",
            trProvidentFundPercentage: "Пенсионен фонд (%):",
            trThirteenthSalary: "13-та заплата",
            totalDeductionsHeader: "Общо удръжки"
        },
        ro: {
            trgrossYearlySalary: "Salariu brut anual:",
            trnetYearlySalary: "Salariu net anual:",
            trgrossMonthlySalary: "Salariu brut lunar:",
            trnetMonthlySalary: "Salariu net lunar:",
            yearlyHeader: "Anual",
            monthlyHeader: "Lunar",
            grossHeader: "Brut",
            taxHeader: "Impozit",
            socialHeader: "Asigurări sociale",
            gesiHeader: "GESI",
            yearlyDeductionsHeader: "Deduceri anuale",
            deductedPercentageHeader: "Procent dedus",
            netHeader: "Net",
            taxBracketHeader: "Tranză de impozitare",
            rateHeader: "Rată",
            taxDeductedHeader: "Impozit dedus",
            fromHeader: "De la",
            untilHeader: "Până la",
            trProvidentFundPercentage: "Fond de pensii (%):",
            trThirteenthSalary: "Al 13-lea salariu",
            totalDeductionsHeader: "Deduceri totale"
        },
        ph: {
            trgrossYearlySalary: "Taunang Kabuuang:",
            trnetYearlySalary: "Taunang Netong:",
            trgrossMonthlySalary: "Buwanang Kabuuan:",
            trnetMonthlySalary: "Buwanang Nakuha:",
            yearlyHeader: "Taunan",
            monthlyHeader: "Buwanang",
            grossHeader: "Kabuuan",
            taxHeader: "Buwis",
            socialHeader: "Panlipunan",
            gesiHeader: "GESI",
            yearlyDeductionsHeader: "Taunang Mga Bawas",
            deductedPercentageHeader: "Nabawasan na Porsyento",
            netHeader: "Nakuha",
            taxBracketHeader: "Saklaw ng Buwis",
            rateHeader: "Porsyento",
            taxDeductedHeader: "Ibawas na Buwis",
            fromHeader: "Mula sa",
            untilHeader: "Hanggang sa",
            trProvidentFundPercentage: "Pondong Probidente (%):",
            trThirteenthSalary: "Ika-13 na sahod",
            totalDeductionsHeader: "Kabuuang mga Bawas"
        },
        hi: {
            trgrossYearlySalary: "वार्षिक सकल:",
            trnetYearlySalary: "वार्षिक शुद्ध:",
            trgrossMonthlySalary: "मासिक सकल:",
            trnetMonthlySalary: "मासिक शुद्ध:",
            yearlyHeader: "वार्षिक",
            monthlyHeader: "मासिक",
            grossHeader: "सकल",
            taxHeader: "कर",
            socialHeader: "सामाजिक सुरक्षा",
            gesiHeader: "GESI",
            yearlyDeductionsHeader: "वार्षिक कटौती",
            deductedPercentageHeader: "कटी हुई प्रतिशत",
            netHeader: "शुद्ध",
            taxBracketHeader: "कर स्लैब",
            rateHeader: "दर",
            taxDeductedHeader: "कटौती की गई कर राशि",
            fromHeader: "से",
            untilHeader: "तक",
            trProvidentFundPercentage: "भविष्य निधि (%):",
            trThirteenthSalary: "13वां वेतन",
            totalDeductionsHeader: "कुल कटौती"
        }
    };
  
    const elementsToTranslate = [
        'trgrossMonthlySalary', 'trnetMonthlySalary', 'yearlyHeader', 'trnetYearlySalary', 
        'trgrossYearlySalary', 'monthlyHeader', 'grossHeader', 'taxHeader', 'socialHeader', 
        'gesiHeader', 'yearlyDeductionsHeader', 'deductedPercentageHeader', 'netHeader',
        'taxBracketHeader', 'rateHeader', 'taxDeductedHeader', 'fromHeader', 'untilHeader',
        'trProvidentFundPercentage', 'trThirteenthSalary', 'totalDeductionsHeader',
        'yearlyHeader2', 'monthlyHeader2', 'grossHeader2', 'netHeader2'
    ];
  
    elementsToTranslate.forEach(id => {
        const element = document.getElementById(id);
        if (element && translations[lang][id]) {
            element.innerText = translations[lang][id];
        }
    });

    // Also update the duplicate elements in other tabs
    if (translations[lang]['yearlyHeader']) {
        const yearlyHeader2 = document.getElementById('yearlyHeader2');
        if (yearlyHeader2) yearlyHeader2.innerText = translations[lang]['yearlyHeader'];
    }
    
    if (translations[lang]['monthlyHeader']) {
        const monthlyHeader2 = document.getElementById('monthlyHeader2');
        if (monthlyHeader2) monthlyHeader2.innerText = translations[lang]['monthlyHeader'];
    }
    
    if (translations[lang]['grossHeader']) {
        const grossHeader2 = document.getElementById('grossHeader2');
        if (grossHeader2) grossHeader2.innerText = translations[lang]['grossHeader'];
    }
    
    if (translations[lang]['netHeader']) {
        const netHeader2 = document.getElementById('netHeader2');
        if (netHeader2) netHeader2.innerText = translations[lang]['netHeader'];
    }
}