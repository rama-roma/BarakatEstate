/* eslint-disable @typescript-eslint/no-unused-vars */
// ── DATA ──
const properties = [];

let adminProperties = [];

function mediaUrl(media) {
  const raw = Array.isArray(media) ? media[0] : media;
  const item = raw?.attributes || raw;
  const url = item?.url;
  if (!url) return '';
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  const baseUrl = window.BARAKAT_API_URL || 'http://localhost:3001';
  return `${baseUrl}${url}`;
}

function relationData(relation) {
  return relation?.data?.attributes || relation?.data || relation?.attributes || relation || null;
}

function mapDistrict(value) {
  const labels = {
    center: 'Центр',
    ismoili_somoni: 'И. Сомони',
    sino: 'Сино',
    firdavsi: 'Фирдавси',
    shohmansur: 'Шохмансур',
    other: 'Душанбе',
  };
  return labels[value] || value || 'Душанбе';
}

function mapPropertyType(value) {
  const labels = {
    apartment: 'Квартира',
    studio: 'Студия',
    house: 'Дом',
    commercial: 'Коммерческая',
    new_building: 'Новостройка',
  };
  return labels[value] || value || 'Квартира';
}

function formatAdminPrice(item) {
  const currency = item.currency || 'USD';
  const amount = Number(item.price || 0).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
  const symbol = currency === 'USD' ? '$' : 'TJS';
  const suffix = item.monthlyPrice ? ' /мес' : '';
  return currency === 'USD' ? `${symbol}${amount}${suffix}` : `${amount} ${symbol}${suffix}`;
}

function mapAdminListing(entry) {
  const item = entry?.attributes || entry;
  const employee = relationData(item.employee);
  const seller = relationData(item.seller);
  const location = relationData(item.location) || relationData(item.coordinates) || item.geo || {};
  const gallery = item.gallery?.data || item.gallery || [];
  const galleryImages = Array.isArray(gallery)
    ? gallery.map(mediaUrl).filter(Boolean)
    : [mediaUrl(gallery)].filter(Boolean);
  const mainImage = mediaUrl(item.mainImage?.data || item.mainImage) || galleryImages[0] || '';
  const images = [...new Set([mainImage, ...galleryImages].filter(Boolean))];
  const sellerAvatar = mediaUrl(seller?.avatar?.data || seller?.avatar) || mediaUrl(item.sellerAvatar) || mediaUrl(employee?.avatar?.data || employee?.avatar);
  const fallbackName = seller?.name || item.sellerName || employee?.fullName || 'Продавец';
  const sellerPhone = seller?.phone || item.sellerPhone || employee?.phone || '';
  const latitude = getPropertyCoordinate(item, location, 'lat');
  const longitude = getPropertyCoordinate(item, location, 'lng');

  return normalizeProperty({
    id: item.slug || entry.documentId || entry.id,
    title: item.title,
    price: formatAdminPrice(item),
    priceNote: item.dealType === 'rent' ? 'Аренда' : 'Продажа',
    addr: item.address,
    rooms: item.rooms || 0,
    area: item.area || 0,
    floor: item.floor && item.totalFloors ? `${item.floor}/${item.totalFloors}` : String(item.floor || '-'),
    type: item.dealType || 'sale',
    image: mainImage || '',
    images,
    tag: item.dealType === 'rent' ? 'rent' : 'sale',
    tagLabel: item.dealType === 'rent' ? 'Аренда' : 'Продажа',
    sellerId: item.sellerId || seller?.id || '',
    agent: initials(fallbackName),
    agentAvatar: sellerAvatar,
    agentName: fallbackName,
    deals: seller?.dealsCount || employee?.dealsCount || 0,
    rating: seller?.rating || employee?.rating || 5,
    telegram: seller?.telegram || '',
    instagram: seller?.instagram || '',
    year: item.yearBuilt || '',
    new: Boolean(item.isFeatured),
    propertyType: mapPropertyType(item.propertyType),
    district: mapDistrict(item.district),
    features: Array.isArray(item.features) ? item.features.join(' ') : item.features || '',
    description: item.description || '',
    phone: sellerPhone,
    mapX: item.mapX ? `${item.mapX}%` : '',
    mapY: item.mapY ? `${item.mapY}%` : '',
    lat: latitude,
    lng: longitude,
    source: 'admin',
  });
}

