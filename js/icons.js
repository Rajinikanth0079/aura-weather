/**
 * AuraWeather - Inline Vector Weather Icons Library
 * High-definition, scalable SVG icons crafted for crisp rendering across all screen densities.
 */

const WeatherIcons = {
  // Clear Sky / Sunny
  clearDay: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-sun">
      <defs>
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="60%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#d97706"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="14" fill="url(#sunGrad)" filter="drop-shadow(0 0 12px rgba(245,158,11,0.6))"/>
      <g stroke="#fbbf24" stroke-width="3" stroke-linecap="round" opacity="0.85">
        <line x1="32" y1="8" x2="32" y2="3"/>
        <line x1="32" y1="61" x2="32" y2="56"/>
        <line x1="8" y1="32" x2="3" y2="32"/>
        <line x1="61" y1="32" x2="56" y2="32"/>
        <line x1="15.03" y1="15.03" x2="11.49" y2="11.49"/>
        <line x1="52.51" y1="52.51" x2="48.97" y2="48.97"/>
        <line x1="15.03" y1="48.97" x2="11.49" y2="52.51"/>
        <line x1="52.51" y1="11.49" x2="48.97" y2="15.03"/>
      </g>
    </svg>
  `,

  // Clear Sky Night (Crescent Moon & Stars)
  clearNight: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-moon">
      <defs>
        <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#93c5fd"/>
        </linearGradient>
      </defs>
      <path d="M37 12C24.3 12 14 22.3 14 35c0 12.7 10.3 23 23 23 8.3 0 15.6-4.4 19.6-11-9.9 2-18.6-5.6-18.6-15.5 0-6.1 3.4-11.4 8.4-14.2-3-1.5-6.1-2.3-9.4-2.3z" 
            fill="url(#moonGrad)" filter="drop-shadow(0 0 14px rgba(147,197,253,0.5))"/>
      <circle cx="48" cy="18" r="1.5" fill="#ffffff" opacity="0.9"/>
      <circle cx="42" cy="12" r="1" fill="#ffffff" opacity="0.7"/>
      <circle cx="52" cy="28" r="1.2" fill="#ffffff" opacity="0.8"/>
    </svg>
  `,

  // Partly Cloudy Day
  partlyCloudyDay: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-partly-cloudy-day">
      <circle cx="24" cy="24" r="10" fill="#f59e0b" filter="drop-shadow(0 0 8px rgba(245,158,11,0.5))"/>
      <path d="M48 48H22a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.2A11 11 0 0 1 48 48z" 
            fill="rgba(241, 245, 249, 0.95)" stroke="#cbd5e1" stroke-width="1.5" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.25))"/>
    </svg>
  `,

  // Partly Cloudy Night
  partlyCloudyNight: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-partly-cloudy-night">
      <path d="M28 16a9 9 0 0 0 7 13.5 9.5 9.5 0 0 1-8.5-12.8c.5-.3 1-.5 1.5-.7z" fill="#93c5fd" filter="drop-shadow(0 0 6px rgba(147,197,253,0.6))"/>
      <path d="M48 50H22a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.2A11 11 0 0 1 48 50z" 
            fill="rgba(203, 213, 225, 0.95)" stroke="#94a3b8" stroke-width="1.5" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.3))"/>
    </svg>
  `,

  // Overcast Clouds
  overcast: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-clouds">
      <path d="M40 34H18a8 8 0 0 1-1-15.9 11 11 0 0 1 21-3.3A9 9 0 0 1 40 34z" fill="#94a3b8" opacity="0.6"/>
      <path d="M48 50H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.2A11 11 0 0 1 48 50z" 
            fill="rgba(226, 232, 240, 0.95)" stroke="#94a3b8" stroke-width="1.5" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.35))"/>
    </svg>
  `,

  // Fog / Mist
  fog: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-fog">
      <path d="M46 36H18a8 8 0 0 1-1-15.9 11 11 0 0 1 21-3.3A9 9 0 0 1 46 36z" fill="#94a3b8" opacity="0.7"/>
      <line x1="14" y1="42" x2="50" y2="42" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
      <line x1="20" y1="48" x2="44" y2="48" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
      <line x1="16" y1="54" x2="48" y2="54" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `,

  // Drizzle / Light Rain
  drizzle: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-drizzle">
      <path d="M46 38H20a9 9 0 0 1-1.2-17.9 12.5 12.5 0 0 1 23.8-3.7A10 10 0 0 1 46 38z" fill="rgba(203, 213, 225, 0.95)"/>
      <line x1="24" y1="44" x2="21" y2="52" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="34" y1="44" x2="31" y2="52" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="44" y1="44" x2="41" y2="52" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `,

  // Moderate / Heavy Rain
  rain: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-rain">
      <path d="M48 38H18a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.2A11 11 0 0 1 48 38z" fill="rgba(148, 163, 184, 0.95)" stroke="#64748b" stroke-width="1.5"/>
      <g stroke="#38bdf8" stroke-width="3" stroke-linecap="round">
        <line x1="20" y1="44" x2="16" y2="54"/>
        <line x1="30" y1="44" x2="26" y2="54"/>
        <line x1="40" y1="44" x2="36" y2="54"/>
        <line x1="50" y1="44" x2="46" y2="54"/>
      </g>
    </svg>
  `,

  // Thunderstorm
  thunderstorm: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-thunderstorm">
      <path d="M46 34H18a9 9 0 0 1-1.2-17.9 13 13 0 0 1 24.7-3.9A10 10 0 0 1 46 34z" fill="#475569" stroke="#334155" stroke-width="1.5"/>
      <!-- Lightning Bolt -->
      <polygon points="32 30 24 45 32 45 28 58 42 41 34 41 38 30" fill="#fbbf24" filter="drop-shadow(0 0 10px rgba(251,191,36,0.8))"/>
      <line x1="18" y1="46" x2="15" y2="54" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="48" y1="46" x2="45" y2="54" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `,

  // Snow
  snow: `
    <svg viewBox="0 0 64 64" fill="none" class="animated-weather-icon icon-snow">
      <path d="M46 36H20a9 9 0 0 1-1.2-17.9 12.5 12.5 0 0 1 23.8-3.7A10 10 0 0 1 46 36z" fill="rgba(226, 232, 240, 0.95)"/>
      <!-- Snowflakes -->
      <g stroke="#93c5fd" stroke-width="2.2" stroke-linecap="round">
        <!-- Snowflake 1 -->
        <line x1="22" y1="44" x2="22" y2="52"/>
        <line x1="18" y1="48" x2="26" y2="48"/>
        <!-- Snowflake 2 -->
        <line x1="34" y1="44" x2="34" y2="54"/>
        <line x1="29" y1="49" x2="39" y2="49"/>
        <!-- Snowflake 3 -->
        <line x1="46" y1="44" x2="46" y2="52"/>
        <line x1="42" y1="48" x2="50" y2="48"/>
      </g>
    </svg>
  `,

  // Default Fallback
  default: `
    <svg viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="14" fill="#38bdf8" opacity="0.8"/>
      <path d="M48 48H22a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.2A11 11 0 0 1 48 48z" fill="rgba(255,255,255,0.9)"/>
    </svg>
  `
};

window.WeatherIcons = WeatherIcons;
