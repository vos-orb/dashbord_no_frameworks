(function(window, undefined) {
  let that = this;
  that = {
    widgetId: 'theme_switcher',
    options: {},
    methods: {}
  };
  function init() {
    // Theme switching functionality
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeName = document.getElementById('theme-name');
    const themes = ['light', 'prom'/*, 'ocean'*/];
    let currentThemeIndex = 0;

    // Load saved theme or use default
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentThemeIndex = themes.indexOf(savedTheme);
    if (currentThemeIndex === -1) currentThemeIndex = 0;

    // Apply theme
    function applyTheme(theme) {
      console.info('theme_swithcer_APPLYTHEME');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      document.querySelector('#stylesheet_theme').href= `assets/css/main-${theme}.css`;

      // Update button text and icon
      const themeDisplayNames = {
        'light': 'Light',
        'prom': 'Prom',
        //'ocean': 'Ocean'
      };
      themeName.textContent = themeDisplayNames[theme] || theme;

      const themeIcons = {
        'light': '☀️',
        'prom': '🌙',
        //'ocean': '🌊'
      };
      themeIcon.textContent = themeIcons[theme] || '🎨';
    }

    // Initialize
    applyTheme(themes[currentThemeIndex]);

    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
      console.info('theme_swithcer_CLICKED');
      currentThemeIndex = (currentThemeIndex + 1) % themes.length;
      applyTheme(themes[currentThemeIndex]);
    });
  }
  init();

  if (!window[that.widgetId]) {
    window[that.widgetId] = that;
  }
})(window);