async function loadAdminProperties() {
  const baseUrl = window.BARAKAT_API_URL;
  if (!baseUrl) return;

  try {
    const params = [
      'sort=createdAt:desc',
      'pagination[pageSize]=100',
    ].join('&');
    const response = await fetch(`${baseUrl}/api/listings?${params}`, { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    adminProperties = (payload.data || []).map(mapAdminListing);
  } catch {
    adminProperties = [];
  }
}

function initials(name) {
  return (name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function normalizeNumber(value) {
  const match = String(value || '').replace(',', '.').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function normalizeCoordinate(value, axis = 'lat') {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return value;
  if (Array.isArray(value) && value.length >= 2) {
    return normalizeNumber(value[axis === 'lat' ? 1 : 0]);
  }
  if (typeof value === 'object') {
    const lat = value.lat ?? value.latitude ?? value.latitud ?? value.latitude ?? null;
    const lng = value.lng ?? value.longitude ?? value.long ?? value.lng ?? null;
    return normalizeNumber(axis === 'lat' ? lat ?? lng : lng ?? lat);
  }
  return normalizeNumber(value);
}

function getPropertyCoordinate(item, location, axis) {
  const candidates = axis === 'lat'
    ? [item.lat, item.latitude, location?.lat, location?.latitude, location?.coordinates, location?.geo, item.geo]
    : [item.lng, item.longitude, location?.lng, location?.longitude, location?.coordinates, location?.geo, item.geo];

  for (const candidate of candidates) {
    const normalized = normalizeCoordinate(candidate, axis);
    if (typeof normalized === 'number') return normalized;
  }
  return null;
}

function splitFeatures(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function districtFromAddress(address) {
  const districts = ['Центр', 'И. Сомони', 'Сино', 'Фирдавси', 'Шохмансур', 'Сарахиёт'];
  return districts.find((district) => String(address || '').includes(district)) || '';
}

function normalizeProperty(property) {
  return {
    propertyType: 'Квартира',
    district: districtFromAddress(property.addr),
    features: 'Парковка, Лифт, Балкон, Мебель, Охрана',
    description: '',
    ...property,
  };
}

function getAllProperties() {
  return [...adminProperties, ...properties.map(normalizeProperty)];
}

function findPropertyById(id) {
  return getAllProperties().find((property) => String(property.id) === String(id));
}

const lucideIcons = {
  bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  building2: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v8"/><path d="M18 9h2a2 2 0 0 1 2 2v11"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
  keyRound: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  mapPin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.14a2.12 2.12 0 0 0-.611-1.878L2.16 9.795a.53.53 0 0 1 .294-.904l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

function lucideIcon(name, className = 'lucide-inline') {
  return `<svg class="${className}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${lucideIcons[name] || ''}</svg>`;
}

// ── RENDER CARDS ──
function propCard(p, onclick) {
  const isFav = isFavoriteProperty(p.id);
  return `<div class="prop-card" onclick="${onclick||`navigate('property','${p.id}')`}" style="animation-delay:${Math.random()*.3}s">
    <div class="prop-img">
      <img src="${p.image}" alt="${p.addr}" loading="lazy" />
      <div class="prop-tags">
        <span class="tag tag-${p.tag}">${p.tagLabel}</span>
        ${p.new?'<span class="tag tag-new">Новое</span>':''}
      </div>
      <button class="prop-fav${isFav ? ' active' : ''}" onclick="event.stopPropagation();toggleFav(this)" aria-label="Добавить в избранное" data-prop-id="${p.id}" data-fav="${isFav ? 'true' : 'false'}">${lucideIcon('heart', 'lucide-fav')}</button>
    </div>
    <div class="prop-body">
      <div class="prop-price">${p.price} <small>${p.priceNote}</small></div>
      <div class="prop-addr">${lucideIcon('mapPin')} ${p.addr}
        <button class="prop-addr-favorites" type="button" onclick="event.stopPropagation();navigate('favorites')" aria-label="Перейти в избранное">${lucideIcon('heart','lucide-inline')}</button>
      </div>
      <div class="prop-meta">
        <span>${lucideIcon('bed')} <strong>${p.rooms}</strong> комн</span>
        <span>${lucideIcon('ruler')} <strong>${p.area}</strong> м²</span>
        <span>${lucideIcon('building2')} <strong>${p.floor}</strong> эт</span>
      </div>
      <div class="prop-agent">
        <div class="agent-ava">${p.agentAvatar ? `<img src="${p.agentAvatar}" alt="${p.agentName}" />` : p.agent}</div>
        <div>
          <strong onclick="event.stopPropagation();navigate('profile','${p.sellerId || ''}')">${p.agentName}</strong>
          <small> · ${lucideIcon('star', 'lucide-inline lucide-star')} ${p.rating}</small>
        </div>
      </div>
    </div>
  </div>`;
}

function renderCards(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const items = getAllProperties().slice(0, count || getAllProperties().length);
  container.innerHTML = items.length
    ? items.map(p => propCard(p)).join('')
    : '<div class="seller-empty" style="grid-column:1/-1">Объявления появятся после публикации в админке</div>';
}

function renderMapResults() {
  const el = document.getElementById('map-results-list');
  if (!el) return;

  const items = getFilteredMapProperties();
  el.innerHTML = items.length ? items.map((p) => `
    <div class="map-card" onclick="navigate('property','${p.id}')">
      <div class="map-card-img"><img src="${p.image}" alt="${p.addr}" loading="lazy" /></div>
      <div class="map-card-info">
        <div class="map-card-price">${p.price}</div>
        <div class="map-card-addr">${lucideIcon('mapPin')} ${p.addr}</div>
        ${typeof p.lat === 'number' && typeof p.lng === 'number' ? `<div class="map-card-coords">${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</div>` : ''}
        <div class="map-card-meta">
          <span>${lucideIcon('bed')} ${p.rooms} комн</span>
          <span>${lucideIcon('ruler')} ${p.area} м²</span>
        </div>
      </div>
    </div>
  `).join('') : '<div class="seller-empty">На карте пока нет опубликованных объектов</div>';

  const count = document.getElementById('map-results-count');
  if (count) {
    count.textContent = `Показано: ${items.length} объектов`;
  }

  const fullMap = document.getElementById('leaflet-full-map');
  if (fullMap && fullMap._leaflet) {
    addLeafletMarkers(fullMap, items);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(existing));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(script);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletLoading) return window.__leafletLoading;
  window.__leafletLoading = loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js').then(() => window.L);
  return window.__leafletLoading;
}

function createLeafletMap(elementId, center, zoom = 12) {
  const container = document.getElementById(elementId);
  if (!container || !window.L) return null;
  if (container._leaflet) return container._leaflet;

  const map = window.L.map(container, {
    zoomControl: false,
    attributionControl: false,
  }).setView(center, zoom);

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 5,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  container._leaflet = map;
  container._leafletMarkers = window.L.layerGroup().addTo(map);
  return map;
}

function addLeafletMarkers(container, items) {
  if (!container || !container._leaflet || !window.L) return;
  const markers = container._leafletMarkers || window.L.layerGroup().addTo(container._leaflet);
  markers.clearLayers();
  container._leafletMarkers = markers;

  const validItems = (items || []).filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number');
  validItems.forEach((item) => {
    const markerHtml = `
      <div class="custom-map-marker house-marker">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5Z" />
          <path d="M9 22V14h6v8" fill="#fff" />
          <path d="M9 12h6" stroke="#fff" stroke-width="1.5" />
        </svg>
      </div>
    `;

    const marker = window.L.marker([item.lat, item.lng], {
      icon: window.L.divIcon({
        className: 'custom-map-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      }),
    }).addTo(markers);

    marker.bindPopup(`<strong>${item.title || item.addr}</strong><br>${item.price}<br><small>${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}</small>`);
  });

  if (validItems.length) {
    const bounds = window.L.latLngBounds(validItems.map((item) => [item.lat, item.lng]));
    container._leaflet.fitBounds(bounds.pad(0.3));
  }
}

async function initLeafletMaps() {
  await loadLeaflet().catch(() => null);
  if (!window.L) return;

  const preview = document.getElementById('preview-leaflet-map');
  if (preview) {
    createLeafletMap('preview-leaflet-map', [38.556, 68.783], 12);
    addLeafletMarkers(preview, getAllProperties());
  }

  const full = document.getElementById('leaflet-full-map');
  if (full) {
    createLeafletMap('leaflet-full-map', [38.556, 68.783], 12);
    addLeafletMarkers(full, getFilteredMapProperties());
  }
}

function renderPropertyDetailMap(property) {
  if (!property || typeof property.lat !== 'number' || typeof property.lng !== 'number') return;
  const container = document.getElementById('detail-leaflet-map');
  if (!container) return;

  return loadLeaflet().then(() => {
    const map = createLeafletMap('detail-leaflet-map', [property.lat, property.lng], 15);
    if (!map) return;

    addLeafletMarkers(container, [property]);
    map.setView([property.lat, property.lng], 15);
    const coords = document.getElementById('detail-map-coords');
    if (coords) coords.textContent = `${property.lat.toFixed(5)}, ${property.lng.toFixed(5)}`;
  }).catch(() => null);
}

// ── ROUTING ──
function routeForPage(page) {
  const routes = {
    home: '/',
    listings: '/listings',
    services: '/services',
    map: '/map',
    property: '/property',
    favorites: '/favorites',
    agent: '/profile',
    profile: '/profile',
  };
  return routes[page] || '/';
}

function setupHomeServices() {
  const cards = document.querySelectorAll('#page-home .services-section:not(.services-catalog-section) .service-card');
  const hrefs = ['/buy-property', '/repair', '/design', '/document-registration'];
  cards.forEach((card, index) => {
    const href = hrefs[index];
    if (!href || card.dataset.hrefReady === 'true') return;
    card.dataset.hrefReady = 'true';
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.addEventListener('click', () => {
      window.location.href = href;
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.location.href = href;
      }
    });
  });
}

async function hydrateAuraPage(page) {
  await loadAdminProperties();
  renderCatalogState();

  if (page === 'home') {
    setupHomeServices();
    renderCards('featured-grid', 6);
    setupHomeCarousel();
  }
  if (page === 'listings') {
    setupListingFilters();
    renderFilteredListings();
  }
  if (page === 'map') {
    setupMapFilters();
    renderMapResults();
  }
  if (page === 'property') renderPropertyDetail();
  if (page === 'favorites') renderFavoritesPage();
  if (page === 'agent') renderCards('agent-grid', 6);
  if (page === 'services') setupServiceRequestForm();
  await initLeafletMaps();
}

function renderCatalogState() {
  const total = getAllProperties().length;
  document.querySelectorAll('.hero-card').forEach((card) => {
    card.style.display = total ? '' : 'none';
  });
  document.querySelectorAll('.floating-badge').forEach((badge) => {
    badge.style.display = total ? '' : 'none';
  });

  const heroCards = document.querySelector('.hero-cards');
  if (heroCards && !total && !heroCards.querySelector('.hero-design-preview')) {
    heroCards.insertAdjacentHTML(
      'afterbegin',
      `<div class="hero-design-preview" aria-hidden="true">
        <div class="design-map-card">
          <div class="design-map-grid"></div>
          <span class="design-pin pin-a"></span>
          <span class="design-pin pin-b"></span>
          <span class="design-pin pin-c"></span>
          <div class="design-district">Dushanbe</div>
        </div>
        <div class="design-info-card">
          <span></span><span></span><span></span>
        </div>
        <div class="design-tower tower-a"></div>
        <div class="design-tower tower-b"></div>
        <div class="design-tower tower-c"></div>
      </div>`,
    );
  }

  document.querySelectorAll('.stat-num').forEach((el, index) => {
    if (index === 0) el.innerHTML = `${total}<span>+</span>`;
  });
  document.querySelectorAll('.listings-count').forEach((el) => {
    el.innerHTML = `Найдено: <strong>${total} объектов</strong>`;
  });
  document.querySelectorAll('#map-results-count').forEach((el) => {
    el.textContent = `Показано: ${total} объектов`;
  });
  document.querySelectorAll('.map-overlay-ui p').forEach((el) => {
    el.textContent = `${total} объектов на карте`;
  });
}

function setupHomeCarousel() {
  const track = document.querySelector('.hero-cards-track');
  if (!track) return;

  // Remove old clones before rebuilding the infinite loop.
  track.querySelectorAll('.carousel-clone').forEach((clone) => clone.remove());

  const originalCards = Array.from(track.children).filter((card) => !card.classList.contains('carousel-clone'));
  const cloneCount = Math.min(2, originalCards.length);

  const prependClones = originalCards.slice(-cloneCount).map((card) => {
    const clone = card.cloneNode(true);
    clone.classList.add('carousel-clone');
    return clone;
  });
  const appendClones = originalCards.slice(0, cloneCount).map((card) => {
    const clone = card.cloneNode(true);
    clone.classList.add('carousel-clone');
    return clone;
  });

  prependClones.reverse().forEach((clone) => track.prepend(clone));
  appendClones.forEach((clone) => track.append(clone));

  window.heroCarouselOriginalCount = originalCards.length;
  window.heroCarouselCloneCount = cloneCount;
  window.heroCarouselIndex = cloneCount;

  if (window.heroCarouselTimer) window.clearInterval(window.heroCarouselTimer);

  window.slideHeroCards = function(direction) {
    const track = document.querySelector('.hero-cards-track');
    if (!track) return;
    const cards = Array.from(track.children);
    if (!cards.length) return;

    window.heroCarouselIndex += direction;
    window.updateHeroCarousel();

    const resetIndex = () => {
      track.removeEventListener('transitionend', resetIndex);
      const cloneCount = window.heroCarouselCloneCount;
      const originalCount = window.heroCarouselOriginalCount;
      if (window.heroCarouselIndex < cloneCount) {
        window.heroCarouselIndex += originalCount;
      } else if (window.heroCarouselIndex >= cloneCount + originalCount) {
        window.heroCarouselIndex -= originalCount;
      } else {
        return;
      }
      window.updateHeroCarousel(true);
    };

    track.addEventListener('transitionend', resetIndex, { once: true });
  };

  window.updateHeroCarousel = function(skipTransition = false) {
    const track = document.querySelector('.hero-cards-track');
    const container = document.querySelector('.hero-cards');
    if (!track || !container) return;
    const cards = Array.from(track.children);
    if (!cards.length) return;

    track.style.transition = skipTransition ? 'none' : 'transform .45s ease';
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = 20;
    const containerWidth = container.getBoundingClientRect().width;
    const centeredOffset = window.heroCarouselIndex * (cardWidth + gap) - (containerWidth - cardWidth) / 2;
    track.style.transform = `translateX(${-centeredOffset}px)`;

    cards.forEach((card, index) => {
      const isActive = index === window.heroCarouselIndex;
      const isPrev = index === window.heroCarouselIndex - 1;
      const isNext = index === window.heroCarouselIndex + 1;
      card.classList.toggle('active', isActive);
      card.classList.toggle('prev', isPrev);
      card.classList.toggle('next', isNext);
      if (!isPrev && !isNext && !isActive) {
        card.classList.remove('prev', 'next');
      }
    });
  };

  window.updateHeroCarousel(true);
  window.heroCarouselTimer = window.setInterval(() => window.slideHeroCards(1), 4500);
}

function navigate(page, id) {
  const url = routeForPage(page);
  if (page === 'profile' && id) {
    window.location.href = `${url}?seller=${encodeURIComponent(id)}`;
    return;
  }
  window.location.href = id ? `${url}?id=${encodeURIComponent(id)}` : url;
}
function setSearchTab(el, type) {
  document.querySelectorAll('.s-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function filterChip(el) {
  const group = el.parentElement;
  group?.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderFilteredListings();
}

function setupListingFilters() {
  const page = document.querySelector('.listings-page');
  if (!page || page.dataset.filtersReady === 'true') return;
  page.dataset.filtersReady = 'true';

  page.querySelectorAll('input, select').forEach((control) => {
    control.addEventListener('input', renderFilteredListings);
    control.addEventListener('change', renderFilteredListings);
  });
  page.querySelectorAll('.s-btn, .listings-filter-sidebar .btn-primary').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      renderFilteredListings();
    });
  });
  page.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChip(chip);
      const roomGroup = chip.closest('.filter-group');
      if (roomGroup?.querySelector('h4')?.textContent?.trim() === 'Комнат') {
        roomGroup.dataset.roomSelected = 'true';
      }
      window.setTimeout(renderFilteredListings, 0);
    });
  });
}

function selectedCheckboxValues(title) {
  const groups = Array.from(document.querySelectorAll('.filter-group'));
  const group = groups.find((item) => item.querySelector('h4')?.textContent?.trim() === title);
  if (!group) return [];
  return Array.from(group.querySelectorAll('.filter-check'))
    .filter((label) => label.querySelector('input')?.checked)
    .map((label) => label.textContent.trim());
}

function getRoomFilter() {
  const roomGroup = Array.from(document.querySelectorAll('.filter-group')).find(
    (item) => item.querySelector('h4')?.textContent?.trim() === 'Комнат',
  );
  if (roomGroup?.dataset.roomSelected !== 'true') return '';
  return roomGroup?.querySelector('.filter-chip.active')?.textContent?.trim() || '';
}

function getListingsFilters() {
  const search = document.querySelector('.listings-page .s-input')?.value?.trim().toLowerCase() || '';
  const propertyTypeSelect = document.querySelectorAll('.listings-page .s-select')[0];
  const roomsSelect = document.querySelectorAll('.listings-page .s-select')[1];
  const sortSelect = document.querySelector('.sort-select');
  const priceRange = Array.from(document.querySelectorAll('.filter-group')).find(
    (item) => item.querySelector('h4')?.textContent?.trim() === 'Цена (USD)',
  )?.querySelector('.range-input');
  const areaRange = Array.from(document.querySelectorAll('.filter-group')).find(
    (item) => item.querySelector('h4')?.textContent?.trim() === 'Площадь (м²)',
  )?.querySelector('.range-input');

  return {
    search,
    propertyType: propertyTypeSelect?.value || '',
    rooms: roomsSelect?.value || '',
    sort: sortSelect?.value || '',
    deals: selectedCheckboxValues('Тип сделки'),
    types: selectedCheckboxValues('Тип жилья'),
    districts: selectedCheckboxValues('Район'),
    features: selectedCheckboxValues('Особенности'),
    roomChip: getRoomFilter(),
    maxPrice: Number(priceRange?.value || 0),
    maxArea: Number(areaRange?.value || 0),
  };
}

function getMapFilters() {
  const page = document.querySelector('.map-page');
  if (!page) return { search: '', activeChips: [] };
  const search = page.querySelector('.map-topbar .s-input')?.value.trim().toLowerCase() || '';
  const activeChips = Array.from(page.querySelectorAll('.filter-chip.active')).map((chip) => chip.textContent.trim());
  return { search, activeChips };
}

function getFilteredMapProperties() {
  const filters = getMapFilters();
  return getAllProperties().filter((property) => propertyMatchesMapFilters(property, filters));
}

function propertyMatchesMapFilters(property, filters) {
  if (!filters || !filters.activeChips.length) return true;
  if (filters.search) {
    const text = `${property.addr} ${property.district || ''} ${property.propertyType || ''} ${property.description || ''}`.toLowerCase();
    if (!text.includes(filters.search)) return false;
  }

  if (filters.activeChips.includes('Все')) return true;

  if (filters.activeChips.includes('Продажа') && property.type !== 'sale') return false;
  if (filters.activeChips.includes('Аренда') && property.type !== 'rent') return false;

  const roomChips = filters.activeChips.filter((chip) => chip.endsWith('комн'));
  if (roomChips.length) {
    const matchesRoom = roomChips.some((chip) => {
      if (chip === '3+ комн') return Number(property.rooms) >= 3;
      const value = Number(chip.split(' ')[0]);
      return Number(property.rooms) === value;
    });
    if (!matchesRoom) return false;
  }

  return true;
}

function setupMapFilters() {
  const page = document.querySelector('.map-page');
  if (!page || page.dataset.mapFiltersReady === 'true') return;
  page.dataset.mapFiltersReady = 'true';

  const searchInput = page.querySelector('.map-topbar .s-input');
  if (searchInput) {
    searchInput.addEventListener('input', renderMapResults);
  }

  const chips = Array.from(page.querySelectorAll('.filter-chip'));
  const allChip = chips.find((chip) => chip.textContent.trim() === 'Все');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const label = chip.textContent.trim();
      if (label === 'Все') {
        chips.forEach((item) => item.classList.toggle('active', item === chip));
      } else {
        chip.classList.toggle('active');
        if (allChip) allChip.classList.remove('active');
        const anySelected = chips.some((item) => item !== allChip && item.classList.contains('active'));
        if (!anySelected && allChip) allChip.classList.add('active');
      }
      renderMapResults();
    });
  });
}

