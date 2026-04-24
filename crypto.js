document.getElementById('year').textContent = new Date().getFullYear();

const coins = [
  'bitcoin',
  'ethereum',
  'solana',
  'ripple',
  'polkadot',
  'artificial-superintelligence-alliance'
];
const coinApiIds = {
  'artificial-superintelligence-alliance': 'fetch-ai'
};
const apiIds = coins.map((coin) => coinApiIds[coin] || coin).join(',');
const apiToCoinIds = coins.reduce((mappedIds, coin) => {
  mappedIds[coinApiIds[coin] || coin] = coin;
  return mappedIds;
}, {});
const cryptoEndpoint = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${apiIds}&price_change_percentage=24h,7d&sparkline=true`;
const refreshIntervalMs = 180000;
const refreshIntervalSeconds = refreshIntervalMs / 1000;
let isLoadingCrypto = false;

const priceFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2
});
const changeFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});

function setCryptoFallback() {
  const updatedElement = document.getElementById('crypto-updated');
  if (updatedElement) {
    updatedElement.textContent = 'Quelle: CoinGecko · Aktualisierung verzögert';
  }
}

function drawSparkline(canvas, prices, change) {
  if (!canvas || !Array.isArray(prices) || prices.length < 2) {
    return;
  }

  const context = canvas.getContext('2d');
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (!context || !width || !height) {
    return;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const padding = 4;
  const lineColor = Number.isFinite(change) ? (change < 0 ? '#ff9d9d' : '#7be9a7') : '#8f9db7';

  context.lineWidth = 1.8;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = lineColor;
  context.globalAlpha = 0.85;
  context.beginPath();

  prices.forEach((price, index) => {
    const x = (index / (prices.length - 1)) * width;
    const y = padding + ((max - price) / range) * (height - padding * 2);

    if (index === 0) {
      context.moveTo(x, y);
      return;
    }

    context.lineTo(x, y);
  });

  context.stroke();
  context.globalAlpha = 1;
}

function updateCryptoCards(data) {
  const dataByCoin = data.reduce((mappedData, coinData) => {
    const coin = apiToCoinIds[coinData.id];
    if (coin) {
      mappedData[coin] = coinData;
    }
    return mappedData;
  }, {});

  coins.forEach((coin) => {
    const coinData = dataByCoin[coin];
    const priceElement = document.querySelector(`[data-coin-price="${coin}"]`);
    const changeElement = document.querySelector(`[data-coin-change="${coin}"]`);
    const chartElement = document.querySelector(`[data-coin-chart="${coin}"]`);

    if (!coinData || !priceElement || !changeElement) {
      return;
    }

    const change = coinData.price_change_percentage_24h;
    priceElement.textContent = priceFormatter.format(coinData.current_price);
    changeElement.textContent = Number.isFinite(change) ? `24h: ${changeFormatter.format(change)} %` : '24h: --';
    changeElement.classList.toggle('is-up', change > 0);
    changeElement.classList.toggle('is-down', change < 0);
    drawSparkline(chartElement, coinData.sparkline_in_7d && coinData.sparkline_in_7d.price, change);
  });

  const updatedElement = document.getElementById('crypto-updated');
  if (updatedElement) {
    updatedElement.textContent = `Quelle: CoinGecko · Aktualisiert ${new Date().toLocaleTimeString('de-DE')} · Auto-Refresh ${refreshIntervalSeconds}s`;
  }
}

async function loadCryptoData() {
  if (isLoadingCrypto) {
    return;
  }

  isLoadingCrypto = true;

  try {
    const response = await fetch(cryptoEndpoint);
    if (!response.ok) {
      throw new Error('CoinGecko nicht erreichbar');
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('CoinGecko Antwort ungültig');
    }

    updateCryptoCards(data);
  } catch (error) {
    setCryptoFallback();
  } finally {
    isLoadingCrypto = false;
  }
}

loadCryptoData();
setInterval(loadCryptoData, refreshIntervalMs);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

document.body.classList.add('js-enhanced');
if (hasFinePointer) {
  document.body.classList.add('has-fine-pointer');
}

if (!prefersReducedMotion && hasFinePointer) {
  document.addEventListener('mousemove', (event) => {
    document.body.style.setProperty('--mouse-x', `${event.clientX}px`);
    document.body.style.setProperty('--mouse-y', `${event.clientY}px`);
  });
}

if (!prefersReducedMotion) {
  const sections = document.querySelectorAll('main section');
  sections.forEach((section) => section.classList.add('reveal-on-scroll'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  sections.forEach((section) => observer.observe(section));
}

function setupCardTilt() {
  if (prefersReducedMotion || !hasFinePointer) {
    return;
  }

  const tiltCards = document.querySelectorAll('.project-card');

  tiltCards.forEach((card) => {
    if (card.dataset.tiltBound === 'true') {
      return;
    }

    card.dataset.tiltBound = 'true';

    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const rotateX = ((y / rect.height) - 0.5) * -4;
      const rotateY = ((x / rect.width) - 0.5) * 4;

      card.style.transform = `translateY(-4px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

setupCardTilt();
