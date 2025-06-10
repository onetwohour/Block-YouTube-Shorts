(function () {
  const defaultSettings = {
    removeFromHome: true,
    removeFromChannel: true,
    removeFromShortsPage: true,
    disableShortsScrolling: true,
    logColor: '#00ff00'
  };

  const SETTINGS_KEY = 'shortsBlockerSettings_v2';

  function getSettings() {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { ...defaultSettings };
  }

  function saveSettings(newSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  }

  function insertSettingsMenu() {
    if (!location.pathname.includes('/account_playback')) return;
    if (document.getElementById('shorts-script-settings')) return;

    const settings = getSettings();

    const container = document.createElement('div');
    container.id = 'shorts-script-settings';
    container.style.padding = '24px';
    container.style.borderTop = '1px solid #333';
    container.style.marginTop = '48px';
    container.innerHTML = `<h3 style="color: white;">Shorts (Tampermonkey script)</h3>`;

    const options = [
      ['removeFromHome', 'Remove Shorts from Home'],
      ['removeFromChannel', 'Remove Shorts from Channel'],
      ['removeFromShortsPage', 'Redirect Shorts Page'],
      ['disableShortsScrolling', 'Disable Shorts Scroll']
    ];

    const form = document.createElement('div');
    options.forEach(([key, label]) => {
      const row = document.createElement('div');
      row.style.marginBottom = '8px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = settings[key];
      checkbox.id = `shorts-setting-${key}`;
      checkbox.addEventListener('change', () => {
        settings[key] = checkbox.checked;
        saveSettings(settings);
      });

      const labelEl = document.createElement('label');
      labelEl.htmlFor = checkbox.id;
      labelEl.textContent = label;
      labelEl.style.marginLeft = '8px';
      labelEl.style.color = 'white';

      row.appendChild(checkbox);
      row.appendChild(labelEl);
      form.appendChild(row);
    });

    container.appendChild(form);

    const target = document.querySelector('ytd-settings-page');
    if (target) {
      target.appendChild(container);
    }
  }

  window.ShortsBlockerSettings = {
    getSettings,
    saveSettings,
    insertSettingsMenu
  };
})();