function propertyMatchesFilters(property, filters) {
  const text = `${property.addr} ${property.district || ''} ${property.propertyType || ''} ${property.description || ''}`.toLowerCase();
  if (filters.search && !text.includes(filters.search)) return false;

  if (filters.propertyType && filters.propertyType !== 'Все типы' && property.propertyType !== filters.propertyType) return false;
  if (filters.rooms && filters.rooms !== 'Комнат') {
    const selectedRooms = Number(filters.rooms.replace('+', ''));
    if (filters.rooms.includes('+') ? Number(property.rooms) < selectedRooms : Number(property.rooms) !== selectedRooms) return false;
  }
  if (filters.roomChip) {
    const selectedRooms = Number(filters.roomChip.replace('+', ''));
    if (filters.roomChip.includes('+') ? Number(property.rooms) < selectedRooms : Number(property.rooms) !== selectedRooms) return false;
  }

  if (filters.deals.length) {
    const dealLabel = property.type === 'rent' ? 'Аренда' : 'Продажа';
    if (!filters.deals.includes(dealLabel)) return false;
  }
  if (filters.types.length && !filters.types.includes(property.propertyType || 'Квартира')) return false;
  if (filters.districts.length && !filters.districts.some((district) => property.addr.includes(district) || property.district === district)) return false;
  if (filters.features.length) {
    const featureText = `${property.features || ''} ${property.description || ''}`.toLowerCase();
    if (!filters.features.every((feature) => featureText.includes(feature.toLowerCase()))) return false;
  }

  const price = normalizeNumber(property.price);
  if (filters.maxPrice && price && price > filters.maxPrice) return false;
  if (filters.maxArea && Number(property.area) && Number(property.area) > filters.maxArea) return false;

  return true;
}

