import './style.css'

import { ui } from './src/gui.js';



function initApp() {
  ui('app');

  const contentDiv = document.getElementById('content');

  const navSelect = document.getElementById('nav-select');
  navSelect.addEventListener('change', (event) => {
    const selectedOptionText = event.target.value;
    contentDiv.innerHTML = `Mobile tab selected: <strong>${selectedOptionText}</strong>`;
  });

  const tabLinks = document.querySelectorAll('.tab-link');
  tabLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      // Reset all tabs to default gray style
      tabLinks.forEach((otherLink) => {
        otherLink.classList.remove('border-amber-500', 'text-amber-700');
        otherLink.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-600', 'hover:border-gray-300');
        const icon = otherLink.querySelector('.logo-icon');
        if (icon) {
          icon.classList.remove('text-amber-700');
          icon.classList.add('text-gray-500', 'group-hover:text-gray-600');
        }
        otherLink.removeAttribute('aria-current');
      });

      // Apply the selected style to the clicked tab
      link.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-600', 'hover:border-gray-300');
      link.classList.add('border-amber-500', 'text-amber-700');
      const icon = link.querySelector('.logo-icon');
      if (icon) {
        icon.classList.remove('text-gray-500', 'group-hover:text-gray-600');
        icon.classList.add('text-amber-700');
      }
      link.setAttribute('aria-current', 'page');

      // Update content area with the clicked tab's message
      const tabName = link.dataset.tabname;
      contentDiv.innerHTML = `Desktop tab selected: <strong>${tabName}</strong>`;
    });
  });

  // On page load, update the content area with the default selected tab (Vocabulary Mapper)
  const defaultTab = document.querySelector('.tab-link[aria-current="page"]');
  if (defaultTab) {
    const tabName = defaultTab.dataset.tabname;
    contentDiv.innerHTML = `Desktop tab selected: <strong>${tabName}</strong>`;
  }
}

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', initApp);