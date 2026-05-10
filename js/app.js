/**
 * APP.JS — CHILDCARE AVAILABILITY FORM
 * Secure, offline-first PWA logic
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // SANITISATION MODULE (replaces sanitisation.js)
  // ─────────────────────────────────────────────────────────────
  const SEC = {
    isValidEmail: (email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

    stripDangerousChars: (val, max) =>
      String(val || '')
        .replace(/[<>]/g, '')
        .substring(0, max)
  };

  // ─────────────────────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────────────────────
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
      validate: SEC.isValidEmail,
      sanitize: (val) => SEC.stripDangerousChars(val, 150)
    },
    name: {
      type: 'string',
      required: true,
      maxLen: 150,
      sanitize: (val) => SEC.stripDangerousChars(val, 150)
    },
    phone: {
      type: 'string',
      required: true,
      maxLen: 20,
      sanitize: (val) => SEC.stripDangerousChars(val, 20)
    },
    notes: {
      type: 'string',
      required: false,
      maxLen: 500,
      sanitize: (val) => SEC.stripDangerousChars(val, 500)
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DOM ELEMENTS
  // ─────────────────────────────────────────────────────────────
  const form = document.getElementById('sc-form');
  const tableBody = document.getElementById('sc-table-body');
  const submitBtn = document.getElementById('sc-submit');
  const successScreen = document.getElementById('sc-success');
  const toastContainer = document.getElementById('sc-toasts');

  // ─────────────────────────────────────────────────────────────
  // TOASTS
  // ─────────────────────────────────────────────────────────────
  function showToast(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `sc-toast sc-toast-${type}`;
    div.textContent = msg;

    toastContainer.appendChild(div);

    setTimeout(() => {
      div.classList.add('fade');
      setTimeout(() => div.remove(), 300);
    }, 2500);
  }

  // ─────────────────────────────────────────────────────────────
  // BUILD AVAILABILITY TABLE
  // ─────────────────────────────────────────────────────────────
  function buildAvailabilityTable() {
    tableBody.innerHTML = '';

    DAYS.forEach((day) => {
      const row = document.createElement('tr');

      const dayCell = document.createElement('td');
      dayCell.textContent = day.label;

      const startCell = document.createElement('td');
      const startSelect = document.createElement('select');
      startSelect.id = `sc-start-${day.key}`;
      buildTimeOptions(startSelect);
      startCell.appendChild(startSelect);

      const endCell = document.createElement('td');
      const endSelect = document.createElement('select');
      endSelect.id = `sc-end-${day.key}`;
      buildTimeOptions(endSelect);
      endCell.appendChild(endSelect);

      const statusCell = document.createElement('td');
      const statusSelect = document.createElement('select');
      statusSelect.id = `sc-status-${day.key}`;
      ['Available', 'Not Available'].forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        statusSelect.appendChild(o);
      });
      statusCell.appendChild(statusSelect);

      row.appendChild(dayCell);
      row.appendChild(startCell);
      row.appendChild(endCell);
      row.appendChild(statusCell);

      tableBody.appendChild(row);
    });
  }

  function buildTimeOptions(select) {
    const times = [
      '06:00', '06:30', '07:00', '07:30',
      '08:00', '08:30', '09:00', '09:30',
      '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30',
      '18:00'
    ];

    times.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      select.appendChild(opt);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // FORM VALIDATION
  // ─────────────────────────────────────────────────────────────
  function validateForm() {
    let valid = true;

    Object.keys(FORM_SCHEMA).forEach((key) => {
      const field = document.getElementById(`sc-${key}`);
      const schema = FORM_SCHEMA[key];
      const raw = field.value || '';

      const clean = schema.s