function sortProperties(items, sort) {
  const sorted = [...items];
  if (sort === 'Сначала дешевле') sorted.sort((a, b) => normalizeNumber(a.price) - normalizeNumber(b.price));
  if (sort === 'Сначала дороже') sorted.sort((a, b) => normalizeNumber(b.price) - normalizeNumber(a.price));
  if (sort === 'Новые первые') sorted.sort((a, b) => Number(Boolean(b.new)) - Number(Boolean(a.new)));
  return sorted;
}

function renderFilteredListings() {
  const container = document.getElementById('listings-grid');
  if (!container) return;

  const filters = getListingsFilters();
  const items = sortProperties(getAllProperties().filter((property) => propertyMatchesFilters(property, filters)), filters.sort);
  container.innerHTML = items.length
    ? items.map((property) => propCard(property)).join('')
    : '<div class="seller-empty" style="grid-column:1/-1">По этим фильтрам объявлений нет</div>';

  const count = document.querySelector('.listings-count');
  if (count) count.innerHTML = `Найдено: <strong>${items.length} объектов</strong>`;
}

function renderPropertyDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  const property = id ? findPropertyById(id) : null;
  if (!property) {
    const detail = document.querySelector('.prop-detail');
    if (detail) {
      detail.innerHTML = '<div class="seller-empty property-empty">Выберите опубликованное объявление из каталога. Сейчас реальных объявлений пока нет.</div>';
    }
    return;
  }

  const detailPrice = document.querySelector('.detail-price');
  const detailPricePer = document.querySelector('.detail-price-per');
  const detailTitle = document.querySelector('.detail-title');
  const detailAddr = document.querySelector('.detail-addr');
  const detailDesc = document.querySelector('.detail-desc');
  const priceDisplay = document.querySelector('.price-display');
  const priceNote = document.querySelector('.price-note');
  const contactAvatar = document.querySelector('.ca-ava');
  const contactName = document.querySelector('.ca-info strong');
  const contactMeta = document.querySelector('.ca-info small');
  const contactAgent = document.querySelector('.contact-agent');
  const amenitiesGrid = document.querySelector('.amenities-grid');

  if (detailPrice) detailPrice.textContent = property.price;
  if (detailPricePer) {
    detailPricePer.textContent = property.area ? `≈ ${Math.round(normalizeNumber(property.price) / Number(property.area)) || '-'} $/м²` : '';
  }
  if (detailTitle) detailTitle.textContent = property.title || property.addr;
  if (detailAddr) detailAddr.innerHTML = `${lucideIcon('mapPin')} ${property.addr}`;
  if (detailDesc) detailDesc.textContent = property.description || 'Описание пока не добавлено.';
  if (priceDisplay) priceDisplay.textContent = property.price;
  if (priceNote) priceNote.textContent = `${property.priceNote} · ${property.area} м² · ${property.rooms} комн`;
  const detailLocationDistrict = document.getElementById('detail-location-district');
  const detailLocationAddress = document.getElementById('detail-location-address');
  const detailLocationCoords = document.getElementById('detail-location-coords');
  const detailMapOverlay = document.getElementById('detail-map-overlay');

  if (detailLocationDistrict) detailLocationDistrict.textContent = property.district || '—';
  if (detailLocationAddress) detailLocationAddress.textContent = property.addr || 'Адрес не указан';
  if (detailLocationCoords) {
    detailLocationCoords.textContent = (typeof property.lat === 'number' && typeof property.lng === 'number')
      ? `${property.lat.toFixed(5)}, ${property.lng.toFixed(5)}`
      : 'Координаты не указаны';
  }
  if (detailMapOverlay) {
    detailMapOverlay.innerHTML = `${lucideIcon('mapPin')} ${property.addr || 'Посмотреть на карте'}${
      typeof property.lat === 'number' && typeof property.lng === 'number' ? '' : ''
    }`;
  }
  if (contactAvatar) {
    contactAvatar.innerHTML = property.agentAvatar
      ? `<img src="${property.agentAvatar}" alt="${property.agentName}" />`
      : property.agent;
  }
  if (contactName) contactName.textContent = property.agentName;
  if (contactMeta) {
    contactMeta.innerHTML = `${lucideIcon('star', 'lucide-inline lucide-star')} ${property.rating || 5} · ${property.deals || 0} сделок`;
  }
  if (contactAgent) {
    contactAgent.onclick = () => {
      if (property.sellerId) {
        navigate('profile', property.sellerId);
        return;
      }
      showNotif(property.phone ? `${property.agentName}: ${property.phone}` : `${property.agentName}: контакты в объявлении`);
    };
  }

  if (amenitiesGrid) {
    const amenities = splitFeatures(property.features);
    amenitiesGrid.innerHTML = amenities.length
      ? amenities.map((feature) => `<div class="amenity">${lucideIcon('check', 'lucide-inline amenity-icon')}<span>${feature}</span></div>`).join('')
      : '<div class="amenity amenity-empty">Удобства пока не указаны</div>';
  }

  const galleryMain = document.querySelector('.gallery-main');
  const galleryThumbs = document.querySelector('.gallery-thumbs');
  const images = Array.isArray(property.images) && property.images.length
    ? property.images
    : property.image ? [property.image] : [];

  if (galleryMain) {
    galleryMain.innerHTML = images.length
      ? `<img src="${images[0]}" alt="${property.title || property.addr}" />`
      : '<div class="gallery-empty">Изображения пока не указаны</div>';
  }

  if (galleryThumbs) {
    galleryThumbs.innerHTML = images.length > 1
      ? images.slice(1).map((src, index) => `
        <div class="gallery-thumb">
          <img src="${src}" alt="${property.title || property.addr} ${index + 2}" loading="lazy" />
        </div>
      `).join('')
      : '';
  }

  renderPropertyDetailMap(property);
}

