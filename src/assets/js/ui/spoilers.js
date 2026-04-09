(function(window, undefined) {
  let that = this;
  that = {
    widgetId: 'ui_spoiler',
    options: {},
    methods: {}
  };
  function init() {
    document.querySelectorAll('.spoiler>.header').forEach(function(el) {
      el.addEventListener('click', function(evt) {
        if (evt?.target) {
          evt.target.closest('.spoiler').classList.toggle('expanded');
        }
      });
    });
  }
  init();
  function handleAction(evt) {
    //TODO add dispatcher
  }
  if (!window[that.widgetId]) {
    window[that.widgetId] = that;
  }
})(window);
