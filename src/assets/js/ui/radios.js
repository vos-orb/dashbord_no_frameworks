(function(window, undefined) {
  let that = this;
  that = {
    widgetId: 'ui_radio',
    options: {},
    methods: {}
  };
  function init() {
    document.querySelectorAll('.ui-radio').forEach(function(el) {
      el.addEventListener('click', function(evt) {
        if (evt?.target) {
          const selectedRadio = evt.target.closest('.ui-radio');
          const clickedRadioValue = selectedRadio?.dataset?.value;
          const groupName= selectedRadio?.dataset?.radio;
          const groupRadios = document.querySelectorAll(`.ui-radio[data-radio=${groupName}]`);
          groupRadios.forEach(function(ele) {
            const eleValue = ele?.dataset?.value;
            if (clickedRadioValue != eleValue) {
              ele.classList.remove('selected');
            } else {
              ele.classList.add('selected');
              //fire event "radiochange" on change
              const selectEvent = new CustomEvent('radiochange', {
                detail: {
                  group: groupName,
                  value: clickedRadioValue
                },
                bubbles: true
              });
              el.dispatchEvent(selectEvent);
            }
          })
        }
      });
    });
  }
  init();

  if (!window[that.widgetId]) {
    window[that.widgetId] = that;
  }
})(window);
