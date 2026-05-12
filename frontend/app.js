function getApiBaseUrl() {
  const { protocol, hostname, port, origin } = window.location;
  const isLocalStaticPreview = ['127.0.0.1', 'localhost'].includes(hostname) && port && port !== '8000';

  if (protocol === 'file:' || isLocalStaticPreview) {
    return 'http://127.0.0.1:8000/api';
  }

  return `${origin}/api`;
}

const API_BASE_URL = getApiBaseUrl();

const pageName = window.location.pathname.split('/').pop() || 'index.html';

function markCurrentPage() {
  if (document.body) document.body.dataset.page = pageName;
}

function pageUrl(page) {
  const { protocol, hostname, port } = window.location;
  const isLocalStaticPreview = ['127.0.0.1', 'localhost'].includes(hostname) && port && port !== '8000';

  return protocol === 'file:' || isLocalStaticPreview ? page : `/${page}`;
}

function injectDesktopNavigation() {
  if (['index.html', 'register.html'].includes(pageName) || $('.desktop-nav')) return;

  const header = $('body > header');
  const headerRow = header?.querySelector('.flex.justify-between') || header;
  if (!headerRow) return;

  const items = [
    { page: 'dashboard.html', label: 'Home', icon: 'home' },
    { page: 'analytics.html', label: 'Reports', icon: 'description' },
    { page: 'map.html', label: 'Map', icon: 'map' },
    { page: 'profile.html', label: 'Profile', icon: 'person' },
  ];

  if (pageName === 'admin.html') {
    items[0] = { page: 'admin.html', label: 'Tasks', icon: 'task_alt' };
  }

  const nav = document.createElement('nav');
  nav.className = 'desktop-nav';
  nav.setAttribute('aria-label', 'Primary navigation');
  nav.innerHTML = items.map((item) => `
    <a href="${pageUrl(item.page)}" ${pageName === item.page ? 'aria-current="page"' : ''}>
      <span class="material-symbols-outlined">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  const lastAction = headerRow.lastElementChild;
  headerRow.insertBefore(nav, lastAction || null);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    const message = data ? JSON.stringify(data) : response.statusText;
    throw new Error(message);
  }

  return data;
}

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function setText(el, value) {
  if (el) el.textContent = value;
}

function formatReportTitle(report) {
  return report.description?.split('.')[0]?.slice(0, 48) || report.report_id;
}

function priorityBadge(priority) {
  const high = String(priority).toLowerCase() === 'high';
  return high
    ? 'bg-error-container text-on-error-container'
    : 'bg-secondary-container text-on-secondary-container';
}

function setStatus(selector, message, isError = false) {
  const element = $(selector);
  if (!element) return;
  element.textContent = message;
  element.className = `mt-3 text-sm font-semibold ${isError ? 'text-error' : 'text-primary'}`;
}

function wirePhotoInput(inputSelector, previewSelector, emptySelector) {
  const input = $(inputSelector);
  const preview = $(previewSelector);
  const emptyState = $(emptySelector);
  if (!input || !preview || !emptyState) return;

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    preview.src = URL.createObjectURL(file);
    preview.classList.remove('hidden');
    emptyState.classList.add('hidden');
    setStatus('#photoStatus', `${file.name} selected.`);
  });
}

async function loadReports() {
  return api('/reports');
}

async function loadDashboardStats() {
  return api('/dashboard');
}

async function getDefaults() {
  const [citizens, admins] = await Promise.all([api('/citizens'), api('/admins')]);
  const currentCitizenId = localStorage.getItem('currentCitizenId');
  const currentCitizenEmail = localStorage.getItem('currentCitizenEmail');
  const currentAdminId = localStorage.getItem('currentAdminId');
  const currentAdminEmail = localStorage.getItem('currentAdminEmail');
  const currentCitizen = citizens.find((citizen) => citizen.citizen_id === currentCitizenId)
    || citizens.find((citizen) => String(citizen.email).toLowerCase() === currentCitizenEmail)
    || citizens[0];
  const currentAdmin = admins.find((admin) => admin.admin_id === currentAdminId)
    || admins.find((admin) => String(admin.email).toLowerCase() === currentAdminEmail)
    || admins[0];

  return {
    citizen: currentCitizen?.citizen_id || 'C001',
    admin: currentAdmin?.admin_id || 'A001',
    citizenName: currentCitizen?.full_name || 'Citizen',
    citizenEmail: currentCitizen?.email || '',
    citizenPhone: currentCitizen?.phone_number || '',
    citizenAddress: currentCitizen?.address || '',
    citizenArea: currentCitizen?.area || '',
    adminName: currentAdmin?.admin_name || 'Municipal Staff',
    adminEmail: currentAdmin?.email || '',
    adminRole: currentAdmin?.role || '',
  };
}

function wireNavigation() {
  const navigate = (el, page) => {
    const target = el.closest('a, button, div');
    if (!target) return;

    if (target.tagName.toLowerCase() === 'a') {
      target.setAttribute('href', pageUrl(page));
      return;
    }

    target.addEventListener('click', () => { window.location.href = pageUrl(page); });
  };

  $all('a, button, span').forEach((el) => {
    const text = el.textContent.trim().toLowerCase();
    if (text === 'tasks') navigate(el, 'admin.html');
    if (text === 'home') navigate(el, 'dashboard.html');
    if (text === 'reports' || text === 'view all') navigate(el, 'analytics.html');
    if (text === 'map' || text === 'view map' || text === 'expand map') navigate(el, 'map.html');
    if (text === 'profile') navigate(el, 'profile.html');
    if (text === 'report new issue') navigate(el, 'report.html');
    if (text === 'logout') {
      el.closest('a, button')?.addEventListener('click', () => {
        localStorage.removeItem('currentCitizenId');
        localStorage.removeItem('currentCitizenEmail');
        localStorage.removeItem('currentAdminId');
        localStorage.removeItem('currentAdminEmail');
      });
    }
  });
}

function appendReportNote(report, note) {
  const description = report.description || '';
  return description.includes(note) ? description : `${description} ${note}`.trim();
}

function reportLocation(report) {
  const match = String(report.description || '').match(/Location:\s*([^.]*)/i);
  return match?.[1]?.trim() || formatReportTitle(report);
}

async function initLoginPage() {
  const roleButtons = $all('section').length ? $all('button').slice(0, 2) : [];
  let role = 'citizen';

  roleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      role = button.textContent.toLowerCase().includes('staff') ? 'staff' : 'citizen';
      roleButtons.forEach((b) => b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm'));
      button.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
    });
  });

  const signIn = $all('button').find((button) => button.textContent.includes('Sign In'));
  signIn?.addEventListener('click', async () => {
    const email = $('input[type="email"]')?.value.trim().toLowerCase();
    const endpoint = role === 'staff' ? '/admins' : '/citizens';

    try {
      const users = await api(endpoint);
      const matchedUser = users.find((user) => String(user.email).toLowerCase() === email);
      const exists = !email || matchedUser;
      if (!exists) {
        alert('No matching account found in the backend sample data.');
        return;
      }
      if (role === 'citizen' && matchedUser) {
        localStorage.setItem('currentCitizenId', matchedUser.citizen_id);
        localStorage.setItem('currentCitizenEmail', String(matchedUser.email).toLowerCase());
      }
      if (role === 'staff' && matchedUser) {
        localStorage.setItem('currentAdminId', matchedUser.admin_id);
        localStorage.setItem('currentAdminEmail', String(matchedUser.email).toLowerCase());
      }
      window.location.href = role === 'staff' ? pageUrl('admin.html') : pageUrl('dashboard.html');
    } catch (error) {
      alert(`Unable to sign in: ${error.message}`);
    }
  });
}

function setRegisterMessage(message, isError = false) {
  const messageBox = $('#registerMessage');
  if (!messageBox) return;
  messageBox.textContent = message;
  messageBox.className = `text-sm font-semibold ${isError ? 'text-error' : 'text-primary'}`;
}

async function initRegisterPage() {
  const form = $('#registerForm');
  if (!form) return;
  let accountType = 'citizen';
  const citizenButton = $('#citizenAccountButton');
  const staffButton = $('#staffAccountButton');
  const citizenOnlyFields = [$('#areaField'), $('#addressField')];
  const staffOnlyFields = [$('#staffRoleField'), $('#staffUsernameField')];
  const citizenRequiredFields = [$('#area'), $('#address')];
  const staffRequiredFields = [$('#staffRole'), $('#staffUsername')];

  const setAccountType = (type) => {
    accountType = type;
    const isStaff = accountType === 'staff';

    $('#registerTitle').textContent = isStaff ? 'Create Municipal Staff Account' : 'Create Citizen Account';
    $('#registerSubtitle').textContent = isStaff
      ? 'Create staff access for managing municipal waste reports.'
      : 'Join Urban Waste Intel to report and track local waste issues.';

    citizenButton.classList.toggle('bg-primary', !isStaff);
    citizenButton.classList.toggle('text-on-primary', !isStaff);
    citizenButton.classList.toggle('shadow-sm', !isStaff);
    citizenButton.classList.toggle('text-on-surface-variant', isStaff);
    staffButton.classList.toggle('bg-primary', isStaff);
    staffButton.classList.toggle('text-on-primary', isStaff);
    staffButton.classList.toggle('shadow-sm', isStaff);
    staffButton.classList.toggle('text-on-surface-variant', !isStaff);

    citizenOnlyFields.forEach((field) => field?.classList.toggle('hidden', isStaff));
    staffOnlyFields.forEach((field) => field?.classList.toggle('hidden', !isStaff));
    citizenRequiredFields.forEach((field) => {
      if (field) field.required = !isStaff;
    });
    staffRequiredFields.forEach((field) => {
      if (field) field.required = isStaff;
    });
  };

  citizenButton?.addEventListener('click', () => setAccountType('citizen'));
  staffButton?.addEventListener('click', () => setAccountType('staff'));
  setAccountType('citizen');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = $('#registerSubmit');
    const password = $('#password')?.value || '';
    const confirmPassword = $('#confirmPassword')?.value || '';

    if (password !== confirmPassword) {
      setRegisterMessage('Passwords do not match.', true);
      return;
    }

    const citizenPayload = {
      citizen_id: `C${Date.now().toString().slice(-9)}`,
      full_name: $('#fullName')?.value.trim(),
      email: $('#email')?.value.trim().toLowerCase(),
      phone_number: $('#phoneNumber')?.value.trim(),
      address: $('#address')?.value.trim(),
      area: $('#area')?.value.trim(),
      registration_date: new Date().toISOString().slice(0, 10),
    };
    const staffPayload = {
      admin_id: `A${Date.now().toString().slice(-9)}`,
      admin_name: $('#fullName')?.value.trim(),
      email: $('#email')?.value.trim().toLowerCase(),
      phone_number: $('#phoneNumber')?.value.trim(),
      role: $('#staffRole')?.value.trim(),
      login_username: $('#staffUsername')?.value.trim(),
    };

    submit.disabled = true;
    submit.textContent = 'Creating Account...';

    try {
      if (accountType === 'staff') {
        const createdStaff = await api('/admins/create', { method: 'POST', body: JSON.stringify(staffPayload) });
        localStorage.setItem('currentAdminId', createdStaff.admin_id);
        localStorage.setItem('currentAdminEmail', String(createdStaff.email).toLowerCase());
        setRegisterMessage('Staff account created successfully. Redirecting to municipal dashboard...');
        setTimeout(() => { window.location.href = pageUrl('admin.html'); }, 800);
        return;
      }

      const createdCitizen = await api('/citizens/create', { method: 'POST', body: JSON.stringify(citizenPayload) });
      localStorage.setItem('currentCitizenId', createdCitizen.citizen_id);
      localStorage.setItem('currentCitizenEmail', String(createdCitizen.email).toLowerCase());
      setRegisterMessage('Citizen account created successfully. Redirecting to your dashboard...');
      setTimeout(() => { window.location.href = pageUrl('dashboard.html'); }, 800);
    } catch (error) {
      if (error.message.toLowerCase().includes('email')) {
        if (accountType === 'staff') {
          localStorage.setItem('currentAdminEmail', staffPayload.email);
          setRegisterMessage('Staff account already exists. Redirecting to municipal dashboard...');
          setTimeout(() => { window.location.href = pageUrl('admin.html'); }, 800);
          return;
        }

        localStorage.setItem('currentCitizenEmail', citizenPayload.email);
        setRegisterMessage('Citizen account already exists. Redirecting to your dashboard...');
        setTimeout(() => { window.location.href = pageUrl('dashboard.html'); }, 800);
        return;
      }

      setRegisterMessage(`Unable to create account: ${error.message}`, true);
      submit.disabled = false;
      submit.textContent = 'Create Account';
    }
  });
}

async function initCitizenDashboard() {
  wireNavigation();
  const [stats, reports, defaults] = await Promise.all([loadDashboardStats(), loadReports(), getDefaults()]);
  const statNumbers = $all('section:first-of-type .text-2xl');
  setText(statNumbers[0], stats.pending ?? 0);
  setText(statNumbers[1], stats.resolved ?? 0);
  setText($('h1'), `Hello, ${defaults.citizenName.split(' ')[0]}!`);

  const feed = $('.space-y-4');
  if (!feed) return;

  feed.innerHTML = reports.slice(0, 4).map((report) => `
    <div class="bg-surface-container-lowest rounded-xl p-4 flex gap-4 items-start">
      <div class="${report.status === 'Resolved' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'} p-2 rounded-lg">
        <span class="material-symbols-outlined text-lg">${report.status === 'Resolved' ? 'task_alt' : 'report'}</span>
      </div>
      <div class="flex-1">
        <p class="text-sm font-bold text-on-surface mb-1">${formatReportTitle(report)}</p>
        <p class="text-xs text-on-surface-variant">${report.status} • ${report.authority_name || report.authority} • ${report.priority}</p>
      </div>
    </div>
  `).join('');
}

async function initReportPage() {
  wireNavigation();
  const main = $('main');
  if (!main) return;

  const defaults = await getDefaults();
  const visibleCategory = $('#issueCategory');

  if (visibleCategory) {
    wirePhotoInput('#cameraPhoto', '#cameraPreview', '#cameraEmpty');
    wirePhotoInput('#galleryPhoto', '#galleryPreview', '#galleryEmpty');

    $('#useCurrentLocation')?.addEventListener('click', () => {
      const locationInput = $('#issueLocation');

      if (!navigator.geolocation) {
        setStatus('#locationStatus', 'Current location is not supported in this browser.', true);
        return;
      }

      setStatus('#locationStatus', 'Finding your current location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          if (locationInput) locationInput.value = value;
          setStatus('#locationStatus', `Location captured: ${value}`);
        },
        () => {
          setStatus('#locationStatus', 'Unable to access location. Please type the address manually.', true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });

    const nextButton = $all('button').find((button) => button.textContent.trim().toLowerCase() === 'next step');
    const backButton = $all('button').find((button) => button.textContent.trim().toLowerCase() === 'back');

    backButton?.addEventListener('click', () => {
      window.location.href = pageUrl('dashboard.html');
    });

    nextButton?.addEventListener('click', async () => {
      const location = $('#issueLocation')?.value.trim();
      const category = visibleCategory.value;
      const details = $('#issueDescription')?.value.trim();
      const photoFiles = [
        $('#cameraPhoto')?.files?.[0]?.name,
        $('#galleryPhoto')?.files?.[0]?.name,
      ].filter(Boolean);

      if (!location) {
        alert('Please enter a location or use current location.');
        $('#issueLocation')?.focus();
        return;
      }

      if (!category) {
        alert('Please select an issue category.');
        visibleCategory.focus();
        return;
      }

      if (!details) {
        alert('Please describe the issue.');
        $('#issueDescription')?.focus();
        return;
      }

      const reportId = `R${Date.now().toString().slice(-7)}`;
      const priority = category === 'Illegal Dumping' || category === 'Public Bin Damaged' ? 'High' : 'Medium';
      const photoNote = photoFiles.length ? ` Photos: ${photoFiles.join(', ')}.` : '';
      const payload = {
        report_id: reportId,
        citizen: defaults.citizen,
        authority: defaults.admin,
        description: `${category}: ${details} Location: ${location}.${photoNote}`,
        report_date: new Date().toISOString(),
        status: 'Open',
        priority,
        resolved_date: null,
      };

      nextButton.disabled = true;
      nextButton.textContent = 'Submitting...';

      try {
        await api('/reports/create', { method: 'POST', body: JSON.stringify(payload) });
        alert(`Report ${reportId} submitted successfully.`);
        window.location.href = pageUrl('dashboard.html');
      } catch (error) {
        alert(`Unable to submit report: ${error.message}`);
        nextButton.disabled = false;
        nextButton.textContent = 'Next Step';
      }
    });

    return;
  }

  const form = document.createElement('section');
  form.className = 'px-6 mb-12';
  form.innerHTML = `
    <form id="backendReportForm" class="bg-surface-container-lowest rounded-3xl p-5 space-y-4 border border-outline-variant/15">
      <h2 class="text-xl font-bold">Issue Details</h2>
      <input id="citizenName" class="w-full rounded-xl border-outline-variant" value="${defaults.citizenName}" disabled>
      <select id="priority" class="w-full rounded-xl border-outline-variant">
        <option>Low</option>
        <option selected>Medium</option>
        <option>High</option>
      </select>
      <textarea id="description" class="w-full rounded-xl border-outline-variant min-h-28" placeholder="Describe the waste issue, location, and any access notes." required></textarea>
      <button class="w-full h-14 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold shadow-lg shadow-primary/20" type="submit">
        Submit Report
      </button>
    </form>
  `;
  main.appendChild(form);

  $('#backendReportForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const reportId = `R${Date.now().toString().slice(-7)}`;
    const payload = {
      report_id: reportId,
      citizen: defaults.citizen,
      authority: defaults.admin,
      description: $('#description').value,
      report_date: new Date().toISOString(),
      status: 'Open',
      priority: $('#priority').value,
      resolved_date: null,
    };

    try {
      await api('/reports/create', { method: 'POST', body: JSON.stringify(payload) });
      alert(`Report ${reportId} submitted successfully.`);
      window.location.href = pageUrl('dashboard.html');
    } catch (error) {
      alert(`Unable to submit report: ${error.message}`);
    }
  });
}

async function initAdminPage() {
  wireNavigation();
  const [stats, reports] = await Promise.all([loadDashboardStats(), loadReports()]);
  const openReports = reports.filter((report) => report.status !== 'Resolved');
  const hero = $('section h1');
  setText(hero, `${Math.max(stats.resolved || 0, 0)}/${stats.total_reports || 0} Tasks`);

  const queueSection = $all('section').find((section) => section.textContent.includes('Work Queue'));
  if (!queueSection) return;

  queueSection.innerHTML = `
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-extrabold tracking-tight">Work Queue</h2>
      <a class="text-primary font-bold text-sm hover:underline" href="${pageUrl('analytics.html')}">View All</a>
    </div>
    ${openReports.slice(0, 5).map((report) => `
      <div class="bg-surface-container-lowest rounded-3xl p-5 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-outline-variant/15">
        <div class="flex justify-between items-start gap-4">
          <div class="space-y-1">
            <span class="${priorityBadge(report.priority)} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">${report.priority}</span>
            <h3 class="text-lg font-extrabold leading-tight">${formatReportTitle(report)}</h3>
            <p class="text-on-surface-variant text-sm font-medium">${report.citizen_name || report.citizen} • ${report.status}</p>
          </div>
          <div class="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-3xl">delete</span>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button data-status="In Progress" data-id="${report.report_id}" class="status-button flex-1 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-3 rounded-xl">Start Task</button>
          <button data-status="Resolved" data-id="${report.report_id}" class="status-button flex-1 bg-surface-container-high text-primary font-bold py-3 rounded-xl">Resolve</button>
        </div>
      </div>
    `).join('') || '<p class="text-on-surface-variant">No open reports right now.</p>'}
  `;

  $all('.status-button', queueSection).forEach((button) => {
    button.addEventListener('click', async () => {
      const report = reports.find((item) => item.report_id === button.dataset.id);
      const nextStatus = button.dataset.status;
      try {
        await api(`/reports/${button.dataset.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...report,
            status: nextStatus,
            resolved_date: nextStatus === 'Resolved' ? new Date().toISOString() : report.resolved_date,
          }),
        });
        await initAdminPage();
      } catch (error) {
        alert(`Unable to update report: ${error.message}`);
      }
    });
  });
}

