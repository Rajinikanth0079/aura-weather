/**
 * AuraWeather - Dynamic Canvas Atmospheric Particle Engine
 * High-performance 60fps procedural weather effects (Rain, Snow, Thunderstorm, Starry Sky, Sun Haze, Clouds)
 */

class WeatherCanvasEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.currentEffect = 'sun';
    this.animationFrameId = null;
    this.isEnabled = true;
    this.lightningTimer = 0;
    this.lightningAlpha = 0;
    this.shootingStars = [];

    this.init();
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    this.setEffect('sun');
    this.startLoop();
  }

  handleResize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.resetParticles();
  }

  setEffect(effect) {
    if (this.currentEffect === effect && this.particles.length > 0) return;
    this.currentEffect = effect;
    this.resetParticles();
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.canvas.classList.remove('disabled');
      if (!this.animationFrameId) this.startLoop();
    } else {
      this.canvas.classList.add('disabled');
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  resetParticles() {
    this.particles = [];
    this.shootingStars = [];
    const count = this.getParticleCountForEffect(this.currentEffect);

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(this.currentEffect, true));
    }
  }

  getParticleCountForEffect(effect) {
    switch (effect) {
      case 'rain': return 90;
      case 'thunderstorm': return 130;
      case 'snow': return 75;
      case 'stars': return 90;
      case 'sun': return 40;
      case 'clouds':
      case 'fog': return 18;
      default: return 35;
    }
  }

  createParticle(effect, randomY = false) {
    const y = randomY ? Math.random() * this.height : -20;
    const x = Math.random() * (this.width + 100) - 50;

    switch (effect) {
      case 'rain':
      case 'thunderstorm':
        return {
          x,
          y,
          len: 15 + Math.random() * 20,
          speed: 12 + Math.random() * 10,
          opacity: 0.2 + Math.random() * 0.45,
          width: 1.2 + Math.random() * 0.8,
          slanted: 2 + Math.random() * 2
        };

      case 'snow':
        return {
          x,
          y,
          radius: 1.5 + Math.random() * 3.5,
          speed: 0.8 + Math.random() * 1.6,
          swaySpeed: 0.01 + Math.random() * 0.02,
          swayOffset: Math.random() * Math.PI * 2,
          swayAmp: 1.2 + Math.random() * 2,
          opacity: 0.35 + Math.random() * 0.6
        };

      case 'stars':
        return {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: 0.6 + Math.random() * 1.8,
          alpha: Math.random() * 0.8 + 0.2,
          twinkleSpeed: 0.015 + Math.random() * 0.035,
          phase: Math.random() * Math.PI * 2
        };

      case 'sun':
        return {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: 1 + Math.random() * 3,
          speedY: -(0.2 + Math.random() * 0.5),
          speedX: (Math.random() - 0.5) * 0.3,
          opacity: 0.2 + Math.random() * 0.4,
          glow: Math.random() * 10 + 5
        };

      case 'clouds':
      case 'fog':
        return {
          x: Math.random() * (this.width + 400) - 200,
          y: Math.random() * (this.height * 0.6),
          radius: 80 + Math.random() * 140,
          speedX: 0.15 + Math.random() * 0.25,
          opacity: 0.03 + Math.random() * 0.05
        };

      default:
        return { x: 0, y: 0 };
    }
  }

  updateAndRender() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    switch (this.currentEffect) {
      case 'rain':
      case 'thunderstorm':
        this.renderRain();
        break;
      case 'snow':
        this.renderSnow();
        break;
      case 'stars':
        this.renderStars();
        break;
      case 'sun':
        this.renderSunMotes();
        break;
      case 'clouds':
      case 'fog':
        this.renderClouds();
        break;
    }
  }

  renderRain() {
    // Lightning effect for thunderstorms
    if (this.currentEffect === 'thunderstorm') {
      this.lightningTimer++;
      if (this.lightningTimer > 180 && Math.random() < 0.015) {
        this.lightningAlpha = 0.55 + Math.random() * 0.35;
        this.lightningTimer = 0;
      }
      if (this.lightningAlpha > 0) {
        this.ctx.fillStyle = `rgba(224, 231, 255, ${this.lightningAlpha})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.lightningAlpha *= 0.82;
        if (this.lightningAlpha < 0.01) this.lightningAlpha = 0;
      }
    }

    this.ctx.lineWidth = 1.5;
    for (let p of this.particles) {
      this.ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x + p.slanted, p.y + p.len);
      this.ctx.stroke();

      p.y += p.speed;
      p.x += p.slanted * 0.5;

      if (p.y > this.height) {
        p.y = -20;
        p.x = Math.random() * (this.width + 100) - 50;
      }
    }
  }

  renderSnow() {
    for (let p of this.particles) {
      p.swayOffset += p.swaySpeed;
      p.y += p.speed;
      p.x += Math.sin(p.swayOffset) * p.swayAmp;

      if (p.y > this.height) {
        p.y = -10;
        p.x = Math.random() * this.width;
      }

      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  renderStars() {
    // Twinkling stars
    for (let p of this.particles) {
      p.phase += p.twinkleSpeed;
      const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));

      this.ctx.fillStyle = `rgba(224, 231, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Occasional shooting star
    if (Math.random() < 0.007 && this.shootingStars.length === 0) {
      this.shootingStars.push({
        x: Math.random() * (this.width * 0.8),
        y: Math.random() * (this.height * 0.4),
        len: 80 + Math.random() * 60,
        speed: 16 + Math.random() * 8,
        life: 1.0
      });
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      const grad = this.ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y + (s.len * 0.6));
      grad.addColorStop(0, `rgba(255, 255, 255, ${s.life})`);
      grad.addColorStop(1, 'rgba(147, 197, 253, 0)');

      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(s.x + s.len, s.y + (s.len * 0.6));
      this.ctx.stroke();

      s.x += s.speed;
      s.y += s.speed * 0.6;
      s.life -= 0.035;

      if (s.life <= 0) {
        this.shootingStars.splice(i, 1);
      }
    }
  }

  renderSunMotes() {
    for (let p of this.particles) {
      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }

      this.ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  renderClouds() {
    for (let p of this.particles) {
      p.x += p.speedX;
      if (p.x - p.radius > this.width) {
        p.x = -p.radius * 2;
        p.y = Math.random() * (this.height * 0.6);
      }

      const grad = this.ctx.createRadialGradient(p.x, p.y, p.radius * 0.1, p.x, p.y, p.radius);
      grad.addColorStop(0, `rgba(203, 213, 225, ${p.opacity * 1.5})`);
      grad.addColorStop(0.7, `rgba(148, 163, 184, ${p.opacity * 0.8})`);
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  startLoop() {
    const loop = () => {
      if (this.isEnabled) {
        this.updateAndRender();
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }
}

window.WeatherCanvasEngine = WeatherCanvasEngine;
