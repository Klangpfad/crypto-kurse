document.getElementById('year').textContent = new Date().getFullYear();

const coinMeta = {
  bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
  ethereum: { name: 'Ethereum', symbol: 'ETH' },
  solana: { name: 'Solana', symbol: 'SOL' },
  ripple: { name: 'XRP', symbol: 'XRP' },
  polkadot: { name: 'Polkadot', symbol: 'DOT' },
  'fetch-ai': { name: 'FET', symbol: 'FET' }
};

const searchParams = new URLSearchParams(window.location.search);
const requestedCoin = searchParams.get('coin') || 'bitcoin';
const coin = coinMeta[requestedCoin] ? requestedCoin : 'bitcoin';
const endpoint = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${coin}&price_change_percentage=24h,7d&sparkline=true`;

const priceFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2
});
const changeFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setChange(id, value) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.textContent = Number.isFinite(value) ? `${changeFormatter.format(value)} %` : '--';
  element.classList.toggle('is-up', value > 0);
  element.classList.toggle('is-down', value < 0);
}

function drawChart(canvas, prices, change) {
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
  const padding = 10;
  const lineColor = Number.isFinite(change) ? (change < 0 ? '#ff9d9d' : '#7be9a7') : '#8f9db7';

  context.strokeStyle = 'rgba(127, 176, 255, 0.12)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, height - padding);
  context.lineTo(width, height - padding);
  context.stroke();

  context.strokeStyle = lineColor;
  context.lineWidth = 2;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.globalAlpha = 0.9;
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

function showFallback() {
  setText('coin-status', 'Quelle: CoinGecko · Daten aktuell nicht ladbar');
  setText('coin-price', 'nicht ladbar');
  setText('coin-change-24h', '--');
  setText('coin-change-7d', '--');
}

async function loadCoin() {
  const meta = coinMeta[coin];
  setText('coin-name', meta.name);
  setText('coin-title', meta.name);
  setText('coin-symbol', meta.symbol);
  document.title = `${meta.name} · Crypto Kurse`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error('CoinGecko nicht erreichbar');
    }

    const data = await response.json();
    const coinData = Array.isArray(data) ? data[0] : null;
    if (!coinData) {
      throw new Error('CoinGecko Antwort ungültig');
    }

    const change24h = coinData.price_change_percentage_24h;
    const change7d = coinData.price_change_percentage_7d_in_currency;

    setText('coin-price', priceFormatter.format(coinData.current_price));
    setChange('coin-change-24h', change24h);
    setChange('coin-change-7d', change7d);
    drawChart(document.getElementById('coin-chart'), coinData.sparkline_in_7d && coinData.sparkline_in_7d.price, change24h);
    setText('coin-status', `Quelle: CoinGecko · Aktualisiert ${new Date().toLocaleTimeString('de-DE')}`);
  } catch (error) {
    showFallback();
  }
}

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

loadCoin();
