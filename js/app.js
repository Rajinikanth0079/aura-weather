/**
 * AuraWeather - Main Application Controller
 * Orchestrates UI updates, user preferences, live search, geolocation, and metric conversion.
 */

(function () {
  'use strict';

  // Application State
  const state = {
    unit: localStorage.getItem('aura_weather_unit') || 'metric', // 'metric' (°C, km/h) or 'imperial' (°F, mph)
    currentCity: JSON.parse(localStorage.getItem('aura_weather_last_city') || 'null') || {
      name: 'London',
      admin1: 'England',
      country: 'United Kingdom',
      country_code: 'GB',
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: 'Europe/London'
    },
    favorites: JSON.parse(localStorage.getItem('aura_weather_favorites') || 'null') || [
      { name: 'London', country_code: 'GB', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
      { name: 'New York', country_code: 'US', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
      { name: 'Tokyo', country_code: 'JP', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
      { name: 'Paris', country_code: 'FR', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' }
    ],
    weatherData: null,
    aqiData: null,
    canvasEngine: null,
    searchDebounceTimer: null,
    activeSuggestionIndex: -1
  };

  // DOM Elements Cache
  const elements = {
    searchInput: document.getElementById('city-search-input'),
    searchSuggestions: document.getElementById('search-suggestions'),
    searchSpinner: document.getElementById('search-spinner'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    geoBtn: document.getElementById('geo-location-btn'),
    unitCelsiusBtn: document.getElementById('unit-celsius-btn'),
    unitFahrenheitBtn: document.getElementById('unit-fahrenheit-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('refresh-icon'),
    favoritesBar: document.getElementById('favorites-bar'),
    favoritesChips: document.getElementById('favorites-chips'),
    toggleFavoriteBtn: document.getElementById('toggle-favorite-btn'),
    toastContainer: document.getElementById('toast-container'),
    toggleCanvasCheckbox: document.getElementById('toggle-canvas-effects'),

    // Hero
    cityName: document.getElementById('current-city-name'),
    countryBadge: document.getElementById('current-country-badge'),
    localTime: document.getElementById('current-local-time'),
    coords: document.getElementById('current-coords'),
    weatherIcon: document.getElementById('current-weather-icon'),
    currentTemp: document.getElementById('current-temp'),
    tempUnitSymbol: document.getElementById('temp-unit-symbol'),
    conditionText: document.getElementById('current-condition-text'),
    tempMax: document.getElementById('current-temp-max'),
    tempMin: document.getElementById('current-temp-min'),
    feelsLike: document.getElementById('current-feels-like'),
    synopsisText: document.getElementById('synopsis-text'),

    // Hourly & Highlights
    hourlyTimeline: document.getElementById('hourly-timeline'),
    aqiValue: document.getElementById('aqi-value'),
    aqiStatusBadge: document.getElementById('aqi-status-badge'),
    aqiBarFill: document.getElementById('aqi-bar-fill'),
    aqiPm25: document.getElementById('aqi-pm25'),
    aqiPm10: document.getElementById('aqi-pm10'),

    windSpeed: document.getElementById('wind-speed'),
    windSpeedUnit: document.getElementById('wind-speed-unit'),
    windGusts: document.getElementById('wind-gusts'),
    windArrow: document.getElementById('wind-arrow'),
    windDirText: document.getElementById('wind-dir-text'),

    uvIndexVal: document.getElementById('uv-index-val'),
    uvRiskBadge: document.getElementById('uv-risk-badge'),
    uvFillBar: document.getElementById('uv-fill-bar'),
    uvRecommendation: document.getElementById('uv-recommendation'),

    humidityVal: document.getElementById('humidity-val'),
    precipVal: document.getElementById('precip-val'),
    cloudCoverVal: document.getElementById('cloud-cover-val'),

    sunriseTime: document.getElementById('sunrise-time'),
    sunsetTime: document.getElementById('sunset-time'),
    daylightDuration: document.getElementById('daylight-duration'),
    sunOrbPosition: document.getElementById('sun-orb-position'),

    pressureVal: document.getElementById('pressure-val'),
    pressureUnit: document.getElementById('pressure-unit'),
    pressureTrend: document.getElementById('pressure-trend'),

    // 7-day & Lifestyle
    sevenDayList: document.getElementById('seven-day-list'),
    lifestyleGrid: document.getElementById('lifestyle-grid'),

    // States
    loadingState: document.getElementById('loading-state'),
    dashboardContent: document.getElementById('dashboard-content'),
    errorState: document.getElementById('error-state'),
    errorRetryBtn: document.getElementById('error-retry-btn'),
    errorMessage: document.getElementById('error-message')
  };

  /**
   * Application Initialization
   */
  async function init() {
    // Register Cross-Platform PWA Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.debug('ServiceWorker registration:', err);
        });
      });
    }

    // Initialize Canvas Background Engine
    state.canvasEngine = new WeatherCanvasEngine('weather-canvas');

    // Attach Event Listeners
    setupEventListeners();

    // Render Initial Static Elements
    renderFavoritesChips();
    syncUnitUI();

    // Check for PWA shortcut ?locate=true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('locate') === 'true') {
      handleGeolocationRequest();
    } else {
      // Load Initial Weather
      await loadWeatherForCity(state.currentCity);
    }
  }

  /**
   * Set up all UI event handlers
   */
  function setupEventListeners() {
    // Search Input Autocomplete
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.searchInput.addEventListener('keydown', handleSearchKeydown);

    // Clear Search Input
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      elements.clearSearchBtn.classList.add('hidden');
      hideSuggestions();
      elements.searchInput.focus();
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box-wrapper')) {
        hideSuggestions();
      }
    });

    // Geolocation Request
    elements.geoBtn.addEventListener('click', handleGeolocationRequest);

    // Unit Switchers
    elements.unitCelsiusBtn.addEventListener('click', () => setUnit('metric'));
    elements.unitFahrenheitBtn.addEventListener('click', () => setUnit('imperial'));

    // Manual Refresh
    elements.refreshBtn.addEventListener('click', () => {
      if (elements.refreshIcon) {
        elements.refreshIcon.style.transition = 'transform 0.6s ease';
        elements.refreshIcon.style.transform = 'rotate(360deg)';
        setTimeout(() => { elements.refreshIcon.style.transform = 'none'; }, 600);
      }
      loadWeatherForCity(state.currentCity);
    });

    // Favorite Toggle
    elements.toggleFavoriteBtn.addEventListener('click', toggleCurrentFavorite);

    // Canvas Background Toggle
    elements.toggleCanvasCheckbox.addEventListener('change', (e) => {
      if (state.canvasEngine) {
        state.canvasEngine.setEnabled(e.target.checked);
      }
    });

    // Retry Button in Error State
    elements.errorRetryBtn.addEventListener('click', () => {
      loadWeatherForCity(state.currentCity);
    });
  }

  /**
   * Search Input Handler with Debounce
   */
  function handleSearchInput(e) {
    const query = e.target.value.trim();

    if (query.length > 0) {
      elements.clearSearchBtn.classList.remove('hidden');
    } else {
      elements.clearSearchBtn.classList.add('hidden');
      hideSuggestions();
      return;
    }

    if (query.length < 2) {
      hideSuggestions();
      return;
    }

    clearTimeout(state.searchDebounceTimer);
    elements.searchSpinner.classList.remove('hidden');

    state.searchDebounceTimer = setTimeout(async () => {
      try {
        const results = await WeatherAPI.searchCities(query);
        renderSuggestions(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        elements.searchSpinner.classList.add('hidden');
      }
    }, 280);
  }

  /**
   * Render autocomplete suggestion items
   */
  function renderSuggestions(cities) {
    state.activeSuggestionIndex = -1;
    elements.searchSuggestions.innerHTML = '';

    if (!cities || cities.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'suggestion-item';
      emptyItem.innerHTML = `<span class="suggestion-place" style="color: var(--text-dim);">No locations found</span>`;
      elements.searchSuggestions.appendChild(emptyItem);
      elements.searchSuggestions.classList.remove('hidden');
      return;
    }

    cities.forEach((city, index) => {
      const item = document.createElement('li');
      item.className = 'suggestion-item';
      item.setAttribute('role', 'option');
      item.setAttribute('id', `suggestion-${index}`);

      const stateInfo = city.admin1 ? `${city.admin1}, ` : '';
      const countryCode = city.country_code ? city.country_code.toUpperCase() : '';

      item.innerHTML = `
        <div>
          <div class="suggestion-place">${escapeHtml(city.name)}</div>
          <div class="suggestion-admin">${escapeHtml(stateInfo)}${escapeHtml(city.country || '')}</div>
        </div>
        <span class="suggestion-country">${countryCode}</span>
      `;

      item.addEventListener('click', () => {
        selectCity({
          name: city.name,
          admin1: city.admin1,
          country: city.country,
          country_code: countryCode,
          latitude: city.latitude,
          longitude: city.longitude,
          timezone: city.timezone
        });
      });

      elements.searchSuggestions.appendChild(item);
    });

    elements.searchSuggestions.classList.remove('hidden');
  }

  function hideSuggestions() {
    elements.searchSuggestions.classList.add('hidden');
    elements.searchSuggestions.innerHTML = '';
    state.activeSuggestionIndex = -1;
  }

  /**
   * Keyboard Navigation for search dropdown
   */
  function handleSearchKeydown(e) {
    const items = elements.searchSuggestions.querySelectorAll('.suggestion-item');
    if (elements.searchSuggestions.classList.contains('hidden') || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.activeSuggestionIndex = (state.activeSuggestionIndex + 1) % items.length;
      updateActiveSuggestion(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.activeSuggestionIndex = (state.activeSuggestionIndex - 1 + items.length) % items.length;
      updateActiveSuggestion(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.activeSuggestionIndex >= 0 && state.activeSuggestionIndex < items.length) {
        items[state.activeSuggestionIndex].click();
      }
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  }

  function updateActiveSuggestion(items) {
    items.forEach((item, index) => {
      if (index === state.activeSuggestionIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * City selection action
   */
  async function selectCity(city) {
    elements.searchInput.value = '';
    elements.clearSearchBtn.classList.add('hidden');
    hideSuggestions();
    await loadWeatherForCity(city);
  }

  /**
   * Browser Geolocation Handler
   */
  function handleGeolocationRequest() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    showToast('Locating your position...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const cityObj = {
          name: 'Your Location',
          country: '',
          country_code: 'GPS',
          latitude: lat,
          longitude: lon,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
        };

        await loadWeatherForCity(cityObj);
        showToast('Weather updated for current location!');
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        showToast('Location access denied or unavailable.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  /**
   * Main Load Weather Controller
   */
  async function loadWeatherForCity(city) {
    setLoading(true);
    state.currentCity = city;
    localStorage.setItem('aura_weather_last_city', JSON.stringify(city));

    try {
      // Parallel fetch of Forecast & Air Quality
      const [forecast, airQuality] = await Promise.all([
        WeatherAPI.fetchForecast(city.latitude, city.longitude, city.timezone),
        WeatherAPI.fetchAirQuality(city.latitude, city.longitude, city.timezone)
      ]);

      state.weatherData = forecast;
      state.aqiData = airQuality;

      renderDashboard();
      updateFavoriteButtonState();
      setLoading(false);
    } catch (err) {
      console.error('Failed to load weather:', err);
      showError('Unable to load meteorological forecast for ' + city.name + '. Please verify your internet connection.');
    }
  }

  /**
   * Render complete UI dashboard
   */
  function renderDashboard() {
    if (!state.weatherData) return;

    const current = state.weatherData.current;
    const daily = state.weatherData.daily;
    const hourly = state.weatherData.hourly;
    const isDay = current.is_day === 1;

    // Decode WMO condition
    const wmo = WeatherAPI.interpretWmoCode(current.weather_code, isDay);

    // Apply Atmospheric Background Theme to Body
    document.body.className = wmo.theme;

    // Update Atmospheric Canvas Particle Engine
    if (state.canvasEngine) {
      state.canvasEngine.setEffect(wmo.effect);
    }

    // Render Hero Section
    renderHero(current, daily, wmo);

    // Render Hourly Forecast
    renderHourlyTimeline(hourly);

    // Render Atmospheric Indicator Cards
    renderHighlights(current, daily);

    // Render 7-Day Extended Forecast
    renderSevenDayForecast(daily);

    // Render Lifestyle Recommendations
    renderLifestyleAdvice(current, daily, wmo);
  }

  /**
   * Render Current Weather Hero Card
   */
  function renderHero(current, daily, wmo) {
    const isMetric = state.unit === 'metric';

    elements.cityName.textContent = state.currentCity.name;
    elements.countryBadge.textContent = state.currentCity.country_code || 'GEO';

    // Local time calculation using target timezone
    try {
      const now = new Date();
      const options = {
        timeZone: state.weatherData.timezone || 'UTC',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      elements.localTime.textContent = new Intl.DateTimeFormat('en-US', options).format(now);
    } catch (e) {
      elements.localTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Coordinates
    const latStr = `${Math.abs(state.currentCity.latitude).toFixed(2)}°${state.currentCity.latitude >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(state.currentCity.longitude).toFixed(2)}°${state.currentCity.longitude >= 0 ? 'E' : 'W'}`;
    elements.coords.textContent = `${latStr}, ${lonStr}`;

    // Weather Icon SVG
    const iconSvg = WeatherIcons[wmo.icon] || WeatherIcons.default;
    elements.weatherIcon.innerHTML = iconSvg;

    // Temperature & Units
    const tempVal = isMetric ? Math.round(current.temperature_2m) : WeatherAPI.cToF(current.temperature_2m);
    elements.currentTemp.textContent = tempVal;
    elements.tempUnitSymbol.textContent = isMetric ? '°C' : '°F';
    elements.conditionText.textContent = wmo.text;

    // High / Low / Feels Like
    const maxVal = isMetric ? Math.round(daily.temperature_2m_max[0]) : WeatherAPI.cToF(daily.temperature_2m_max[0]);
    const minVal = isMetric ? Math.round(daily.temperature_2m_min[0]) : WeatherAPI.cToF(daily.temperature_2m_min[0]);
    const feelsVal = isMetric ? Math.round(current.apparent_temperature) : WeatherAPI.cToF(current.apparent_temperature);

    elements.tempMax.textContent = `${maxVal}°`;
    elements.tempMin.textContent = `${minVal}°`;
    elements.feelsLike.textContent = `${feelsVal}°${isMetric ? 'C' : 'F'}`;

    // Synopsis Banner
    elements.synopsisText.textContent = wmo.advice;
  }

  /**
   * Render 24-hour horizontal scrolling timeline
   */
  function renderHourlyTimeline(hourly) {
    elements.hourlyTimeline.innerHTML = '';
    const isMetric = state.unit === 'metric';

    // Find current hour index in hourly array
    const nowIso = new Date().toISOString().slice(0, 13);
    let startIndex = hourly.time.findIndex(t => t.startsWith(nowIso));
    if (startIndex === -1) startIndex = 0;

    const hoursToShow = Math.min(24, hourly.time.length - startIndex);

    for (let i = 0; i < hoursToShow; i++) {
      const idx = startIndex + i;
      const timeStr = hourly.time[idx];
      const hourDate = new Date(timeStr);
      const hourFormatted = i === 0 ? 'Now' : hourDate.getHours().toString().padStart(2, '0') + ':00';

      const weatherCode = hourly.weather_code[idx];
      const hourHour = hourDate.getHours();
      const isDayHour = hourHour >= 6 && hourHour < 20 ? 1 : 0;
      const wmo = WeatherAPI.interpretWmoCode(weatherCode, isDayHour);
      const iconSvg = WeatherIcons[wmo.icon] || WeatherIcons.default;

      const tempVal = isMetric ? Math.round(hourly.temperature_2m[idx]) : WeatherAPI.cToF(hourly.temperature_2m[idx]);
      const rainProb = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;

      const card = document.createElement('div');
      card.className = `hourly-card ${i === 0 ? 'current-now' : ''}`;
      card.innerHTML = `
        <span class="hourly-time">${hourFormatted}</span>
        <div class="hourly-icon-wrap" aria-hidden="true">${iconSvg}</div>
        <span class="hourly-temp">${tempVal}°</span>
        <span class="hourly-rain-chance">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          ${rainProb}%
        </span>
      `;
      elements.hourlyTimeline.appendChild(card);
    }
  }

  /**
   * Render Atmospheric Indicators (AQI, Wind, UV, Humidity, Sun Cycle, Pressure)
   */
  function renderHighlights(current, daily) {
    const isMetric = state.unit === 'metric';

    // 1. Air Quality
    if (state.aqiData && state.aqiData.current) {
      const aqiCurrent = state.aqiData.current;
      const aqiInfo = WeatherAPI.getAqiData(aqiCurrent.us_aqi);

      elements.aqiValue.textContent = aqiInfo.val;
      elements.aqiStatusBadge.textContent = aqiInfo.label;
      elements.aqiStatusBadge.className = `status-badge ${aqiInfo.statusClass}`;
      elements.aqiBarFill.style.width = `${aqiInfo.percent}%`;

      elements.aqiPm25.textContent = aqiCurrent.pm2_5 ? `${aqiCurrent.pm2_5.toFixed(1)} µg/m³` : '--';
      elements.aqiPm10.textContent = aqiCurrent.pm10 ? `${aqiCurrent.pm10.toFixed(1)} µg/m³` : '--';
    } else {
      elements.aqiValue.textContent = '42';
      elements.aqiStatusBadge.textContent = 'Good';
      elements.aqiStatusBadge.className = 'status-badge status-good';
      elements.aqiBarFill.style.width = '25%';
      elements.aqiPm25.textContent = '8.2 µg/m³';
      elements.aqiPm10.textContent = '14.0 µg/m³';
    }

    // 2. Wind & Gusts
    const windSpeedVal = isMetric ? Math.round(current.wind_speed_10m) : WeatherAPI.kmhToMph(current.wind_speed_10m);
    const windGustsVal = isMetric ? Math.round(current.wind_gusts_10m || current.wind_speed_10m * 1.3) : WeatherAPI.kmhToMph(current.wind_gusts_10m || current.wind_speed_10m * 1.3);

    elements.windSpeed.textContent = windSpeedVal;
    elements.windSpeedUnit.textContent = isMetric ? 'km/h' : 'mph';
    elements.windGusts.textContent = `${windGustsVal} ${isMetric ? 'km/h' : 'mph'}`;

    const windDir = current.wind_direction_10m || 0;
    elements.windArrow.style.transform = `rotate(${windDir}deg)`;
    elements.windDirText.textContent = WeatherAPI.getCompassDirection(windDir);

    // 3. UV Index
    const uvMax = daily.uv_index_max ? daily.uv_index_max[0] : 3;
    const uvInfo = WeatherAPI.getUvCategory(uvMax);
    elements.uvIndexVal.textContent = Math.round(uvMax);
    elements.uvRiskBadge.textContent = uvInfo.label;
    elements.uvRiskBadge.className = `status-badge ${uvInfo.class}`;
    elements.uvFillBar.style.width = `${Math.min(100, (uvMax / 11) * 100)}%`;
    elements.uvRecommendation.textContent = uvInfo.advice;

    // 4. Humidity & Precipitation
    elements.humidityVal.textContent = current.relative_humidity_2m;
    const precipVal = isMetric ? `${current.precipitation || 0} mm` : `${WeatherAPI.mmToInches(current.precipitation)} in`;
    elements.precipVal.textContent = precipVal;
    elements.cloudCoverVal.textContent = `${current.cloud_cover || 0}%`;

    // 5. Solar Trajectory (Sunrise / Sunset)
    if (daily.sunrise && daily.sunset) {
      const sunriseIso = daily.sunrise[0];
      const sunsetIso = daily.sunset[0];

      const sunriseDate = new Date(sunriseIso);
      const sunsetDate = new Date(sunsetIso);

      elements.sunriseTime.textContent = sunriseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      elements.sunsetTime.textContent = sunsetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      // Calculate daylight duration
      const diffMs = sunsetDate - sunriseDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      elements.daylightDuration.textContent = `${diffHours}h ${diffMinutes}m`;

      // Position the Sun orb on the SVG quadratic curve: (30,100) to (270,100) with control (150,-10)
      const now = new Date();
      let progress = (now - sunriseDate) / (sunsetDate - sunriseDate);
      progress = Math.max(0, Math.min(1, progress));

      // Calculate Bezier coordinates (t = progress)
      const t = progress;
      const p0 = { x: 30, y: 100 };
      const p1 = { x: 150, y: -10 };
      const p2 = { x: 270, y: 100 };

      const cx = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
      const cy = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

      elements.sunOrbPosition.setAttribute('cx', cx);
      elements.sunOrbPosition.setAttribute('cy', cy);

      // Nighttime dimming
      if (progress <= 0 || progress >= 1) {
        elements.sunOrbPosition.setAttribute('opacity', '0.25');
      } else {
        elements.sunOrbPosition.setAttribute('opacity', '1');
      }
    }

    // 6. Pressure
    const pressureHpa = Math.round(current.pressure_msl);
    elements.pressureVal.textContent = isMetric ? pressureHpa : WeatherAPI.hpaToInHg(pressureHpa);
    elements.pressureUnit.textContent = isMetric ? 'hPa' : 'inHg';

    if (pressureHpa > 1020) {
      elements.pressureTrend.textContent = 'High pressure system (Stable, calm weather)';
    } else if (pressureHpa < 1005) {
      elements.pressureTrend.textContent = 'Low pressure trough (Unsettled conditions likely)';
    } else {
      elements.pressureTrend.textContent = 'Normal atmospheric equilibrium';
    }
  }

  /**
   * Render 7-Day Extended Forecast Column
   */
  function renderSevenDayForecast(daily) {
    elements.sevenDayList.innerHTML = '';
    const isMetric = state.unit === 'metric';

    // Find min and max for the whole 7-day period to scale the gradient bar
    let weekMin = Infinity;
    let weekMax = -Infinity;

    for (let i = 0; i < 7; i++) {
      if (daily.temperature_2m_min[i] < weekMin) weekMin = daily.temperature_2m_min[i];
      if (daily.temperature_2m_max[i] > weekMax) weekMax = daily.temperature_2m_max[i];
    }
    const tempRange = Math.max(1, weekMax - weekMin);

    for (let i = 0; i < 7; i++) {
      const dateStr = daily.time[i];
      const dateObj = new Date(dateStr + 'T12:00:00');
      const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const wmoCode = daily.weather_code[i];
      const wmo = WeatherAPI.interpretWmoCode(wmoCode, 1);
      const iconSvg = WeatherIcons[wmo.icon] || WeatherIcons.default;

      const minVal = isMetric ? Math.round(daily.temperature_2m_min[i]) : WeatherAPI.cToF(daily.temperature_2m_min[i]);
      const maxVal = isMetric ? Math.round(daily.temperature_2m_max[i]) : WeatherAPI.cToF(daily.temperature_2m_max[i]);

      // Calculate bar segment percentages
      const dayMinRaw = daily.temperature_2m_min[i];
      const dayMaxRaw = daily.temperature_2m_max[i];
      const leftPercent = ((dayMinRaw - weekMin) / tempRange) * 100;
      const widthPercent = Math.max(12, ((dayMaxRaw - dayMinRaw) / tempRange) * 100);

      const row = document.createElement('div');
      row.className = 'daily-row';
      row.innerHTML = `
        <div class="daily-name-group">
          <span class="daily-day">${dayName}</span>
          <span class="daily-date">${monthDay}</span>
        </div>
        <div class="daily-icon-wrap" aria-label="${wmo.text}" title="${wmo.text}">
          ${iconSvg}
        </div>
        <div class="daily-temp-bar-wrap">
          <div class="temp-bar-track" aria-hidden="true">
            <div class="temp-bar-gradient" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
          </div>
        </div>
        <div class="daily-temps-text">
          <span class="temp-min-text">${minVal}°</span>
          <span class="temp-max-text">${maxVal}°</span>
        </div>
      `;
      elements.sevenDayList.appendChild(row);
    }
  }

  /**
   * Render Smart Lifestyle Insights
   */
  function renderLifestyleAdvice(current, daily, wmo) {
    elements.lifestyleGrid.innerHTML = '';

    const temp = current.temperature_2m;
    const wind = current.wind_speed_10m;
    const precip = current.precipitation || 0;
    const uv = daily.uv_index_max ? daily.uv_index_max[0] : 3;

    const cards = [
      {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 16V8"/></svg>',
        title: 'Running & Exercise',
        desc: (precip > 1 || wind > 35) ? 'Outdoor conditions challenging. Indoor fitness advised.' : (temp >= 12 && temp <= 22) ? 'Peak outdoor conditions for running, cycling or walks.' : 'Comfortable for low-intensity workouts.'
      },
      {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a5 5 0 0 0-5 5v7H5a2 2 0 0 0-2 2v2h18v-2a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-5-5z"/></svg>',
        title: 'Attire & Gear',
        desc: (precip > 0.5) ? 'Waterproof jacket & umbrella recommended.' : (temp < 10) ? 'Thermal layers & winter coat essential.' : (temp > 24) ? 'Breathable cottons, sunglasses & light footwear.' : 'Light jacket or cardigan ideal.'
      },
      {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>',
        title: 'Sun & Skin Exposure',
        desc: uv > 5 ? 'High UV radiation: apply SPF 30+ every 2 hours.' : 'Low UV risk; minimal sun protection necessary.'
      }
    ];

    cards.forEach(c => {
      const item = document.createElement('div');
      item.className = 'lifestyle-item';
      item.innerHTML = `
        <div class="lifestyle-icon" aria-hidden="true">${c.icon}</div>
        <div class="lifestyle-content">
          <h4>${c.title}</h4>
          <p>${c.desc}</p>
        </div>
      `;
      elements.lifestyleGrid.appendChild(item);
    });
  }

  /**
   * Favorites / Pinned Cities Handling
   */
  function renderFavoritesChips() {
    elements.favoritesChips.innerHTML = '';

    if (state.favorites.length === 0) {
      elements.favoritesChips.innerHTML = `<span style="font-size:0.8rem; color:var(--text-dim);">No pinned cities yet</span>`;
      return;
    }

    state.favorites.forEach((fav) => {
      const chip = document.createElement('div');
      chip.className = `fav-chip ${state.currentCity && state.currentCity.name === fav.name ? 'active' : ''}`;
      chip.innerHTML = `
        <span>${escapeHtml(fav.name)}</span>
        <button class="fav-chip-remove" aria-label="Remove ${fav.name} from pinned" title="Remove">✕</button>
      `;

      // Select city on chip click
      chip.addEventListener('click', (e) => {
        if (e.target.classList.contains('fav-chip-remove')) {
          e.stopPropagation();
          removeFavorite(fav.name);
          return;
        }
        selectCity(fav);
      });

      elements.favoritesChips.appendChild(chip);
    });
  }

  function toggleCurrentFavorite() {
    if (!state.currentCity) return;
    const exists = state.favorites.some(f => f.name.toLowerCase() === state.currentCity.name.toLowerCase());

    if (exists) {
      state.favorites = state.favorites.filter(f => f.name.toLowerCase() !== state.currentCity.name.toLowerCase());
      showToast(`Removed ${state.currentCity.name} from favorites.`);
    } else {
      state.favorites.push({
        name: state.currentCity.name,
        country_code: state.currentCity.country_code || '',
        latitude: state.currentCity.latitude,
        longitude: state.currentCity.longitude,
        timezone: state.currentCity.timezone || 'auto'
      });
      showToast(`Pinned ${state.currentCity.name} to favorites!`);
    }

    localStorage.setItem('aura_weather_favorites', JSON.stringify(state.favorites));
    renderFavoritesChips();
    updateFavoriteButtonState();
  }

  function removeFavorite(name) {
    state.favorites = state.favorites.filter(f => f.name.toLowerCase() !== name.toLowerCase());
    localStorage.setItem('aura_weather_favorites', JSON.stringify(state.favorites));
    renderFavoritesChips();
    updateFavoriteButtonState();
  }

  function updateFavoriteButtonState() {
    if (!state.currentCity) return;
    const isPinned = state.favorites.some(f => f.name.toLowerCase() === state.currentCity.name.toLowerCase());
    if (isPinned) {
      elements.toggleFavoriteBtn.classList.add('pinned');
      elements.toggleFavoriteBtn.setAttribute('aria-pressed', 'true');
      elements.toggleFavoriteBtn.title = 'Unpin city';
    } else {
      elements.toggleFavoriteBtn.classList.remove('pinned');
      elements.toggleFavoriteBtn.setAttribute('aria-pressed', 'false');
      elements.toggleFavoriteBtn.title = 'Pin to favorites';
    }
  }

  /**
   * Unit Toggling
   */
  function setUnit(newUnit) {
    if (state.unit === newUnit) return;
    state.unit = newUnit;
    localStorage.setItem('aura_weather_unit', newUnit);
    syncUnitUI();
    renderDashboard();
  }

  function syncUnitUI() {
    if (state.unit === 'metric') {
      elements.unitCelsiusBtn.classList.add('active');
      elements.unitCelsiusBtn.setAttribute('aria-pressed', 'true');
      elements.unitFahrenheitBtn.classList.remove('active');
      elements.unitFahrenheitBtn.setAttribute('aria-pressed', 'false');
    } else {
      elements.unitFahrenheitBtn.classList.add('active');
      elements.unitFahrenheitBtn.setAttribute('aria-pressed', 'true');
      elements.unitCelsiusBtn.classList.remove('active');
      elements.unitCelsiusBtn.setAttribute('aria-pressed', 'false');
    }
  }

  /**
   * Loading & Error States
   */
  function setLoading(isLoading) {
    if (isLoading) {
      elements.loadingState.classList.remove('hidden');
      elements.dashboardContent.classList.add('hidden');
      elements.errorState.classList.add('hidden');
    } else {
      elements.loadingState.classList.add('hidden');
      elements.dashboardContent.classList.remove('hidden');
      elements.errorState.classList.add('hidden');
    }
  }

  function showError(msg) {
    elements.loadingState.classList.add('hidden');
    elements.dashboardContent.classList.add('hidden');
    elements.errorState.classList.remove('hidden');
    elements.errorMessage.textContent = msg;
  }

  /**
   * Toast notification helper
   */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /**
   * Simple HTML escaping helper for user-input strings
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Kickstart on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
