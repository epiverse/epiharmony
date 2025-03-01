import './style.css'

import {ui} from './src/gui.js';


function setupNavigation() {
    const appMap = {
        'Vocabulary Mapper': document.getElementById('vocabulary-mapper-app'),
        'Data Transform': document.getElementById('data-transform-app'),
        'Quality Control': document.getElementById('quality-control-app')
    };

    // Dropdown listener (mobile users)
    const navSelect = document.getElementById('nav-select');
    navSelect.addEventListener('change', (event) => {
        const selectedTab = event.target.value;
        // Hide all app containers
        Object.values(appMap).forEach((div) => div.classList.add('hidden'));
        // Display the selected tab's container
        if (appMap[selectedTab]) {
            appMap[selectedTab].classList.remove('hidden');
        }
    });

    // Tabs listener (desktop users)
    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();

            // Reset all tabs to default gray style
            tabLinks.forEach((otherLink) => {
                otherLink.classList.remove('border-2', 'border-amber-500', 'text-amber-600', 'rounded-t-md');
                otherLink.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-600', 'hover:border-gray-300');
                const icon = otherLink.querySelector('.logo-icon');
                if (icon) {
                    icon.classList.remove('text-amber-600');
                    icon.classList.add('text-gray-500', 'group-hover:text-gray-600');
                }
                otherLink.removeAttribute('aria-current');
            });

            // Apply the selected style to the clicked tab
            link.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-600', 'hover:border-gray-300');
            link.classList.add('border-2', 'border-amber-500', 'text-amber-600', 'rounded-t-md');
            const icon = link.querySelector('.logo-icon');
            if (icon) {
                icon.classList.remove('text-gray-500', 'group-hover:text-gray-600');
                icon.classList.add('text-amber-600');
            }
            link.setAttribute('aria-current', 'page');

            // Hide all content containers and then show the container for the selected tab
            Object.values(appMap).forEach((div) => div.classList.add('hidden'));
            const tabName = link.dataset.tabname;
            if (appMap[tabName]) {
                appMap[tabName].classList.remove('hidden');
            }
        });
    });

    // On page load, ensure the default selected tab's content is visible.
    const defaultTab = document.querySelector('.tab-link[aria-current="page"]');
    if (defaultTab) {
        const tabName = defaultTab.dataset.tabname;
        if (appMap[tabName]) {
            appMap[tabName].classList.remove('hidden');
        }
    }
}


function init() {
    ui('app');
    setupNavigation();
}

document.addEventListener('DOMContentLoaded', init);