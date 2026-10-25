/**
 * AuraWeather - API & Meteorological Interpretation Layer
 * Connects directly to Open-Meteo APIs (Forecast, Geocoding, Air Quality).
 */

const WeatherAPI = {
  GEOCODING_URL: 'https://geocoding-api.open-meteo.com/v1/search',
  FORECAST_URL: 'https://api.open-meteo.com/v1/forecast',
  AIR_QUALITY_URL: 'https://air-quality-api.open-meteo.com/v1/air-quality',

  /**
   * Search worldwide cities with autocomplete
   * @param {string} query 
   * @returns {Promise<Array>}
   */
  async searchCities(query) {
    if (!query || query.trim().length < 2) return [];
    const url = `${this.GEOCODING_URL}?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Geocoding HTTP error: ${res.status}`);
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error('Error fetching city suggestions:', err);
      return [];
    }
  },

  /**
   * Fetch complete current, hourly (24-48h), and 7-day forecast
   * @param {number} lat 
   * @param {number} lon 
   * @param {string} timezone 
   * @returns {Promise<Object>}
   */
  async fetchForecast(lat, lon, timezone = 'auto') {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'precipitation',
        'rain',
        'showers',
        'snowfall',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m'
      ].join(','),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation_probability',
        'weather_code',
        'wind_speed_10m'
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'sunrise',
        'sunset',
        'uv_index_max',
        'precipitation_sum',
        'precipitation_probability_max'
      ].join(','),
      timezone: timezone || 'auto'
    });

    const res = await fetch(`${this.FORECAST_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`Weather Forecast API error: ${res.status}`);
    return await res.json();
  },

  /**
   * Fetch live Air Quality metrics (US AQI, PM2.5, PM10, Ozone, NO2)
   * @param {number} lat 
   * @param {number} lon 
   * @param {string} timezone 
   * @returns {Promise<Object>}
   */
  async fetchAirQuality(lat, lon, timezone = 'auto') {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: [
        'us_aqi',
        'european_aqi',
        'pm10',
        'pm2_5',
        'ozone',
        'nitrogen_dioxide'
      ].join(','),
      timezone: timezone || 'auto'
    });

    try {
      const res = await fetch(`${this.AIR_QUALITY_URL}?${params.toString()}`);
      if (!res.ok) throw new Error(`Air Quality API error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Air quality data unavailable for this location:', err);
      return null;
    }
  },

  /**
   * Decode WMO Weather Codes to human labels, SVG icons, background theme, and advice
   * @param {number} code 
   * @param {number|boolean} isDay 
   * @returns {Object}
   */
  interpretWmoCode(code, isDay = 1) {
    const isDaytime = Boolean(isDay);

    const codeMap = {
      0: {
        text: isDaytime ? 'Clear Sky' : 'Clear Night',
        icon: isDaytime ? 'clearDay' : 'clearNight',
        theme: isDaytime ? 'theme-clear-day' : 'theme-clear-night',
        effect: isDaytime ? 'sun' : 'stars',
        advice: isDaytime ? 'Bask in optimal sunlight and clear blue skies.' : 'Crisp and starry night skies.'
      },
      1: {
        text: isDaytime ? 'Mainly Clear' : 'Mostly Clear',
        icon: isDaytime ? 'clearDay' : 'clearNight',
        theme: isDaytime ? 'theme-clear-day' : 'theme-clear-night',
        effect: isDaytime ? 'sun' : 'stars',
        advice: 'Excellent outdoor visibility with scattered sunlight.'
      },
      2: {
        text: 'Partly Cloudy',
        icon: isDaytime ? 'partlyCloudyDay' : 'partlyCloudyNight',
        theme: 'theme-clouds',
        effect: 'clouds',
        advice: 'Comfortable balance of filtered sunlight and drifting cloud cover.'
      },
      3: {
        text: 'Overcast',
        icon: 'overcast',
        theme: 'theme-clouds',
        effect: 'clouds',
        advice: 'Continuous cloud ceiling with muted diffuse ambient light.'
      },
      45: {
        text: 'Foggy',
        icon: 'fog',
        theme: 'theme-fog',
        effect: 'fog',
        advice: 'Reduced horizon visibility; drive with dipped headlights.'
      },
      48: {
        text: 'Depositing Rime Fog',
        icon: 'fog',
        theme: 'theme-fog',
        effect: 'fog',
        advice: 'Dense freezing fog creating icy surfaces.'
      },
      51: {
        text: 'Light Drizzle',
        icon: 'drizzle',
        theme: 'theme-rain',
        effect: 'rain',
        advice: 'Gentle mist in the air; light water-resistant layer recommended.'
      },
      53: {
        text: 'Moderate Drizzle',
        icon: 'drizzle',
        theme: 'theme-rain',
        effect: 'rain',
        advice: 'Intermittent steady drizzle dampening pavements.'
      },
      55: {
        text: 'Dense Drizzle',
        icon: 'drizzle',
        theme: 'theme-rain',
        effect: 'rain',
        advice: 'Wet conditions with persistent dense drizzle.'
      },
      56: {
        text: 'Freezing Drizzle',
        icon: 'snow',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Freezing drizzle causing slick and slippery ground.'
      },
      57: {
        text: 'Dense Freezing Drizzle',
        icon: 'snow',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Hazardous glaze ice forming on walkways.'
      },
      61: {
        text: 'Slight Rain',
        icon: 'drizzle',
        theme: 'theme-rain',
        effect: 'rain',
        advice: 'Light rain showers pass by periodically.'
      },
      63: {
        text: 'Moderate Rain',
        icon: 'rain',
        theme: 'theme-rain',
        effect: 'rain',
        advice: 'Carry an umbrella; steady rain over the area.'
      },
      65: {
        text: 'Heavy Rain',
        icon: 'rain',
        theme: 'theme-rain',
        effect: 'rain',
        advice: 'Heavy rainfall with surface puddling and reduced visibility.'
      },
      66: {
        text: 'Freezing Rain',
        icon: 'rain',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Dangerous road conditions with rapid freezing rain.'
      },
      67: {
        text: 'Heavy Freezing Rain',
        icon: 'rain',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Hazardous black ice warning for drivers and pedestrians.'
      },
      71: {
        text: 'Slight Snow Fall',
        icon: 'snow',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Soft, picturesque snowflakes drifting down.'
      },
      73: {
        text: 'Moderate Snow Fall',
        icon: 'snow',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Accumulating snowfall; winter outerwear essential.'
      },
      75: {
        text: 'Heavy Snow Fall',
        icon: 'snow',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Blizzard-like conditions with rapid snow drifts.'
      },
      77: {
        text: 'Snow Grains',
        icon: 'snow',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Crisp tiny frozen pellets settling on ground.'
      },
      80: {
        text: 'Passing Showers',
        icon: 'rain',
        theme: 'theme-rain',
        effect: 'rain',
        advice: 'Brief passing rain showers between sun breaks.'
      },
      81: {
        text: 'Moderate Showers',
        icon: 'rain',
        theme: 'theme-rain',
        effect: 'rain',
        advice: 'Brisk rain showers likely over the coming hour.'
      },
      82: {
        text: 'Violent Rain Showers',
        icon: 'rain',
        theme: 'theme-rain',
        effect: 'rain',
        advice: 'Sudden intense downpours; stay sheltered.'
      },
      85: {
        text: 'Slight Snow Showers',
        icon: 'snow',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Scattered flurry bursts across the city.'
      },
      86: {
        text: 'Heavy Snow Showers',
        icon: 'snow',
        theme: 'theme-snow',
        effect: 'snow',
        advice: 'Brisk blizzard squalls with sudden whiteouts.'
      },
      95: {
        text: 'Thunderstorm',
        icon: 'thunderstorm',
        theme: 'theme-thunderstorm',
        effect: 'thunderstorm',
        advice: 'Thunder and lightning activity detected in the vicinity.'
      },
      96: {
        text: 'Thunderstorm with Hail',
        icon: 'thunderstorm',
        theme: 'theme-thunderstorm',
        effect: 'thunderstorm',
        advice: 'Severe squalls with hail and thunder. Seek indoor shelter.'
      },
      99: {
        text: 'Severe Thunderstorm',
        icon: 'thunderstorm',
        theme: 'theme-thunderstorm',
        effect: 'thunderstorm',
        advice: 'Severe meteorological warning; heavy thunder, gale and hail.'
      }
    };

    return codeMap[code] || {
      text: 'Variable Conditions',
      icon: 'default',
      theme: 'theme-clear-day',
      effect: 'clouds',
      advice: 'Mixed meteorological patterns observed.'
    };
  },

  // Conversions & Utilities
  cToF(c) {
    if (c === null || c === undefined) return '--';
    return Math.round((c * 9) / 5 + 32);
  },

  kmhToMph(kmh) {
    if (kmh === null || kmh === undefined) return '--';
    return Math.round(kmh * 0.621371);
  },

  hpaToInHg(hpa) {
    if (!hpa) return '--';
    return (hpa * 0.02953).toFixed(2);
  },

  mmToInches(mm) {
    if (!mm) return '0.00';
    return (mm * 0.0393701).toFixed(2);
  },

  getCompassDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((degrees % 360) / 22.5) % 16;
    return directions[index];
  },

  getAqiData(usAqi) {
    if (usAqi === null || usAqi === undefined) {
      return { val: '--', label: 'Unavailable', statusClass: 'status-good', percent: 15 };
    }
    const val = Math.round(usAqi);
    if (val <= 50) {
      return { val, label: 'Good', statusClass: 'status-good', percent: Math.min(100, (val / 50) * 25) };
    } else if (val <= 100) {
      return { val, label: 'Moderate', statusClass: 'status-moderate', percent: 25 + ((val - 50) / 50) * 25 };
    } else if (val <= 150) {
      return { val, label: 'Sensitive', statusClass: 'status-unhealthy', percent: 50 + ((val - 100) / 50) * 25 };
    } else if (val <= 200) {
      return { val, label: 'Unhealthy', statusClass: 'status-unhealthy', percent: 75 + ((val - 150) / 50) * 15 };
    } else {
      return { val, label: 'Hazardous', statusClass: 'status-hazardous', percent: 100 };
    }
  },

  getUvCategory(uv) {
    if (uv === null || uv === undefined) return { label: 'Low', class: 'status-good', advice: 'No protection needed.' };
    const num = Math.round(uv);
    if (num <= 2) return { label: 'Low', class: 'status-good', advice: 'Safe exposure without specialized sun protection.' };
    if (num <= 5) return { label: 'Moderate', class: 'status-moderate', advice: 'Sunscreen and sunglasses recommended during midday.' };
    if (num <= 7) return { label: 'High', class: 'status-unhealthy', advice: 'Seek shade during peak daylight hours; wear SPF 30+.' };
    if (num <= 10) return { label: 'Very High', class: 'status-hazardous', advice: 'Avoid direct midday sun; wear UV protective clothing.' };
    return { label: 'Extreme', class: 'status-hazardous', advice: 'Take full precautions against rapid UV skin burn.' };
  }
};

window.WeatherAPI = WeatherAPI;
