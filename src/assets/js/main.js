import { routes } from '@/routes';
import './vendors/highcharts.js';
import './ui/spoilers.js';
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

// Example GET request
async function fetchData() { //TODO remove that into instructions
  try {
    const data = await getRequest('/filter/user_name');
    const data2 = await getRequest('/filter/user_name_lead');
    console.log('Users:', data,data2);
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

// Example POST request
async function createUser() {
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
}

// Call the functions
fetchData();
createUser();

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