async function initStaffAdminPage() {
  wireNavigation();
  const [stats, reports, defaults] = await Promise.all([loadDashboardStats(), loadReports(), getDefaults()]);
  const openReports = reports.filter((report) => report.status !== 'Resolved');
  const completed = Math.max(stats.resolved || 0, 0);
  const total = stats.total_reports || 0;

  setText($('section h1'), `${completed}/${total} Tasks`);
  const progress = $('section .bg-gradient-to-r.from-primary.to-primary-container');
  if (progress) progress.style.width = `${total ? Math.round((completed / total) * 100) : 0}%`;

  $('header button')?.addEventListener('click', () => {
    alert(`${openReports.length} open task${openReports.length === 1 ? '' : 's'} need attention.`);
  });

  const queueSection = $all('section').find((section) => section.textContent.includes('Work Queue'));
  if (!queueSection) return;

  queueSection.innerHTML = `
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-extrabold tracking-tight">Work Queue</h2>
      <a class="text-primary font-bold text-sm hover:underline" href="${pageUrl('analytics.html')}">View All</a>
    </div>
    ${openReports.slice(0, 8).map((report) => `
      <div class="bg-surface-container-lowest rounded-3xl p-5 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-outline-variant/15">
        <div class="flex justify-between items-start gap-4">
          <div class="space-y-1">
            <span class="${priorityBadge(report.priority)} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">${report.priority}</span>
            <h3 class="text-lg font-extrabold leading-tight">${formatReportTitle(report)}</h3>
            <p class="text-on-surface-variant text-sm font-medium">${report.citizen_name || report.citizen} - ${report.status} - ${reportLocation(report)}</p>
          </div>
          <div class="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-3xl">delete</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 pt-2">
          <button data-action="start" data-id="${report.report_id}" class="admin-action bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-3 rounded-xl">Start Task</button>
          <button data-action="resolve" data-id="${report.report_id}" class="admin-action bg-surface-container-high text-primary font-bold py-3 rounded-xl">Resolve</button>
          <button data-action="photo" data-id="${report.report_id}" class="admin-action bg-surface-container-low text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">add_a_photo</span>
            Add Photo
          </button>
          <button data-action="directions" data-id="${report.report_id}" class="admin-action bg-surface-container-low text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">directions</span>
            Directions
          </button>
        </div>
      </div>
    `).join('') || '<p class="text-on-surface-variant">No open reports right now.</p>'}
  `;

  const saveReport = async (report, changes) => {
    await api(`/reports/${report.report_id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...report, ...changes }),
    });
    await initStaffAdminPage();
  };

  $('#staffPhotoInput')?.remove();
  const photoInput = document.createElement('input');
  photoInput.id = 'staffPhotoInput';
  photoInput.type = 'file';
  photoInput.accept = 'image/*';
  photoInput.className = 'hidden';
  document.body.appendChild(photoInput);

  $all('.admin-action', queueSection).forEach((button) => {
    button.addEventListener('click', async () => {
      const report = reports.find((item) => item.report_id === button.dataset.id);
      if (!report) return;

      try {
        if (button.dataset.action === 'directions') {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reportLocation(report))}`, '_blank');
          return;
        }

        if (button.dataset.action === 'photo') {
          photoInput.onchange = async () => {
            const file = photoInput.files?.[0];
            if (!file) return;
            await saveReport(report, {
              authority: defaults.admin,
              description: appendReportNote(report, `Staff photo: ${file.name}.`),
            });
            alert('Photo evidence saved with this task.');
          };
          photoInput.click();
          return;
        }

        if (button.dataset.action === 'start') {
          await saveReport(report, {
            status: 'In Progress',
            authority: defaults.admin,
            description: appendReportNote(report, `Assigned to ${defaults.adminName}.`),
          });
          return;
        }

        if (button.dataset.action === 'resolve') {
          const note = prompt('Add a resolution note:', 'Resolved by municipal staff.');
          await saveReport(report, {
            status: 'Resolved',
            authority: defaults.admin,
            resolved_date: new Date().toISOString(),
            description: appendReportNote(report, `Resolution: ${note || 'Resolved by municipal staff.'}`),
          });
        }
      } catch (error) {
        alert(`Unable to save task update: ${error.message}`);
      }
    });
  });

  const toolSection = $all('section').find((section) => section.textContent.includes('Quick Resolve'));
  const firstOpenReport = openReports[0];
  if (toolSection && firstOpenReport) {
    const addPhotoTool = $all('button', toolSection).find((button) => button.textContent.includes('Add Photo'));
    const quickResolveTool = $all('button', toolSection).find((button) => button.textContent.includes('Quick Resolve'));

    addPhotoTool?.addEventListener('click', () => {
      queueSection.querySelector('[data-action="photo"]')?.click();
    });

    quickResolveTool?.addEventListener('click', async () => {
      try {
        await saveReport(firstOpenReport, {
          status: 'Resolved',
          authority: defaults.admin,
          resolved_date: new Date().toISOString(),
          description: appendReportNote(firstOpenReport, 'Resolution: Quick resolved by municipal staff.'),
        });
      } catch (error) {
        alert(`Unable to quick resolve: ${error.message}`);
      }
    });
  }
}

