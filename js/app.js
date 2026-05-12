(() => {

  // ─────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────

  const toastContainer = document.getElementById("sc-toast-container");

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `sc-toast ${type === "error" ? "sc-toast-error" : ""}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add("fade"), 2500);
    setTimeout(() => toast.remove(), 3000);
  }

  function sanitize(val) {
    return window.SEC?.stripDangerousChars
      ? window.SEC.stripDangerousChars(val, 150)
      : val;
  }

  // ─────────────────────────────────────────────
  // AVAILABILITY TABLE
  // ─────────────────────────────────────────────

  const DAYS = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" }
  ];

  const table = document.getElementById("sc-table");

  function buildTimeOptions(select) {
    for (let h = 6; h <= 22; h++) {
      const hour = h.toString().padStart(2, "0");
      ["00", "30"].forEach(min => {
        const val = `${hour}:${min}`;
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
      });
    }
  }

  function buildAvailabilityTable() {
    table.innerHTML = `
      <tr>
        <th>Day</th>
        <th>Start</th>
        <th>End</th>
        <th>Status</th>
      </tr>
    `;

    DAYS.forEach(day => {
      const row = document.createElement("tr");

      const dayCell = document.createElement("td");
      dayCell.textContent = day.label;

      const startCell = document.createElement("td");
      const startSelect = document.createElement("select");
      startSelect.id = `sc-start-${day.key}`;
      buildTimeOptions(startSelect);
      startCell.appendChild(startSelect);

      const endCell = document.createElement("td");
      const endSelect = document.createElement("select");
      endSelect.id = `sc-end-${day.key}`;
      buildTimeOptions(endSelect);
      endCell.appendChild(endSelect);

      const statusCell = document.createElement("td");
      const statusSelect = document.createElement("select");
      statusSelect.id = `sc-status-${day.key}`;

      ["Available", "Not Available", "Prefer Not"].forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        statusSelect.appendChild(opt);
      });

      statusCell.appendChild(statusSelect);

      row.appendChild(dayCell);
      row.appendChild(startCell);
      row.appendChild(endCell);
      row.appendChild(statusCell);

      table.appendChild(row);
    });
  }

  buildAvailabilityTable();

  // ─────────────────────────────────────────────
  // PAYLOAD BUILDER
  // ─────────────────────────────────────────────

  function buildPayload() {
    const name = sanitize(document.getElementById("sc-name").value);
    const phone = sanitize(document.getElementById("sc-phone").value);
    const email = sanitize(document.getElementById("sc-email").value);
    const notes = sanitize(document.getElementById("sc-notes").value);

    const availability = {};

    DAYS.forEach(day => {
      availability[day.key] = {
        start: document.getElementById(`sc-start-${day.key}`).value,
        end: document.getElementById(`sc-end-${day.key}`).value,
        status: document.getElementById(`sc-status-${day.key}`).value
      };
    });

    return { name, phone, email, notes, availability };
  }

  // ─────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────

  function validateForm() {
    const name = document.getElementById("sc-name").value.trim();
    const email = document.getElementById("sc-email").value.trim();

    if (!name) {
      showToast("Please enter your name", "error");
      return false;
    }

    if (!email.includes("@")) {
      showToast("Please enter a valid email", "error");
      return false;
    }

    return true;
  }

  // ─────────────────────────────────────────────
  // SUBMIT BUTTON
  // ─────────────────────────────────────────────

  document.getElementById("sc-submit").addEventListener("click", () => {
    if (!validateForm()) return;

    const payload = buildPayload();
    const json = JSON.stringify(payload, null, 2);

    // Download JSON
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const filename = `availability-${payload.name}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    // Email fallback
    const mailto = `mailto:${payload.email}?subject=Weekly Availability&body=${encodeURIComponent(json)}`;
    window.location.href = mailto;

    document.getElementById("sc-success").classList.remove("hidden");
  });

  // ─────────────────────────────────────────────
  // SHARE JSON BUTTON (iOS + Android)
  // ─────────────────────────────────────────────

  document.getElementById("sc-share").addEventListener("click", async () => {
    if (!navigator.canShare) {
      showToast("Sharing not supported on this device", "error");
      return;
    }

    const payload = buildPayload();
    const json = JSON.stringify(payload, null, 2);

    const file = new File(
      [json],
      `availability-${payload.name}.json`,
      { type: "application/json" }
    );

    try {
      await navigator.share({
        title: "Availability JSON",
        text: "Here is my weekly availability.",
        files: [file]
      });

      showToast("Shared successfully!");
    } catch {
      showToast("Share cancelled", "error");
    }
  });

})();
