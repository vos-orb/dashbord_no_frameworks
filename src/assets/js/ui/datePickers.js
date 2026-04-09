(function() {
  'use strict';

  class DatePicker {
    constructor(element) {
      this.element = element;
      this.input = element.querySelector('input');
      this.isRange = element.hasAttribute('data-range');
      this.selectedDates = this.isRange ? { start: null, end: null } : null;
      this.currentDate = new Date();
      this.popup = null;

      this.init();
    }

    init() {
      this.createPopup();
      this.setupEventListeners();
    }

    createPopup() {
      this.popup = document.createElement('div');
      this.popup.className = 'datepicker-popup';

      const clearButton = document.createElement('button');
        clearButton.className = 'clear-button';
        clearButton.innerHTML = '×';
        clearButton.title = 'Очистить выбор';
        clearButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clearSelection();
        })
      ;
      this.input.parentNode.appendChild(clearButton);

      this.popup.innerHTML = `
<div class="datepicker-header">
  <button class="prev-month">‹</button>
  <span class="current-month"></span>
  <button class="next-month">›</button>
</div>
${this.isRange ? `
  <div class="period-buttons">
    <button data-days="7">7 дней</button>
    <button data-days="30" class="active">30 дней</button>
    <button data-days="90">90 дней</button>
    <button data-days="180">180 дней</button>
  </div>
` : ''}
<div class="calendar-grid"></div>
${this.isRange ? `
  <div class="datepicker-footer">
    <button class="apply-dates">Применить</button>
  </div>
` : ''}
      `;
      this.element.appendChild(this.popup);
      this.renderCalendar();
    }

    updatePeriodButtons(selectedDays) {
      this.popup.querySelectorAll('.period-buttons button').forEach(btn => {
        const isSelected = selectedDays !== null &&
          parseInt(btn.dataset.days, 10) === selectedDays;
        btn.classList.toggle('active', isSelected);
      });
    }

    setupEventListeners() {
      // open calender
      this.input.addEventListener('focus', () => this.show());
      this.input.addEventListener('click', (e) => {
        e.stopPropagation();
        this.show();
      });

      // click outside calender
      document.addEventListener('click', (e) => {
        const isClickOnCalendarDay = e.target.closest('.calendar-day');
        if (!this.element.contains(e.target) && !isClickOnCalendarDay) {
          this.hide();
        }
      });

      // navigate months
      this.popup.querySelector('.prev-month').addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
      });
      this.popup.querySelector('.next-month').addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
      });

      // choose date
      this.popup.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.calendar-day:not(.disabled)');
        if (dayEl) {
          this.selectDate(parseInt(dayEl.dataset.day, 10));
        }
      });

      // period-buttons
      if (this.isRange) {
        this.popup.querySelectorAll('.period-buttons button').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const days = parseInt(e.target.dataset.days, 10);
            this.setPeriod(days);
          });
        });

        // apply button
        this.popup.querySelector('.apply-dates').addEventListener('click', () => {
          this.applyRange();
        });
      }
    }
    clearSelection() {
      if (this.isRange) {
        this.selectedDates.start = null;
        this.selectedDates.end = null;
      } else {
        this.selectedDates = null;
      }
      this.updateInput();
      this.renderCalendar();
    }

    show() {
      if (this.isRange) {
        this.selectedDates.start = null;
        this.selectedDates.end = null;
      }
      this.popup.classList.add('show');
      this.renderCalendar();
      if (this.isRange) {
        this.updatePeriodButtons(null); // Сбрасываем выделение всех кнопок
      }
    }

    hide() {
      this.popup.classList.remove('show');
    }

    renderCalendar() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Понедельник — первый день недели

      // update months titles
      const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ];
      this.popup.querySelector('.current-month').textContent =
        `${monthNames[month]} ${year}`;

      // Clear calendar grid
      const calendarGrid = this.popup.querySelector('.calendar-grid');
      calendarGrid.innerHTML = '';

      // titles of week days
      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      dayNames.forEach(name => {
        const headerCell = document.createElement('div');
        headerCell.className = 'day-header';
        headerCell.textContent = name;
        calendarGrid.appendChild(headerCell);
      });

      // prev month days prefill
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDay; i > 0; i--) {
        this.addDayCell(calendarGrid, prevMonthLastDay - i + 1, 'disabled');
      }

      // fill current month with days
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        let classes = '';

        if (this.isRange) {
          //highlight one date if chosen
          if (this.selectedDates.start && !this.selectedDates.end) {
            if (date.toDateString() === this.selectedDates.start.toDateString()) {
              classes += 'start-date';
            }
          }
          // highlight period if selected
          else if (this.selectedDates.start && this.selectedDates.end) {
            if (date >= this.selectedDates.start && date <= this.selectedDates.end) {
              classes += 'in-range';
            }
            if (date.toDateString() === this.selectedDates.start.toDateString()) {
              classes += ' start-date';
            }
            if (date.toDateString() === this.selectedDates.end.toDateString()) {
              classes += ' end-date';
            }
          }
        } else if (this.selectedDates && date.toDateString() === this.selectedDates.toDateString()) {
          classes += ' start-date';
        }

        this.addDayCell(calendarGrid, day, classes);
      }


      // prefill next month
      const totalCells = 42; // 6 недель × 7 дней
      const currentCells = startDay + lastDay.getDate();
      for (let i = 1; i <= totalCells - currentCells; i++) {
        this.addDayCell(calendarGrid, i, 'disabled');
      }
    }

    addDayCell(parent, day, extraClasses = '') {
      const cell = document.createElement('div');
      cell.className = `calendar-day ${extraClasses}`.trim();
      cell.dataset.day = day;
      cell.textContent = day;
      parent.appendChild(cell);
    }

    selectDate(day) {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const selectedDate = new Date(year, month, day);

      if (this.isRange) {
        if (!this.selectedDates.start) {
          this.selectedDates.start = selectedDate;
        } else if (!this.selectedDates.end && selectedDate >= this.selectedDates.start) {
          this.selectedDates.end = selectedDate;
        } else {
          this.selectedDates.start = selectedDate;
          this.selectedDates.end = null;
        }
      } else {
        this.selectedDates = selectedDate;
        this.updateInput();
        this.hide();

      }

      this.renderCalendar();
    }

    setPeriod(days) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);

      this.selectedDates.start = startDate;
      this.selectedDates.end = endDate;

      this.updatePeriodButtons(days);
      this.renderCalendar();
    }

    applyRange() {
      if (this.selectedDates.start && this.selectedDates.end) {
        this.updateInput();
        this.hide();
      }
    }

    updateInput() {
      if ((this.isRange && (!this.selectedDates.start || !this.selectedDates.end)) ||
        (!this.isRange && !this.selectedDates)) {
        this.input.value = '';
        return;
      }

      //selected both dates in period
      if (this.isRange && this.selectedDates.start && this.selectedDates.end) {
        const formatDate = (date) => {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}.${month}.${year}`;
        };
        this.input.value = `${formatDate(this.selectedDates.start)} — ${formatDate(this.selectedDates.end)}`;
      }
      //single date selected
      else if (!this.isRange && this.selectedDates) {
        const day = String(this.selectedDates.getDate()).padStart(2, '0');
        const month = String(this.selectedDates.getMonth() + 1).padStart(2, '0');
        const year = this.selectedDates.getFullYear();
        this.input.value = `${day}.${month}.${year}`;
      }
    }

  }

  //mother object for all datepickers
  const DatePickerManager = (function() {
    const pickers = [];

    function initAll() {
      document.querySelectorAll('.ui-datepicker').forEach(element => {
        //if inited already
        if (!element._datepicker) {
          const picker = new DatePicker(element);
          element._datepicker = picker;
          pickers.push(picker);
        }
      });
    }

    function addNewPicker(element) {
      if (!element._datepicker) {
        const picker = new DatePicker(element);
        element._datepicker = picker;
        pickers.push(picker);
      }
    }

    return {
      initAll,
      addNewPicker
    };
  })();

  //init on page load
  document.addEventListener('DOMContentLoaded', () => {
    DatePickerManager.initAll();
  });

  //export
  window.DatePickerManager = DatePickerManager;
})();

