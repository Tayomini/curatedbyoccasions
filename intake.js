(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // SETUP: paste your Web3Forms access key below.
  // (Get one free at https://web3forms.com — enter your business
  // email there and they'll send the key to it. The key is designed
  // to be public; it can only deliver form submissions to that inbox.)
  // ──────────────────────────────────────────────────────────
  var ACCESS_KEY = '273bba70-8135-456a-951a-6a81ba739561';
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var TIMEOUT_MS = 15000;
  var TOTAL_STEPS = 5;

  var form = document.getElementById('intake-form');
  var tabs = document.querySelectorAll('.step-tab');
  var statusEl = document.getElementById('form-status');
  var errorEl = document.getElementById('form-error');
  var submitBtn = document.getElementById('submit-btn');
  var successEl = document.getElementById('success');
  var currentStep = 1;
  var sending = false;

  // ── helpers ──
  function $(id) { return document.getElementById(id); }

  function val(id) {
    var el = $(id);
    return el ? el.value.trim() : '';
  }

  function checkedValues(name) {
    return Array.prototype.slice
      .call(form.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (el) { return el.value; });
  }

  // ── step navigation ──
  function goToStep(n) {
    $('step-' + currentStep).classList.remove('active');
    tabs[currentStep - 1].classList.remove('active');
    tabs[currentStep - 1].removeAttribute('aria-current');
    currentStep = n;
    var section = $('step-' + currentStep);
    section.classList.add('active');
    tabs[currentStep - 1].classList.add('active');
    tabs[currentStep - 1].setAttribute('aria-current', 'step');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var heading = section.querySelector('.section-title-text');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }

  function validateStep1() {
    var email = $('email');
    var valid = !!(val('fname') && val('lname') && val('email') && email.checkValidity());
    $('step1-error').classList.toggle('visible', !valid);
    return valid;
  }

  function validateStep4() {
    var ok = checkedValues('services').length > 0;
    $('service-error').classList.toggle('visible', !ok);
    return ok;
  }

  function nextStep(from) {
    if (from === 1 && !validateStep1()) { return; }
    if (from === 4 && !validateStep4()) { return; }
    if (from < TOTAL_STEPS) {
      tabs[from - 1].classList.add('completed');
      goToStep(from + 1);
    }
  }

  function prevStep(from) {
    if (from > 1) { goToStep(from - 1); }
  }

  // Delegated click handling (no inline onclick attributes)
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-next],[data-back],[data-step]') : null;
    if (!el) { return; }
    if (el.hasAttribute('data-next')) { nextStep(parseInt(el.getAttribute('data-next'), 10)); }
    else if (el.hasAttribute('data-back')) { prevStep(parseInt(el.getAttribute('data-back'), 10)); }
    else if (el.hasAttribute('data-step')) { goToStep(parseInt(el.getAttribute('data-step'), 10)); }
  });

  // ── status messages ──
  function showStatus(msg) {
    statusEl.textContent = msg;
    statusEl.hidden = !msg;
  }

  function showError(show) {
    errorEl.hidden = !show;
  }

  // ── build the payload ──
  function buildPayload() {
    var none = 'Not provided';
    var vibes = checkedValues('vibe');
    var services = checkedValues('services');
    return {
      access_key: ACCESS_KEY,
      subject: 'New Event Inquiry — ' + val('fname') + ' ' + val('lname'),
      from_name: 'Curated by Occasions Website',
      botcheck: form.elements.botcheck ? form.elements.botcheck.checked : false,

      'Name': val('fname') + ' ' + val('lname'),
      'email': val('email'),
      'Phone': val('phone') || none,
      'How they heard about us': val('referral') || none,

      'Event type': checkedValues('event-type')[0] || none,
      'Who it is for': val('honoree') || none,
      'Milestone': val('milestone') || none,
      'Preferred date': val('event-date') || none,
      'Backup date': val('backup-date') || none,
      'Guest count': val('guest-count') || none,
      'Location': val('location') || none,
      'Venue in mind': checkedValues('venue')[0] || none,

      'Vibe': vibes.length ? vibes.join(', ') : none,
      'Colour palette': val('palette') || none,
      'Dream event': val('inspiration') || none,
      'Inspiration links': val('inspo-links') || none,
      'Must-haves': val('must-haves') || none,
      'Things to avoid': val('avoid') || none,

      'Services': services.length ? services.join(', ') : none,
      'Budget': checkedValues('budget')[0] || none,

      'About the guest of honour': val('honoree-details') || none,
      'Surprise?': checkedValues('surprise')[0] || none,
      'Timeline to begin planning': val('timeline') || none,
      'Questions': val('questions') || none
    };
  }

  // ── submit ──
  function setSending(on) {
    sending = on;
    submitBtn.disabled = on;
    submitBtn.firstChild.nodeValue = on ? 'Sending…' : 'Send Inquiry';
  }

  function showSuccess() {
    $('step-' + currentStep).classList.remove('active');
    tabs[currentStep - 1].classList.remove('active');
    tabs[TOTAL_STEPS - 1].classList.add('completed');
    successEl.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var heading = successEl.querySelector('.success-title');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }

  function send() {
    if (sending) { return; }
    if (!validateStep1()) { goToStep(1); return; }
    if (!validateStep4()) { goToStep(4); return; }

    showStatus('');
    showError(false);

    if (!ACCESS_KEY || ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      console.error('intake.js: add your Web3Forms access key before publishing.');
      showError(true);
      return;
    }

    setSending(true);

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(buildPayload()),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (r) {
        if (r.ok && r.data && r.data.success) {
          showSuccess();
        } else {
          showError(true);
        }
      })
      .catch(function () {
        showError(true);
      })
      .then(function () {
        if (timer) { clearTimeout(timer); }
        setSending(false);
      });
  }

  // Enter key moves forward through steps; only the last step submits
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (currentStep < TOTAL_STEPS) { nextStep(currentStep); return; }
    send();
  });

  // Don't allow picking past dates
  (function setMinDates() {
    var d = new Date();
    var iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    ['event-date', 'backup-date'].forEach(function (id) { var el = $(id); if (el) { el.min = iso; } });
  })();

  tabs[0].setAttribute('aria-current', 'step');
})();
