import { routes } from '@/routes';
import './vendors/highcharts.js';
import './vendors/highcharts_stock.js';
import './vendors/highcharts_heatmap.js';
import './vendors/highcharts_xrange.js';
import './ui/spoilers.js';
import './ui/tooltips.js';
import './ui/table.js';
import './ui/ddls.js';
import './ui/datePickers.js';
import './ui/radios.js';
import './ui/checkboxes.js';
import './ui/calendar.js';
import './themeSwitcher.js';
import {  getRequest, postRequest } from '@/services/api.js';

const debug = (import.meta.env.VITE_DEBUG === 'true' || import.meta.env.VITE_DEBUG === true);

if (debug) {
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log('is debug:', apiUrl, debug);
}

// Global number formatter
const numberFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
window.numberFormatter = numberFormatter;
//Global date formatter
const dateFormatter = async function(da) {
  let d = await new Date();
  try {
    d = new Date(da);
  } catch(err) {
    console.warn('dateFormatter -> ERROR:', err);
  }

  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0')
  ;
}
window.dateFormatter = dateFormatter;

function formatTimeMs(ms) {
  // Константы в миллисекундах
  const SECOND = 1000;
  const MINUTE = SECOND * 60;
  const HOUR = MINUTE * 60;
  const DAY = HOUR * 24;
  const MONTH = DAY * 30.44; // Среднее количество дней в месяце
  const YEAR = DAY * 365.25; // С учетом високосных лет

  const years = Math.floor(ms / YEAR);
  ms %= YEAR;

  const months = Math.floor(ms / MONTH);
  ms %= MONTH;

  const days = Math.floor(ms / DAY);
  ms %= DAY;

  const hours = Math.floor(ms / HOUR);
  ms %= HOUR;

  const minutes = Math.floor(ms / MINUTE);
  ms %= MINUTE;

  const seconds = Math.floor(ms / SECOND);

  // Собираем части (только те, что больше нуля)
  const parts = [];
  if (years) parts.push(`${years} years`);
  if (months) parts.push(`${months} months`);
  if (days) parts.push(`${days} days`);
  if (hours) parts.push(`${hours} hours`);
  if (minutes) parts.push(`${minutes} min`);
  if (seconds) parts.push(`${seconds} sec`);

  return parts.join(' ');
}
window.formatTimeMs = formatTimeMs;
//TODO move to separate highchartHelpers.js
function updateChartWithDateRange(chart, start, end) {
  if (chart) {
    try {
      // Parse the start and end dates
      const startDate = new Date(start);
      const endDate = new Date(end);
      // Validate the dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }
      // Convert dates to timestamps
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      // Update the chart's x-axis extremes
      chart.xAxis[0].setExtremes(start? startTime: start, end? endTime: end);
      // Redraw the chart to ensure changes are applied
      chart.redraw();
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }
}
window.updateChartWithDateRange = updateChartWithDateRange;
// Example GET request
/*async function fetchData() { //TODO remove that into instructions
  try {
    const data = await getRequest('/filter/user_name');
    const data2 = await getRequest('/filter/user_name_lead');
    console.log('Users:', data,data2);
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}*/

// Example POST request
/*async function createUser() {
  try {
    const newUser = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    const response = await postRequest('/users', newUser);
    console.log('User created:', response);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
}*/

// Call the functions
/*fetchData();
createUser();*/

(function(window, undefined) {
  let that = this;
  that = {
    widgetId: 'test_script',
    options: {},
    methods: {}
  };
  console.log('HELLO WORLD:');
  window[that.widgetId] = that;
})(window);
