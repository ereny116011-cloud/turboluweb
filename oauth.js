/* Turbolu Studios — sosyal giriş (GitHub, Google, Microsoft, Xbox)
   Sağlayıcı akışı Worker üzerinde yürür; bu dosya yalnızca arayüzü ve
   dönen oturumu yönetir. Ayrıntılar: worker/OAUTH-INTEGRATION.md */
(function () {
  'use strict';

  const API = window.TURBOLU_API_URL || 'https://shrill-salad-a498.ereny116011.workers.dev';
  const SESSION_KEY = 'turboluOAuthProviders';
  const MESSAGES = {
    unavailable: 'Sosyal giriş şu an kullanılamıyor. Kullanıcı adı ve parolayla devam edebilirsin.',
    notReady: 'Bu giriş yöntemi henüz etkin değil.',
    starting: 'Sağlayıcıya yönlendiriliyorsun…',
    failed: 'Giriş tamamlanamadı. Lütfen yeniden dene.'
  };

  const PROVIDERS = [
    { id: 'github', label: 'GitHub', icon: 'fa-brands fa-github' },
    { id: 'google', label: 'Google', icon: 'fa-brands fa-google' },
    { id: 'microsoft', label: 'Microsoft', icon: 'fa-brands fa-microsoft' },
    { id: 'xbox', label: 'Xbox', icon: 'fa-brands fa-xbox' }
  ];

  let providersPromise = null;

  function ensureStyles() {
    if (!document.getElementById('turbolu-oauth-brands')) {
      const brands = document.createElement('link');
      brands.id = 'turbolu-oauth-brands';
      brands.rel = 'stylesheet';
      brands.href = '/fa/css/brands.min.css';
      document.head.appendChild(brands);
    }
    if (document.getElementById('turbolu-oauth-css')) return;
    const link = document.createElement('link');
    link.id = 'turbolu-oauth-css';
    link.rel = 'stylesheet';
    link.href = '/oauth.css?v=2';
    document.head.appendChild(link);
  }

  function loadProviders() {
    if (providersPromise) return providersPromise;
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        const list = JSON.parse(cached);
        // Boş liste önbelleğe alınmaz; sağlayıcılar sonradan açılınca düğmeler çalışsın.
        if (Array.isArray(list) && list.length) {
          providersPromise = Promise.resolve(list);
          return providersPromise;
        }
      } catch (_) { /* bozuk önbellek aşağıda temizlenir */ }
      sessionStorage.removeItem(SESSION_KEY);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    providersPromise = fetch(`${API}/api/auth/oauth/providers`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        const list = data && Array.isArray(data.providers) ? data.providers : null;
        if (list && list.length) sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
        else sessionStorage.removeItem(SESSION_KEY);
        return list;
      })
      .catch(() => null)
      .finally(() => clearTimeout(timer));
    return providersPromise;
  }

  function startUrl(provider) {
    const target = location.origin + location.pathname;
    return `${API}/api/auth/oauth/${provider}/start?redirect_uri=${encodeURIComponent(target)}`;
  }

  function mount(host) {
    if (!host || host.dataset.oauthReady === '1') return;
    host.dataset.oauthReady = '1';
    ensureStyles();

    host.innerHTML = `
      <p class="oauth-divider"><span>veya şununla devam et</span></p>
      <div class="oauth-buttons">
        ${PROVIDERS.map(p => `
          <button class="oauth-btn oauth-${p.id}" type="button" data-provider="${p.id}" aria-label="${p.label} ile giriş yap">
            <i class="${p.icon}" aria-hidden="true"></i>
            <span>${p.label}</span>
          </button>`).join('')}
      </div>
      <p class="oauth-status" role="status" aria-live="polite"></p>`;

    const status = host.querySelector('.oauth-status');
    const buttons = [...host.querySelectorAll('.oauth-btn')];

    loadProviders().then(list => {
      if (!list) return;
      buttons.forEach(button => {
        if (!list.includes(button.dataset.provider)) {
          button.disabled = true;
          button.title = MESSAGES.notReady;
        }
      });
    });

    buttons.forEach(button => {
      button.addEventListener('click', async () => {
        const provider = button.dataset.provider;
        status.textContent = MESSAGES.starting;
        buttons.forEach(b => { b.disabled = true; });
        const list = await loadProviders();
        if (!list) {
          status.textContent = MESSAGES.unavailable;
          buttons.forEach(b => { b.disabled = b.title === MESSAGES.notReady; });
          return;
        }
        if (!list.includes(provider)) {
          status.textContent = MESSAGES.notReady;
          buttons.forEach(b => { b.disabled = b.title === MESSAGES.notReady; });
          return;
        }
        location.href = startUrl(provider);
      });
    });
  }

  function mountAll(root) {
    (root || document).querySelectorAll('[data-oauth-mount]').forEach(mount);
  }

  /* Worker geri dönüşü: ?oauth=success&code=... veya ?oauth=error&message=... */
  async function handleCallback() {
    const params = new URLSearchParams(location.search);
    const state = params.get('oauth');
    if (!state) return;

    const clean = () => {
      params.delete('oauth');
      params.delete('code');
      params.delete('token');
      params.delete('message');
      const query = params.toString();
      history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash);
    };

    if (state === 'error') {
      const message = params.get('message');
      clean();
      showNotice(message || MESSAGES.failed);
      return;
    }

    const code = params.get('code');
    const directToken = params.get('token');
    try {
      let token = directToken;
      if (!token && code) {
        const response = await fetch(`${API}/api/auth/oauth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.token) throw new Error(data.error || MESSAGES.failed);
        token = data.token;
      }
      if (!token) throw new Error(MESSAGES.failed);
      localStorage.setItem('token', token);
      clean();
      location.reload();
    } catch (error) {
      clean();
      showNotice(error.message || MESSAGES.failed);
    }
  }

  function showNotice(text) {
    const box = document.createElement('div');
    box.className = 'oauth-notice';
    box.setAttribute('role', 'alert');
    box.textContent = text;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 8000);
  }

  window.TurboluOAuth = { providers: PROVIDERS, mount, mountAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountAll());
  } else {
    mountAll();
  }
  handleCallback();
})();
