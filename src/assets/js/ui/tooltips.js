(function(window, undefined) {
  let that = this;
  that = {
    widgetId: 'ui_tooltip',
    options: {},
    methods: {

      initBySelector: function(selector) {
        if (typeof selector !== 'string') {
          console.error('initBySelector: selector must be a string');
          return;
        }

        document.querySelectorAll(selector).forEach(function(el) {
          const isHover = el.dataset.isHover === 'true';
          const position = el.dataset.position || 'tl';

          if (isHover) {
            el.addEventListener('mouseenter', function() {
              showTooltip(el, position);
            });

            el.addEventListener('mouseleave', function() {
              hideTooltip(el);
            });
          } else {
            el.addEventListener('click', function(evt) {
              evt.preventDefault();
              toggleTooltip(el, position);
            });
          }
        });
      }

    }
  };

  function init() {
    that.methods.initBySelector('.ui-tooltip');
  }

  function showTooltip(el, position) {
    const tooltipContents = el.querySelector('.tooltip-contents');
    if (!tooltipContents) return;

    // Position the tooltip
    positionTooltip(el, tooltipContents, position);

    // Show the tooltip
    tooltipContents.style.display = 'block';
  }

  function hideTooltip(el) {
    const tooltipContents = el.querySelector('.tooltip-contents');
    if (tooltipContents) {
      tooltipContents.style.display = 'none';
    }
  }

  function toggleTooltip(el, position) {
    const tooltipContents = el.querySelector('.tooltip-contents');
    if (!tooltipContents) return;

    if (tooltipContents.style.display === 'block') {
      hideTooltip(el);
    } else {
      showTooltip(el, position);
    }
  }

  function positionTooltip(el, tooltipContents, position) {
    const containerRect = el.getBoundingClientRect();
    const tooltipRect = tooltipContents.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Add position class to the tooltip container
    el.classList.remove('position-tl', 'position-tr', 'position-t', 'position-r', 'position-br', 'position-b', 'position-bl', 'position-l');
    el.classList.add(`position-${position}`);

    // Calculate initial position based on the `data-position` attribute
    let top = 0;
    let left = 0;

    switch (position) {
      case 't':
        top = containerRect.top - tooltipRect.height;
        left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'tr':
        top = containerRect.top - tooltipRect.height;
        left = containerRect.right;
        break;
      case 'r':
        top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
        left = containerRect.right;
        break;
      case 'br':
        top = containerRect.bottom;
        left = containerRect.right;
        break;
      case 'b':
        top = containerRect.bottom;
        left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bl':
        top = containerRect.bottom;
        left = containerRect.left - tooltipRect.width;
        break;
      case 'l':
        top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
        left = containerRect.left - tooltipRect.width;
        break;
      case 'tl':
      default:
        top = containerRect.top - tooltipRect.height;
        left = containerRect.left - tooltipRect.width;
        break;
    }

    // Adjust position to ensure the tooltip stays within the viewport
    if (top < 0) {
      top = containerRect.bottom;
    }
    if (left < 0) {
      left = containerRect.left;
    }
    if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width;
    }
    if (top + tooltipRect.height > viewportHeight) {
      top = containerRect.top - tooltipRect.height;
    }
//TODO fix to viewport repositioning
    tooltipContents.style.top = ``;
    tooltipContents.style.left = ``;
  }

  init();

  if (!window[that.widgetId]) {
    window[that.widgetId] = that;
  }
})(window);
