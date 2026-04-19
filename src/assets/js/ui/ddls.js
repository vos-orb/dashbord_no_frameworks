(function() {
  'use strict';

  class Dropdown {
    constructor(container, options = {}) {
      this.container = container;
      this.toggleButton = container.querySelector('.dropdown-toggle');
      this.menu = container.querySelector('.dropdown-menu');
      this.items = [];
      this.isOpen = false;
      this.options = options;
      this.multiSelect = options.multiSelect || false;
      this.selectedItems = [];
      const existingArrow = this.toggleButton.querySelector('.dropdown-arrow');
      if (!existingArrow) {
        const arrow = document.createElement('span');
        arrow.className = 'dropdown-arrow';
        this.toggleButton.appendChild(arrow);
      }
      this.init();
    }

    init() {
      this.populateList();

      this.toggleButton.addEventListener('click', () => this.toggle());
      //click ouside
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          this.close();
        }
      });
      //keyboard navigation
      this.toggleButton.addEventListener('keydown', (e) => this.handleKeydown(e));

      this.menu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (item) {
          this.selectItem(item);
        }
      });

      this.menu.addEventListener('keydown', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (item) this.handleItemKeydown(e, item);
      });
    }

    async populateList() {
      let data;

      if (typeof this.options.data === 'function') {
        data = await this.options.data();
      } else if (Array.isArray(this.options.data)) {
        data = this.options.data;
      } else {
        data = ['Нет данных'];
      }

      this.renderItems(data || []);
    }

    renderItems(items) {
      this.menu.innerHTML = '';
      items.forEach(itemText => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = itemText;
        item.setAttribute('role', 'menuitem');
        this.menu.appendChild(item);
      });
      this.items = Array.from(this.menu.querySelectorAll('.dropdown-item'));
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.menu.classList.add('show');
      this.toggleButton.setAttribute('aria-expanded', 'true');
      this.isOpen = true;
      this.container.classList.add('expanded');
    }

    close() {
      this.menu.classList.remove('show');
      this.toggleButton.setAttribute('aria-expanded', 'false');
      this.isOpen = false;
      this.container.classList.remove('expanded');
    }

    selectItem(item) {
      const selectedText = item.textContent;
      const itemValue = item.dataset.value || selectedText;
      const arrow = this.toggleButton.querySelector('.dropdown-arrow');
      const arrowHtml = arrow ? arrow.outerHTML : '';

      if (this.multiSelect) { // Multi-select
        const index = this.selectedItems.indexOf(itemValue);

        if (index === -1) { // Add to selection
          this.selectedItems.push(itemValue);
          item.classList.add('selected');
        } else { // Remove from selection
          this.selectedItems.splice(index, 1);
          item.classList.remove('selected');
        }

        // Update button text
        if (this.selectedItems.length === 0) {
          this.toggleButton.innerHTML = this.options.placeholder || 'Select options' + arrowHtml;
        } else if (this.selectedItems.length === 1) {
          this.toggleButton.innerHTML = this.selectedItems[0] + arrowHtml;
        } else {
          this.toggleButton.innerHTML = `${this.selectedItems.length} selected` + arrowHtml;
        }
      } else { // Single select
        this.toggleButton.innerHTML = selectedText + arrowHtml;
        this.items.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.close();
      }

      // callback on select
      if (typeof this.options.onSelect === 'function') {
        this.options.onSelect(this.multiSelect ? this.selectedItems : selectedText);
      }
    }

    handleKeydown(e) {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.toggle();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!this.isOpen) this.open();
          this.focusFirstItem();
          break;
      }
    }

    handleItemKeydown(e, item) {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.selectItem(item);
          break;
        case 'Escape':
          e.preventDefault();
          this.close();
          this.toggleButton.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.focusPreviousItem(item);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.focusNextItem(item);
          break;
      }
    }

    focusFirstItem() {
      if (this.items.length > 0) {
        this.items[0].focus();
      }
    }

    focusNextItem(currentItem) {
      const index = this.items.indexOf(currentItem);
      const nextIndex = (index + 1) % this.items.length;
      this.items[nextIndex].focus();
    }

    focusPreviousItem(currentItem) {
      const index = this.items.indexOf(currentItem);
      const prevIndex = (index - 1 + this.items.length) % this.items.length;
      this.items[prevIndex].focus();
    }
  }

  function initDropdowns(selector = '.dropdown', options = {}) {
    const dropdownContainers = document.querySelectorAll(selector);
    const instances = [];

    dropdownContainers.forEach(container => {
      // Allow per-instance options via data attributes
      const containerOptions = {
        ...options,
        ...(container.dataset.dropdownOptions ? JSON.parse(container.dataset.dropdownOptions) : {}),
        multiSelect: container.hasAttribute('data-multi-select') || options.multiSelect
      };
      const instance = new Dropdown(container, containerOptions);
      instances.push(instance);
    });

    return instances;
  }

  window.initDropdowns = initDropdowns;
})();



