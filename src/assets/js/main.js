import { routes } from '@/routes';
import './vendors/shoelace.js';
import './vendors/highcharts.js';
import './ui/spoilers.js';
import './ui/table.js';
import './ui/ddls.js';
import './ui/datePickers.js';
import './ui/radios.js';
import './ui/checkboxes.js';
import './ui/calendar.js';
import {  getRequest, postRequest } from '@/services/api.js';

const debug = (import.meta.env.VITE_DEBUG === 'true' || import.meta.env.VITE_DEBUG === true);

if (debug) {
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log('is debug:', apiUrl, debug);
}

// Example GET request
async function fetchData() {
  try {
    const data = await getRequest('/users');
    console.log('Users:', data);
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
