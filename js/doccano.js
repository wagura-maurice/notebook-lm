// js/doccano.js

document.addEventListener('DOMContentLoaded', function() {
  // Initialize collapsible sections
  initCollapsibleSections();
  
  // Handle section triggers
  document.addEventListener('click', function(e) {
    // Check if the click was on a section trigger or its children
    const trigger = e.target.closest('.section-trigger');
    if (trigger) {
      e.preventDefault();
      
      // Find the parent section
      const section = trigger.closest('.document-section');
      if (!section) return;
      
      // Toggle the active class on the section
      section.classList.toggle('is-active');
      
      // Toggle the chevron icon
      const icon = trigger.querySelector('.section-icon');
      if (icon) {
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
      }
      
      // Toggle the content visibility
      const content = section.querySelector('.section-content');
      if (content) {
        content.classList.toggle('hidden');
      }
    }
  });
});

// Initialize all collapsible sections
function initCollapsibleSections() {
  const sections = document.querySelectorAll('.document-section');
  sections.forEach(section => {
    const content = section.querySelector('.section-content');
    const icon = section.querySelector('.section-icon');
    
    // Ensure content is hidden by default
    if (content) {
      content.classList.add('hidden');
    }
    
    // Ensure chevron points down by default
    if (icon) {
      icon.classList.add('fa-chevron-down');
      icon.classList.remove('fa-chevron-up');
    }
  });
}