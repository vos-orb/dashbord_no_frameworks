(function() {
  'use strict';

  class Calendar {
    constructor(element) {
      this.element = element;
      this.currentDate = new Date();
      this.selectedDate = null;
      this.metaData = {};
      this.popup = null;
      this.yearSelect = null;
      this.monthSelect = null;
      this.hiddenInput = null;

      this.init();
      this.element.dispatchEvent(new CustomEvent('calendarinitialized', {
        detail: { calendar: this },
        bubbles: true
      }));
    }

    init() {
      this.createCalendar();
      this.setupEventListeners();
    }

    createCalendar() {
      this.popup = document.createElement('div');
      this.popup.className = 'calendar-popup';

      // Create year and month dropdowns
      const controls = document.createElement('div');
      controls.className = 'calendar-controls';

      this.yearSelect = document.createElement('select');
      this.yearSelect.className = 'year-select';
      this.populateYearDropdown();

      this.monthSelect = document.createElement('select');
      this.monthSelect.className = 'month-select';
      this.populateMonthDropdown();

      controls.appendChild(this.yearSelect);
      controls.appendChild(this.monthSelect);
      this.popup.appendChild(controls);

      // Create calendar grid
      const calendarGrid = document.createElement('div');
      calendarGrid.className = 'calendar-grid';
      this.popup.appendChild(calendarGrid);

      // Create hidden input for selected date
      this.hiddenInput = document.createElement('input');
      this.hiddenInput.type = 'hidden';
      this.hiddenInput.className = 'calendar-selected-date';
      this.element.appendChild(this.hiddenInput);

      this.element.appendChild(this.popup);
      this.renderCalendar();
    }

    populateYearDropdown() {
      const currentYear = this.currentDate.getFullYear();
      for (let year = currentYear - 10; year <= currentYear + 10; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
          option.selected = true;
        }
        this.yearSelect.appendChild(option);
      }
    }

    populateMonthDropdown() {
      const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ];
      monthNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        if (index === this.currentDate.getMonth()) {
          option.selected = true;
        }
        this.monthSelect.appendChild(option);
      });
    }

    setupEventListeners() {
      // Year and month change events
      this.yearSelect.addEventListener('change', () => {
        this.currentDate.setFullYear(parseInt(this.yearSelect.value, 10));
        this.renderCalendar();
      });

      this.monthSelect.addEventListener('change', () => {
        this.currentDate.setMonth(parseInt(this.monthSelect.value, 10));
        this.renderCalendar();
      });

      // Day selection event
      this.popup.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.calendar-day:not(.disabled)');
        if (dayEl) {
          const day = parseInt(dayEl.dataset.day, 10);
          this.selectDate(day);
        }
      });
    }

    renderCalendar() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday as first day

      // Update year and month dropdowns
      this.yearSelect.value = year;
      this.monthSelect.value = month;

      // Clear calendar grid
      const calendarGrid = this.popup.querySelector('.calendar-grid');
      calendarGrid.innerHTML = '';

      // Add day headers
      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      dayNames.forEach(name => {


        const headerCell = document.createElement('div');
        headerCell.className = 'day-header';


        let headerCellText = document.createElement('div');
        headerCellText.className = 'text';
        headerCellText.textContent = name;


        headerCell.appendChild(headerCellText);
        calendarGrid.appendChild(headerCell);
      });

      // Add days from previous month
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDay; i > 0; i--) {
        this.addDayCell(calendarGrid, prevMonthLastDay - i + 1, 'disabled');
      }

      // Add days from current month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateKey = date.toDateString();
        const metaData = this.metaData[dateKey] || null;
        let classes = '';

        if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
          classes += 'selected';
        }

        this.addDayCell(calendarGrid, day, classes, metaData);
      }

      // Add days from next month
      const totalCells = 42; // 6 weeks × 7 days
      const currentCells = startDay + lastDay.getDate();
      for (let i = 1; i <= totalCells - currentCells; i++) {
        this.addDayCell(calendarGrid, i, 'disabled');
      }
    }

    addDayCell(parent, day, extraClasses = '', metaData = null) {
      const cell = document.createElement('div');
      cell.className = `calendar-day ${extraClasses}${((metaData)?" has-meta":"")}`.trim();
      cell.dataset.day = day;

      const dayContent = document.createElement('div');
      dayContent.className = 'day-content';
      dayContent.textContent = day;

      if (metaData) {
        const metaContent = document.createElement('div');
        metaContent.className = 'meta-content';
        metaContent.innerHTML = metaData;
        dayContent.appendChild(metaContent);
      }

      cell.appendChild(dayContent);
      parent.appendChild(cell);
    }

    selectDate(day) {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const selectedDate = new Date(year, month, day);

      this.selectedDate = selectedDate;
      this.hiddenInput.value = selectedDate.toDateString();

      // Dispatch custom event
      const event = new CustomEvent('dayselected', {
        detail: {
          date: selectedDate
        },
        bubbles: true
      });
      this.element.dispatchEvent(event);

      this.renderCalendar();
    }

    setMeta(metaDataArray) {
      metaDataArray.forEach(item => {
        const dateKey = new Date(item.date).toDateString();
        this.metaData[dateKey] = item.htmltext;
      });
      this.renderCalendar();
    }

    setMetaForDay(date, htmltext) {
      const dateKey = new Date(date).toDateString();
      this.metaData[dateKey] = htmltext;
      this.renderCalendar();
    }
  }

  // Manager for calendar instances
  const CalendarManager = (function() {
    const calendars = [];

    function initAll() {
      document.querySelectorAll('.ui-calendar').forEach(element => {
        if (!element._calendar) {
          const calendar = new Calendar(element);
          element._calendar = calendar;
          calendars.push(calendar);
        }
      });
    }

    function addNewCalendar(element) {
      if (!element._calendar) {
        const calendar = new Calendar(element);
        element._calendar = calendar;
        calendars.push(calendar);
      }
    }

    return {
      initAll,
      addNewCalendar
    };
  })();

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    CalendarManager.initAll();
  });

  // Export
  window.CalendarManager = CalendarManager;
})();
