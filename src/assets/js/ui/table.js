(function() {
  'use strict';
  class TableComponent {
    constructor(container, data, pageSize = 3, options = {}) {
      this.container = container;
      this.data = data;
      this.filteredData = [...data];
      this.currentPage = 1;
      this.pageSize = pageSize;
      this.sortColumn = null;
      this.sortOrder = 'asc';
      this.autocompleteItems = [];
      this.numericColumns = options.numericColumns || []; // Set numeric columns from options

      this.init();
    }

    init() {
      this.cacheElements();
      this.setupEventListeners();
      this.renderTable();
      this.updatePagination();
      this.buildAutocompleteItems();
    }
    updateData(newData) {
      this.data = newData;
      this.filteredData = [...newData];
      this.currentPage = 1;
      this.buildAutocompleteItems();
      this.renderTable();
      this.updatePagination();
    }
    formatNumericValue(value) {
      // Convert to number if it's a string
      const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

      if (typeof numValue === 'number' && !isNaN(numValue)) {
        const className = (numValue == 0)? 'neutral':((numValue >= 0) ? 'positive' : 'negative');
        return `<span class="value ${className}">${value}</span>`;
      }
      return value;
    }

    cacheElements() {
      this.searchInput = this.container.querySelector('.search-container .inp.search');
      this.autocompleteList = this.container.querySelector('.autocomplete-items');
      this.tableBody = this.container.querySelector('.table-body');
      this.prevPageBtn = this.container.querySelector('.prev-page');
      this.nextPageBtn = this.container.querySelector('.next-page');
      this.pageInfo = this.container.querySelector('.page-info');
      this.headers = this.container.querySelectorAll('th');
    }

    setupEventListeners() {
      // autocomplete
      this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
      this.searchInput.addEventListener('blur', () => setTimeout(() => this.hideAutocomplete(), 200));

      // pagination
      this.prevPageBtn.addEventListener('click', () => this.prevPage());
      this.nextPageBtn.addEventListener('click', () => this.nextPage());

      // sorting
      this.headers.forEach(header => {
        header.addEventListener('click', () => this.sortTable(header));
      });
    }

    buildAutocompleteItems() {
      const allValues = this.data.flatMap(item => Object.values(item));
      this.autocompleteItems = [...new Set(allValues)];
    }

    handleSearch(query) {
      // fire search event
      const searchEvent = new CustomEvent('search', {
        detail: {
          query: query,
          timestamp: new Date()
        },
        bubbles: true
      });
      this.container.dispatchEvent(searchEvent);

      if (query.trim() === '') {
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.renderTable();
        this.updatePagination();
        this.hideAutocomplete();
        return;
      }

      const lowerQuery = query.toLowerCase();
      this.filteredData = this.data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(lowerQuery)
        )
      );

      this.currentPage = 1;
      this.renderTable();
      this.updatePagination();
      this.showAutocomplete(query);
    }

    showAutocomplete(query) {
      this.autocompleteList.innerHTML = '';
      this.autocompleteList.style.display = 'none';

      const matches = this.autocompleteItems
        .filter(item => item.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);

      if (matches.length > 0) {
        matches.forEach(match => {
          const div = document.createElement('div');
          div.className = 'autocomplete-item';
          div.textContent = match;
          div.addEventListener('click', () => {
            this.searchInput.value = match;
            this.handleSearch(match);
            this.hideAutocomplete();
          });
          this.autocompleteList.appendChild(div);
        });
        this.autocompleteList.style.display = 'block';
      }
    }

    hideAutocomplete() {
      this.autocompleteList.style.display = 'none';
    }

    sortTable(header) {
      const column = header.dataset.column;

      if (this.sortColumn === column) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortOrder = 'asc';
      }
      this.headers.forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
      });
      header.classList.add(`sorted-${this.sortOrder}`);

      // fire sorting event
      const sortEvent = new CustomEvent('sort', {
        detail: {
          column: column,
          order: this.sortOrder,
          timestamp: new Date()
        },
        bubbles: true
      });
      this.container.dispatchEvent(sortEvent);

      this.applySort();
      this.renderTable();
      this.updatePagination();
    }

    applySort() {
      if (!this.sortColumn) return;

      const direction = this.sortOrder === 'asc' ? 1 : -1;
      this.filteredData.sort((a, b) => {
        const aValue = String(a[this.sortColumn]).toLowerCase();
        const bValue = String(b[this.sortColumn]).toLowerCase();

        if (aValue < bValue) return -1 * direction;
        if (aValue > bValue) return 1 * direction;
        return 0;
      });
    }

    renderTable() {
      this.tableBody.innerHTML = '';

      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      const pageData = this.filteredData.slice(start, end);

      // Get column headers to match data keys
      const headers = this.container.querySelectorAll('th');
      const columnKeys = Array.from(headers).map(header => header.dataset.column);

      pageData.forEach(item => {
        const row = document.createElement('tr');
        columnKeys.forEach((key, index) => {
          const cell = document.createElement('td');
          const value = item[key];

          // Check if this column should be formatted as numeric
          if (this.numericColumns.includes(key)) {
            cell.innerHTML = this.formatNumericValue(value);
          } else {
            cell.innerHTML = `<span class="value">${value}</span>`;
          }
          row.appendChild(cell);
        });
        this.tableBody.appendChild(row);
      });

      this.prevPageBtn.disabled = this.currentPage === 1;
      this.nextPageBtn.disabled = end >= this.filteredData.length;
    }

    updatePagination() {
      const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
      this.pageInfo.textContent = `Страница ${this.currentPage} из ${totalPages}`;
    }

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTable();
        this.updatePagination();

        //fire pagination events
        const pageEvent = new CustomEvent('pagechange', {
          detail: {
            page: this.currentPage,
            timestamp: new Date()
          },
          bubbles: true
        });
        this.container.dispatchEvent(pageEvent);
      }
    }

    nextPage() {
      const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderTable();
        this.updatePagination();

        //fire pagination events
        const pageEvent = new CustomEvent('pagechange', {
          detail: {
            page: this.currentPage,
            timestamp: new Date()
          },
          bubbles: true
        });
        this.container.dispatchEvent(pageEvent);
      }
    }
  }

  // init All
  // table1 data
  /*const sampleData1 = [
    { name: 'Анна Иванова', email: 'anna@example.com', role: 'Администратор' },
    { name: 'Пётр Сидоров', email: 'peter@example.com', role: 'Модератор' },
    { name: 'Мария Петрова', email: 'maria@example.com', role: 'Пользователь' },
    { name: 'Иван Кузнецов', email: 'ivan@example.com', role: 'Гость' },
    { name: 'Ольга Смирнова', email: 'olga@example.com', role: 'Администратор' },
    { name: 'Алексей Попов', email: 'alex@example.com', role: 'Модератор' },
    { name: 'Елена Волкова', email: 'elena@example.com', role: 'Пользователь' },
    { name: 'Дмитрий Новиков', email: 'dmitry@example.com', role: 'Гость' }
  ];

  // table2 data
  const sampleData2 = [
    { product: 'Ноутбук', price: '50 000 руб.', category: 'Электроника' },
    { product: 'Мышь', price: '1 500 руб.', category: 'Аксессуары' },
    { product: 'Клавиатура', price: '3 000 руб.', category: 'Аксессуары' },
    { product: 'Монитор', price: '25 000 руб.', category: 'Электроника' }
  ];
  document.addEventListener('DOMContentLoaded', () => {
    const tableContainers = document.querySelectorAll('.table-component');

    tableContainers.forEach((container, index) => {
      // apply data
      const data = index === 0 ? sampleData1 : sampleData2;
      new UiTable(container, data, 3);
    });
  });*/
/* events handling
  const tableContainers = document.querySelectorAll('.table-component');

  tableContainers.forEach((container, index) => {
    const data = index === 0 ? sampleData1 : sampleData2;
    const tableInstance = new UiTable(container, data, 3);

    // search event
    container.addEventListener('search', (e) => {
      console.log('Поиск:', e.detail.query);
    });

    // sort event
    container.addEventListener('sort', (e) => {
      console.log('Сортировка:', e.detail.column, e.detail.order);
    });

    // pagechange event
    container.addEventListener('pagechange', (e) => {
      console.log('Страница:', e.detail.page);
    });
  });
*/
  window.UiTable = TableComponent;
})();
/* USAGE example
*
// get obj while init
const table1 = new UiTable(container1, sampleData1, 3);

// update data later
table1.updateData(newSampleData);

* */
