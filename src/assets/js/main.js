import { routes } from '@/routes';
import '@/styles/main.scss';
import './vendors/shoelace.js';

console.log('HELLO WORLD2:');
console.log('Current routes:', routes);
console.log('API URL from env:', import.meta.env.VITE_API_URL || 'Not set');

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
