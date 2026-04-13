(function(window, undefined) {
  let that = this;
  that = {
    widgetId: 'ui_checkbox',
    options: {},
    methods: {}
  };
  function init() {
    document.querySelectorAll('.ui-checkbox').forEach(function(el) {
      el.addEventListener('change', function(evt) {
        if (evt?.target) {
          evt?.target.closest('.ui-checkbox').classList.toggle('checked');
        }
      });
    });
  }
  init();

  if (!window[that.widgetId]) {
    window[that.widgetId] = that;
  }
})(window);
