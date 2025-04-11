document.addEventListener('DOMContentLoaded', function() {
    const languageDropdown = document.getElementById('language-dropdown');
    const languageSelect = document.getElementById('language-select');
    const languageOptions = document.querySelectorAll('.language-option');
    
    // Set initial language display
    const currentLang = getCurrentLanguage() || 'en';
    updateLanguageDisplay(currentLang);
    
    // Toggle dropdown when clicked
    languageSelect.addEventListener('click', function() {
        languageDropdown.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!languageDropdown.contains(event.target)) {
            languageDropdown.classList.remove('open');
        }
    });
    
    // Handle language selection
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            changeLanguage(lang);
            updateLanguageDisplay(lang);
            languageDropdown.classList.remove('open');
        });
    });
    
    // Get the current language from localStorage or default to 'en'
    function getCurrentLanguage() {
        return localStorage.getItem('selectedLanguage') || 'gr';
    }
    
    // Update the language display in the dropdown
    function updateLanguageDisplay(lang) {
        const selectedOption = document.querySelector(`.language-option[data-lang="${lang}"]`);
        if (selectedOption) {
            const imgSrc = selectedOption.querySelector('img').src;
            const langName = selectedOption.querySelector('span').textContent;
            
            // Update the language-select display
            languageSelect.innerHTML = `
                <img src="${imgSrc}" alt="${langName}" style="width: 24px; height: 16px; margin-right: 10px;">
                <span>${langName}</span>
            `;
        }
    }
});