async function initAnalyticsPage() {
  wireNavigation();
  const [stats, reports] = await Promise.all([loadDashboardStats(), loadReports()]);
  const resolution = stats.total_reports ? Math.round((stats.resolved / stats.total_reports) * 100) : 0;
  const kpis = $all('.text-3xl.font-extrabold.text-primary');
  setText(kpis[0], `${resolution}%`);
  setText(kpis[1], `${stats.pending || 0}`);

  const categories = reports.reduce((acc, report) => {
    const key = report.description?.split(':')[0]?.slice(0, 24) || report.priority || 'Waste Issue';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const categorySection = $all('section').find((section) => section.textContent.includes('Reports by Category'));
  const list = categorySection?.querySelector('.space-y-4');
  if (list) {
    const max = Math.max(...Object.values(categories), 1);
    list.innerHTML = Object.entries(categories).slice(0, 4).map(([name, count]) => `
      <div class="bg-surface-container-lowest p-4 rounded-2xl">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-bold text-on-surface">${name}</span>
          <span class="text-sm font-bold text-primary">${count}</span>
        </div>
        <div class="h-2 bg-surface-container rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full" style="width: ${Math.round((count / max) * 100)}%;"></div>
        </div>
      </div>
    `).join('');
  }

  const hotspot = $all('section').find((section) => section.textContent.includes('Top Hotspot Zones'));
  const box = hotspot?.querySelector('.bg-surface-container-low');
  if (box) {
    box.innerHTML = reports.slice(0, 3).map((report, index) => `
      <div class="p-5 flex items-center gap-4 hover:bg-surface-container-high transition-colors">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold">${index + 1}</div>
        <div class="flex-1">
          <div class="font-bold text-on-surface">${report.report_id}</div>
          <div class="text-xs text-on-surface-variant font-medium">${report.status} • ${report.priority} priority</div>
        </div>
        <span class="material-symbols-outlined text-tertiary">${report.priority === 'High' ? 'warning' : 'arrow_forward_ios'}</span>
      </div>
    `).join('');
  }
}

async function initMapPage() {
  wireNavigation();
  const reports = await loadReports();
  const activeReports = reports.filter((report) => report.status !== 'Resolved');
  const list = $('#mapReportList');
  const count = $('#mapActiveCount');

  setText(count, activeReports.length);

  if (list) {
    list.innerHTML = activeReports.slice(0, 6).map((report) => `
      <div class="bg-surface-container-lowest rounded-2xl p-4 flex gap-3 items-start border border-outline-variant/20">
        <div class="${report.priority === 'High' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-primary-fixed text-on-primary-fixed-variant'} w-10 h-10 rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined">${report.priority === 'High' ? 'warning' : 'delete'}</span>
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-on-surface">${formatReportTitle(report)}</p>
          <p class="text-xs text-on-surface-variant mt-1">${report.status} - ${report.priority} priority - ${report.citizen_name || report.citizen}</p>
        </div>
      </div>
    `).join('') || '<p class="text-on-surface-variant">No active map reports right now.</p>';
  }
}

async function initProfilePage() {
  wireNavigation();
  const [defaults, stats] = await Promise.all([getDefaults(), loadDashboardStats()]);
  const isStaffProfile = Boolean(localStorage.getItem('currentAdminId') || localStorage.getItem('currentAdminEmail'));

  if (isStaffProfile) {
    setText($('#profileName'), defaults.adminName);
    setText($('#profileEmail'), defaults.adminEmail || 'No email available');
    setText($('#profilePhone'), defaults.adminRole || 'Municipal staff');
    setText($('#profileArea'), 'Municipal Staff');
    setText($('#profileAddress'), defaults.adminRole || 'No role available');
    setText($('#profileReports'), stats.in_progress ?? 0);
    setText($('#profileResolved'), stats.resolved ?? 0);
    return;
  }

  setText($('#profileName'), defaults.citizenName);
  setText($('#profileEmail'), defaults.citizenEmail || 'No email available');
  setText($('#profilePhone'), defaults.citizenPhone || 'No phone number available');
  setText($('#profileArea'), defaults.citizenArea || 'No area available');
  setText($('#profileAddress'), defaults.citizenAddress || 'No address available');
  setText($('#profileReports'), stats.total_reports ?? 0);
  setText($('#profileResolved'), stats.resolved ?? 0);
}

async function init() {
  try {
    markCurrentPage();
    injectDesktopNavigation();
    if (pageName === 'index.html') await initLoginPage();
    if (pageName === 'register.html') await initRegisterPage();
    if (pageName === 'dashboard.html') await initCitizenDashboard();
    if (pageName === 'report.html') await initReportPage();
    if (pageName === 'admin.html') await initStaffAdminPage();
    if (pageName === 'analytics.html') await initAnalyticsPage();
    if (pageName === 'map.html') await initMapPage();
    if (pageName === 'profile.html') await initProfilePage();
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', init);