function getFavoriteIds() {
  const value = window.localStorage.getItem('barakatFavorites');
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}

function saveFavoriteIds(ids) {
  window.localStorage.setItem('barakatFavorites', JSON.stringify([...new Set(ids.map(String))]));
}

function isFavoriteProperty(id) {
  return getFavoriteIds().includes(String(id));
}

function getFavoriteProperties() {
  const ids = getFavoriteIds();
  return getAllProperties().filter((property) => ids.includes(String(property.id)));
}

function toggleFavoriteId(id) {
  const ids = getFavoriteIds();
  const value = String(id);
  const index = ids.indexOf(value);
  if (index >= 0) ids.splice(index, 1);
  else ids.push(value);
  saveFavoriteIds(ids);
  return ids.includes(value);
}

function renderFavoritesPage() {
  const container = document.getElementById('favorites-grid');
  const count = document.getElementById('favorites-count');
  const items = getFavoriteProperties();
  if (count) count.innerHTML = `Избранное: <strong>${items.length}</strong>`;
  if (!container) return;
  container.innerHTML = items.length
    ? items.map((property) => propCard(property)).join('')
    : '<div class="seller-empty" style="grid-column:1/-1">Пока не добавили туда сюда</div>';
}

function toggleFav(btn) {
  const id = btn.dataset.propId;
  if (!id) return;
  const isFav = toggleFavoriteId(id);
  btn.dataset.fav = String(isFav);
  btn.classList.toggle('active', isFav);
  btn.innerHTML = lucideIcon('heart', 'lucide-fav');
  if (window.location.pathname === '/favorites') {
    renderFavoritesPage();
  }
}

