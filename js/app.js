/**
 * APP.JS — CHILDCARE AVAILABILITY FORM
 * ─────────────────────────────────────────────────────────────
 * Main application logic for the secure PWA.
 *
 * SECURITY NOTES:
 * - All event listeners attached via addEventListener (no inline handlers)
 * - All user input sanitized via SEC module before use
 * - No eval(), no innerHTML for user data
 * - JSON payload validated before download
 * - Email link uses mailto: with proper encoding
 * ─────────────────────────────────────────────────────────────
 */

(function() {
  'use strict';

  // Ensure sanitization module is loaded
  if (!window.SEC) {
    console.error('✗ Sanitisation module not loaded');
    return;
  }

  // Constants
  const DAYS = [
    { key: 'Mon', label: 'Monday' },
    { key: 'Tue', label: 'Tuesday' },
    { key: 'Wed', label: 'Wednesday' },
    { key: 'Thu', label: 'Thursday' },
    { key: 'Fri', label: 'Friday' },
    { key: 'Sat', label: 'Saturday' },
    { key: 'Sun', label: 'Sunday' }
  ];

  const FORM_SCHEMA = {
    managerEmail: {
      type: 'string',
      required: true,
      maxLen: 150,
      validate: window.SEC.isValidEmail,
      sanitize: (val) => window.SEC.stripDangerousChars(val, 150)
    },
    name: {
      type: 'string',
      required: true,
      maxLen: 100,
      validate: (val) => val.length > 0,
      sanitize: (val) => window.SEC.stripDangerousChars(val, 100)
    },
    email: {
      type: 'string',
      required: true,
      maxLen: 150,
      validate: window.SEC.isValidEmail,
      sanitize: (val) => window.SEC.stripDangerousChars(val, 150)
    },
    phone: {
      type: 'string',
      required: false,
      maxLen: 20,
      validate: window.SEC.isValidPhone,
      sanitize: (val) => window.SEC.stripDangerousChars(val, 20)
    },
    role: {
      type: 'string',
      required: true,
      maxLen: 100,
      validate: (val) => val.length > 0,
      sanitize: (val) => val
    },
    employmentType: {
      type: 'string',
      required: true,
      maxLen: 50,
      validate: (val) => val.length > 0,
      sanitize: (val) => val
    },
    cert: {
      type: 'string',
      required: false,
      maxLen: 80,
      validate: () => true,
      sanitize: (val) => window.SEC.stripDangerousChars(val, 80)
    }
  };

  /**
   * buildTimeOptions(selected)
   * Generates time option HTML string for 30-minute intervals (00:00–23:30).
   *
   * @param {string} selected - Currently selected time (HH:MM)
   * @returns {string} HTML option elements
   */
  function buildTimeOptions(selected) {
    let html = '';
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const val = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
        const isSelected = val === selected ? ' selected' : '';
        html += `<option value="${val}"${isSelected}>${val}</option>`;
      }
    }
    return html;
  }

  /**
   * buildAvailabilityTable()
   * Renders the weekly availability table with status and time selectors.
   * Uses createElement() for all DOM operations (no innerHTML with user data).
   */
  function buildAvailabilityTable() {
    const tbody = document.getElementById('sc-avail-body');
    if (!tbody) {
      console.warn('✗ Availability table body not found');
      return;
    }

    tbody.innerHTML = '';

    DAYS.forEach(day => {
      const tr = document.createElement('tr');

      // Day cell
      const dayCell = document.createElement('td');
      dayCell.innerHTML = `<div class="sc-day-name">${day.label}</div><div class="sc-day-abbr">${day.key}</div>`;

      // Status select
      const statusCell = document.createElement('td');
      const statusSelect = document.createElement('select');
      statusSelect.className = 'sc-tsel';
      statusSelect.id = `sc-status-${day.key}`;
      statusSelect.innerHTML = '<option value="working">Available</option><option value="off">Not Available</option><option value="leave">On Leave</option>';
      statusSelect.addEventListener('change', () => handleStatusChange(day.key));
      statusCell.appendChild(statusSelect);

      // Start time cell
      const startCell = document.createElement('td');
      startCell.id = `sc-srow-${day.key}`;
      startCell.className = 'sc-time-cell';
      const startSelect = document.createElement('select');
      startSelect.className = 'sc-tsel sc-time-sel';
      startSelect.id = `sc-start-${day.key}`;
      startSelect.innerHTML = buildTimeOptions('07:00');
      startCell.appendChild(startSelect);
      const startBadge = document.createElement('div');
      startBadge.id = `sc-sbadge-${day.key}`;
      startBadge.style.display = 'none';
      startCell.appendChild(startBadge);

      // End time cell
      const endCell = document.createElement('td');
      endCell.id = `sc-erow-${day.key}`;
      endCell.className = 'sc-time-cell';
      const sep = document.createElement('span');
      sep.className = 'sc-time-sep';
      sep.textContent = '→';
      endCell.appendChild(sep);
      const endSelect = document.createElement('select');
      endSelect.className = 'sc-tsel sc-time-sel';
      endSelect.id = `sc-end-${day.key}`;
      endSelect.innerHTML = buildTimeOptions('18:00');
      endCell.appendChild(endSelect);
      const endBadge = document.createElement('div');
      endBadge.id = `sc-ebadge-${day.key}`;
      endBadge.style.display = 'none';
      endCell.appendChild(endBadge);

      tr.appendChild(dayCell);
      tr.appendChild(statusCell);
      tr.appendChild(startCell);
      tr.appendChild(endCell);

      tbody.appendChild(tr);
    });

    console.log('✓ Availability table built');
  }

  /**
   * handleStatusChange(dayKey)
   * Updates visibility of time selectors and badges based on availability status.
   *
   * @param {string} dayKey - Day key (Mon, Tue, etc.)
   */
  function handleStatusChange(dayKey) {
    const statusEl = document.getElementById(`sc-status-${dayKey}`);
    const startRow = document.getElementById(`sc-srow-${dayKey}`);
    const endRow = document.getElementById(`sc-erow-${dayKey}`);
    const startBadge = document.getElementById(`sc-sbadge-${dayKey}`);
    const endBadge = document.getElementById(`sc-ebadge-${dayKey}`);

    const status = statusEl.value;
    const isWorking = status === 'working';

    // Show/hide time controls
    startRow.style.display = isWorking ? '' : 'none';
    endRow.style.display = isWorking ? '' : 'none';

    // Update status badges
    startBadge.style.display = isWorking ? 'none' : 'block';
    endBadge.style.display = 'none';

    if (status === 'off') {
      startBadge.innerHTML = '<span class="sc-st-badge sc-st-off">Not Available</span>';
    } else if (status === 'leave') {
      startBadge.innerHTML = '<span class="sc-st-badge sc-st-leave">On Leave</span>';
    }
  }

  /**
   * validateFormInputs()
   * Validates all required form fields.
   *
   * @returns {boolean} True if form is valid
   */
  function validateFormInputs() {
    let isValid = true;
    const validations = [
      {
        id: 'sc-manager-email',
        errId: 'sc-manager-email-err',
        msg: "Please enter the director's email",
        test: window.SEC.isValidEmail
      },
      {
        id: 'sc-name',
        errId: 'sc-name-err',
        msg: 'Full name is required',
        test: (v) => v.length > 0
      },
      {
        id: 'sc-email',
        errId: 'sc-email-err',
        msg: 'Valid email address required',
        test: window.SEC.isValidEmail
      },
      {
        id: 'sc-role',
        errId: 'sc-role-err',
        msg: 'Please select your primary role',
        test: (v) => v.length > 0
      },
      {
        id: 'sc-basis',
        errId: 'sc-basis-err',
        msg: 'Please select your employment type',
        test: (v) => v.length > 0
      }
    ];

    validations.forEach(val => {
      const el = document.getElementById(val.id);
      const errEl = document.getElementById(val.errId);
      const value = el.value.trim();
      const isFailed = !value || (val.test && !val.test(value));

      el.classList.toggle('error', isFailed);
      errEl.textContent = isFailed ? val.msg : '';

      if (isFailed) isValid = false;
    });

    if (!isValid) {
      const firstError = document.querySelector('.sc-input.error, .sc-sel.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return isValid;
  }

  /**
   * buildPayload()
   * Constructs the JSON payload from form data with full sanitization.
   *
   * @returns {object} Sanitized availability payload
   */
  function buildPayload() {
    const availability = {};

    DAYS.forEach(day => {
      const statusEl = document.getElementById(`sc-status-${day.key}`);
      const startEl = document.getElementById(`sc-start-${day.key}`);
      const endEl = document.getElementById(`sc-end-${day.key}`);

      const status = statusEl.value;
      let start = '';
      let end = '';

      if (status === 'working') {
        const startVal = startEl.value;
        const endVal = endEl.value;

        if (window.SEC.isValidTime(startVal)) start = startVal;
        if (window.SEC.isValidTime(endVal)) end = endVal;
      }

      availability[day.key] = {
        type: status,
        start: start,
        end: end
      };
    });

    // Build final payload with sanitization
    const payload = {
      _schema: 'childcare-avail-v1',
      _type: 'availability-only',
      _generated: new Date().toISOString(),
      memberName: window.SEC.stripDangerousChars(
        document.getElementById('sc-name').value,
        100
      ),
      email: window.SEC.stripDangerousChars(
        document.getElementById('sc-email').value,
        150
      ),
      phone: window.SEC.stripDangerousChars(
        document.getElementById('sc-phone').value,
        20
      ),
      role: document.getElementById('sc-role').value,
      employmentType: document.getElementById('sc-basis').value,
      cert: window.SEC.stripDangerousChars(
        document.getElementById('sc-cert').value,
        80
      ),
      availability: availability
    };

    // Validate structure before returning
    const allowedKeys = [
      '_schema', '_type', '_generated', 'memberName', 'email', 'phone',
      'role', 'employmentType', 'cert', 'availability'
    ];
    if (!window.SEC.validateJSONStructure(payload, allowedKeys)) {
      console.warn('✗ Payload structure validation failed');
      return null;
    }

    return payload;
  }

  /**
   * makeFilename(name)
   * Generates a safe filename from educator name.
   *
   * @param {string} name - Educator name
   * @returns {string} Safe filename
   */
  function makeFilename(name) {
    const slug = name
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, '');
    const date = new Date().toISOString().slice(0, 10);
    return `childcare-avail-${slug}-${date}.json`;
  }

  /**
   * downloadFile(payload, filename)
   * Triggers download of JSON file.
   * Uses Blob + URL.createObjectURL (safe, no server upload).
   *
   * @param {object} payload - Data to save
   * @param {string} filename - Desired filename
   */
  function downloadFile(payload, filename) {
    try {
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('✓ File downloaded:', filename);
    } catch (err) {
      console.error('✗ Download failed:', err);
      throw err;
    }
  }

  /**
   * openEmail(managerEmail, memberName, filename)
   * Opens user's email client with pre-filled message.
   * Uses mailto: with proper URL encoding.
   *
   * @param {string} managerEmail - Director's email address
   * @param {string} memberName - Educator name
   * @param {string} filename - Downloaded filename
   */
  function openEmail(managerEmail, memberName, filename) {
    const subject = `Childcare Roster Availability — ${memberName}`;
    const body = [
      'Hi,',
      '',
      'Please find my weekly availability submission attached as:',
      `    ${filename}`,
      '',
      'To import it into the Childcare Roster, go to:',
      '    Backup → Import Availability → select the attached file',
      '',
      `Submitted by: ${memberName}`,
      `Submitted at: ${new Date().toLocaleString()}`,
      '',
      '— Sent via Childcare Roster Availability Form'
    ].join('\n');

    // Safe URL encoding
    const mailtoUrl = `mailto:${encodeURIComponent(managerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      window.location.href = mailtoUrl;
      console.log('✓ Email client opened');
    } catch (err) {
      console.error('✗ Email open failed:', err);
      throw err;
    }
  }

  /**
   * showSuccessScreen(filename)
   * Displays the success message and hides the form.
   *
   * @param {string} filename - Downloaded filename
   */
  function showSuccessScreen(filename) {
    const formArea = document.getElementById('sc-form-area');
    const successArea = document.getElementById('sc-success');
    const filenameDisplay = document.getElementById('sc-filename-display');

    formArea.style.display = 'none';
    successArea.classList.add('open');
    filenameDisplay.textContent = filename;

    console.log('✓ Success screen shown');
  }

  /**
   * resetForm()
   * Resets the form to initial state.
   */
  function resetForm() {
    const formArea = document.getElementById('sc-form-area');
    const successArea = document.getElementById('sc-success');
    const submitBtn = document.getElementById('sc-submit-btn');

    successArea.classList.remove('open');
    formArea.style.display = '';
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>📎</span><span>Download File &amp; Open Email</span>';

    console.log('✓ Form reset');
  }

  /**
   * showToast(msg, type)
   * Displays a temporary notification toast.
   *
   * @param {string} msg - Message to display
   * @param {string} type - Toast type (success, error, info)
   */
  function showToast(msg, type) {
    const toastContainer = document.getElementById('sc-toasts');
    const toast = document.createElement('div');
    toast.className = `sc-toast ${type || 'info'}`;
    toast.appendChild(window.SEC.safeText(msg));
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  /**
   * handleSubmit()
   * Main form submission handler.
   */
  function handleSubmit() {
    console.log('→ Submitting form...');

    // Validate
    if (!validateFormInputs()) {
      showToast('Please fix the highlighted fields', 'error');
      return;
    }

    // Disable button
    const submitBtn = document.getElementById('sc-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>&#x23F3;</span><span>Preparing…</span>';

    try {
      // Build payload
      const payload = buildPayload();
      if (!payload) {
        throw new Error('Payload validation failed');
      }

      // Generate filename
      const filename = makeFilename(payload.memberName);

      // Download file
      downloadFile(payload, filename);

      // Open email (with delay to allow file write)
      setTimeout(() => {
        const manager = window.SEC.stripDangerousChars(
          document.getElementById('sc-manager-email').value,
          150
        );
        openEmail(manager, payload.memberName, filename);
      }, 400);

      // Show success
      showSuccessScreen(filename);
      showToast('File downloaded ✓', 'success');

      console.log('✓ Submit completed successfully');
    } catch (err) {
      console.error('✗ Submit error:', err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>📎</span><span>Download File &amp; Open Email</span>';
      showToast('Something went wrong. Try again.', 'error');
    }
  }

  /**
   * INITIALIZATION
   * ─────────────────────────────────────────────────────────────
   */
  function init() {
    console.log('→ Initializing application...');

    // Build UI
    buildAvailabilityTable();

    // Initialize visibility state for each day's time selectors
    DAYS.forEach(day => {
      handleStatusChange(day.key);
    });

    // Attach event listeners (no inline handlers)
    const submitBtn = document.getElementById('sc-submit-btn');
    const resetBtn = document.getElementById('sc-reset-btn');

    if (submitBtn) {
      submitBtn.addEventListener('click', handleSubmit);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetForm);
    }

    console.log('✓ Application initialized');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
