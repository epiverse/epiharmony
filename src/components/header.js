export class Header {
  constructor() {
    this.headerElement = document.getElementById('app-header');
    this.init();
  }

  init() {
    if (!this.headerElement) {
      console.error('Header element not found');
      return;
    }

    this.addEventListeners();
    this.checkScrollPosition();
  }

  addEventListeners() {
    window.addEventListener('scroll', () => this.checkScrollPosition());

    const githubLink = this.headerElement.querySelector('a[href*="github"]');
    if (githubLink) {
      githubLink.addEventListener('click', (e) => {
        console.log('Opening GitHub repository');
      });
    }
  }

  checkScrollPosition() {
    const scrollPosition = window.scrollY;

    if (scrollPosition > 50) {
      this.headerElement.classList.add('shadow-xl');
    } else {
      this.headerElement.classList.remove('shadow-xl');
    }
  }

  updateTitle(newTitle) {
    const titleElement = this.headerElement.querySelector('h1');
    if (titleElement) {
      titleElement.textContent = newTitle;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-4 py-2 rounded-lg shadow-md z-50 ${
      type === 'error' ? 'bg-red-500' :
      type === 'success' ? 'bg-green-500' :
      'bg-amber-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
}

export function initHeader() {
  return new Header();
}