function setupServiceRequestForm() {
  const form = document.getElementById('service-request-form');
  if (!form || form.dataset.ready === 'true') return;
  form.dataset.ready = 'true';

  document.querySelectorAll('[data-service-request]').forEach((button) => {
    button.addEventListener('click', () => {
      const service = button.getAttribute('data-service-request') || '';
      const select = form.querySelector('[name="service"]');
      if (select && service) select.value = service;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.querySelector('[name="name"]')?.focus();
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || ''),
      phone: String(formData.get('phone') || ''),
      service: String(formData.get('service') || ''),
      message: String(formData.get('message') || ''),
    };

    if (button) {
      button.disabled = true;
      button.textContent = 'Отправляем...';
    }

    try {
      const response = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Не удалось отправить заявку');
      form.reset();
      showNotif('Заявка отправлена в Telegram');
    } catch (error) {
      showNotif(error instanceof Error ? error.message : 'Не удалось отправить заявку');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Отправить заявку';
      }
    }
  });
}

// ── NOTIFICATION ──
function showNotif(msg) {
  const n = document.getElementById('notif');
  document.getElementById('notif-text').textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 3000);
}

// ── SCROLL EFFECTS ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (window.scrollY > 20) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');

  // reveal
  document.querySelectorAll('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) el.classList.add('visible');
  });
});

// ── LOADER ──
function hideLoader() {
  document.getElementById('loader')?.classList.add('hidden');
}

// First render
setupHomeServices();
renderCards('featured-grid', 6);
initLeafletMaps();

