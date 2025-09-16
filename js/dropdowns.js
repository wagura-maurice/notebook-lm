// Initialize dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile avatar dropdown
    const mobileDropdownTrigger = document.getElementById('avatar-dropdown-trigger');
    const mobileDropdown = document.getElementById('avatar-dropdown');
    
    // Desktop profile dropdown
    const desktopDropdownTrigger = document.getElementById('profile-dropdown-trigger');
    const desktopDropdown = document.getElementById('profile-dropdown');
    
    // Toggle mobile dropdown
    if (mobileDropdownTrigger && mobileDropdown) {
        mobileDropdownTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileDropdown.classList.toggle('hidden');
            
            // Position the dropdown for mobile
            if (!mobileDropdown.classList.contains('hidden') && window.innerWidth < 1024) {
                const rect = mobileDropdownTrigger.getBoundingClientRect();
                mobileDropdown.style.position = 'fixed';
                mobileDropdown.style.top = `${rect.bottom + window.scrollY}px`;
                mobileDropdown.style.right = '1rem';
                mobileDropdown.style.zIndex = '1000'; // Ensure it's above mobile tabs (which are usually z-10 or z-20)
            }
        });
    }
    
    // Toggle desktop dropdown
    if (desktopDropdownTrigger && desktopDropdown) {
        desktopDropdownTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            desktopDropdown.classList.toggle('hidden');
            desktopDropdown.classList.toggle('opacity-0');
            desktopDropdown.classList.toggle('translate-y-2');
            
            // Toggle aria-expanded
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        // Mobile dropdown
        if (mobileDropdown && mobileDropdownTrigger && 
            !mobileDropdown.contains(e.target) && 
            !mobileDropdownTrigger.contains(e.target)) {
            mobileDropdown.classList.add('hidden');
        }
        
        // Desktop dropdown
        if (desktopDropdown && desktopDropdownTrigger && 
            !desktopDropdown.contains(e.target) && 
            !desktopDropdownTrigger.contains(e.target)) {
            desktopDropdown.classList.add('hidden', 'opacity-0', 'translate-y-2');
            if (desktopDropdownTrigger) {
                desktopDropdownTrigger.setAttribute('aria-expanded', 'false');
            }
        }
    });
    
    // Close dropdowns when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (mobileDropdown) mobileDropdown.classList.add('hidden');
            if (desktopDropdown) {
                desktopDropdown.classList.add('hidden', 'opacity-0', 'translate-y-2');
                if (desktopDropdownTrigger) {
                    desktopDropdownTrigger.setAttribute('aria-expanded', 'false');
                }
            }
        }
    });
    
    // Handle dropdown menu item clicks
    function setupDropdownMenuItems(dropdown) {
        if (!dropdown) return;
        
        const menuItems = dropdown.querySelectorAll('a[role="menuitem"]');
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                // Close the dropdown
                const dropdown = this.closest('[role="menu"]');
                if (dropdown) {
                    dropdown.classList.add('hidden');
                    if (desktopDropdown && dropdown === desktopDropdown) {
                        dropdown.classList.add('opacity-0', 'translate-y-2');
                        if (desktopDropdownTrigger) {
                            desktopDropdownTrigger.setAttribute('aria-expanded', 'false');
                        }
                    }
                }
                console.log('Clicked:', this.textContent.trim());
                // Add your navigation logic here
            });
        });
    }
    
    // Set up menu items for both dropdowns
    setupDropdownMenuItems(mobileDropdown);
    setupDropdownMenuItems(desktopDropdown);
});
