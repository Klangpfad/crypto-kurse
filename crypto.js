document.getElementById('year').textContent = new Date().getFullYear();

const coins = ['bitcoin', 'ethereum', 'solana'];
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
  coins.forEach((coin) => {
    const priceElement = document.querySelector(`[data-coin-price="${coin}"]`);
    const changeElement = document.querySelector(`[data-coin-change="${coin}"]`);

    if (priceElement) {
      priceElement.textContent = 'nicht ladbar';
    }

    if (changeElement) {
      changeElement.textContent = '24h: keine Daten';
      changeElement.classList.remove('is-up', 'is-down');
    }
  });

  const updatedElement = document.getElementById('crypto-updated');
  if (updatedElement) {
    updatedElement.textContent = 'Quelle: CoinGecko · Kurse aktuell nicht ladbar';
  }
}

function updateCryptoCards(data) {
  coins.forEach((coin) => {
    const coinData = data[coin];
    const priceElement = document.querySelector(`[data-coin-price="${coin}"]`);
    const changeElement = document.querySelector(`[data-coin-change="${coin}"]`);

    if (!coinData || !priceElement || !changeElement) {
      return;
    }

    const change = coinData.eur_24h_change;
    priceElement.textContent = priceFormatter.format(coinData.eur);
    changeElement.textContent = Number.isFinite(change) ? `24h: ${changeFormatter.format(change)} %` : '24h: --';
    changeElement.classList.toggle('is-up', change > 0);
    changeElement.classList.toggle('is-down', change < 0);
  });

  const updatedElement = document.getElementById('crypto-updated');
  if (updatedElement) {
    updatedElement.textContent = `Quelle: CoinGecko · Aktualisiert ${new Date().toLocaleTimeString('de-DE')}`;
  }
}

fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=eur&include_24hr_change=true')
  .then((response) => {
    if (!response.ok) {
      throw new Error('CoinGecko nicht erreichbar');
    }

    return response.json();
  })
  .then(updateCryptoCards)
  .catch(setCryptoFallback);

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
