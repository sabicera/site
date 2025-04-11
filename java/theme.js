// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved theme preference and apply it
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Add event listener to the theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            
            // Save theme preference
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Dispatch an event to notify other scripts about theme change
            document.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme: isDarkMode ? 'dark' : 'light' }
            }));
        });
    }
    
    // Set background image opacity based on theme
    function adjustBackgroundImage() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const bodyStyle = document.body.style;
        
        // Keep the original background image but add an overlay in dark mode
        if (isDarkMode) {
            bodyStyle.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("./images/cyprus.webp")';
        } else {
            bodyStyle.backgroundImage = 'url("./images/cyprus.webp")';
        }
    }
    
    // Adjust background on initial load
    adjustBackgroundImage();
    
    // Listen for theme changes to adjust background
    document.addEventListener('themeChanged', function() {
        adjustBackgroundImage();
    });
});