let events = [];
let editingId = null;

const loginPanel = document.getElementById("login-panel");
const adminPanel = document.getElementById("admin-panel");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const eventForm = document.getElementById("event-form");
const eventId = document.getElementById("event-id");
const eventTitle = document.getElementById("event-title");
const eventDate = document.getElementById("event-date");
const eventDescription = document.getElementById("event-description");
const eventImages = document.getElementById("event-images");
const imagePreview = document.getElementById("image-preview");
const eventMessage = document.getElementById("event-message");
const formTitle = document.getElementById("form-title");
const saveEventBtn = document.getElementById("save-event-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const logoutBtn = document.getElementById("logout-btn");
const adminEventsList = document.getElementById("admin-events-list");

document.addEventListener("DOMContentLoaded", checkStatus);

async function checkStatus() {
  const response = await fetch("/api/admin/status");
  const data = await response.json();
  if (data.authenticated) showAdmin();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const password = document.getElementById("admin-password").value;

  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  const data = await response.json();

  if (!response.ok) {
    loginError.textContent = data.error || "Login failed.";
    return;
  }

  document.getElementById("admin-password").value = "";
  showAdmin();
});

async function showAdmin() {
  loginPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  await loadEvents();
}

async function loadEvents() {
  const response = await fetch("/api/events");
  events = await response.json();
  renderAdminEvents();
}

function renderAdminEvents() {
  if (!events.length) {
    adminEventsList.innerHTML = `
      <div class="empty-state">
        <i class="far fa-calendar"></i>
        <h3>No past events</h3>
        <p>Use the form above to add your first event.</p>
      </div>`;
    return;
  }

  adminEventsList.innerHTML = events.map(event => `
    <article class="admin-event-card">
      <div class="admin-event-header">
        <div>
          <time>${formatDate(event.date)}</time>
          <h3>${escapeHtml(event.title)}</h3>
          ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
        </div>
        <div class="admin-event-actions">
          <button class="button button-small button-light" onclick="startEdit('${event.id}')">
            <i class="fas fa-pen"></i> Edit
          </button>
          <button class="button button-small button-danger" onclick="deleteEvent('${event.id}')">
            <i class="fas fa-trash"></i> Delete Event
          </button>
        </div>
      </div>

      <div class="admin-photo-grid">
        ${(event.images || []).map(src => `
          <div class="admin-photo">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(event.title)}">
            <button title="Delete photo" onclick="deleteImage('${event.id}', '${encodeURIComponent(src.split("/").pop())}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `).join("")}
      </div>

      <div class="add-photo-row">
        <label class="button button-small button-light">
          <i class="fas fa-plus"></i> Add Photos
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onchange="addPhotos('${event.id}', this.files)">
        </label>
        <span>${(event.images || []).length} photo${(event.images || []).length === 1 ? "" : "s"}</span>
      </div>
    </article>
  `).join("");
}

eventImages.addEventListener("change", () => {
  imagePreview.innerHTML = "";
  [...eventImages.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.alt = file.name;
      imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  eventMessage.textContent = "";
  saveEventBtn.disabled = true;

  try {
    if (editingId) {
      const response = await fetch(`/api/admin/events/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle.value.trim(),
          date: eventDate.value,
          description: eventDescription.value.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (eventImages.files.length) {
        const formData = new FormData();
        [...eventImages.files].forEach(file => formData.append("images", file));

        const imageResponse = await fetch(`/api/admin/events/${editingId}/images`, {
          method: "POST",
          body: formData
        });
        const imageData = await imageResponse.json();
        if (!imageResponse.ok) throw new Error(imageData.error);
      }

      eventMessage.textContent = "Event updated successfully.";
    } else {
      const formData = new FormData();
      formData.append("title", eventTitle.value.trim());
      formData.append("date", eventDate.value);
      formData.append("description", eventDescription.value.trim());
      [...eventImages.files].forEach(file => formData.append("images", file));

      const response = await fetch("/api/admin/events", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      eventMessage.textContent = "Event added successfully.";
    }

    resetForm();
    await loadEvents();
  } catch (error) {
    eventMessage.textContent = error.message || "Something went wrong.";
  } finally {
    saveEventBtn.disabled = false;
  }
});

function startEdit(id) {
  const event = events.find(item => item.id === id);
  if (!event) return;

  editingId = id;
  eventId.value = id;
  eventTitle.value = event.title;
  eventDate.value = event.date;
  eventDescription.value = event.description || "";
  eventImages.value = "";
  imagePreview.innerHTML = "";

  formTitle.textContent = "Edit Past Event";
  saveEventBtn.textContent = "Save Changes";
  cancelEditBtn.classList.remove("hidden");
  document.getElementById("new-images-area").querySelector("label").textContent = "Add more photos";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

cancelEditBtn.addEventListener("click", resetForm);

function resetForm() {
  editingId = null;
  eventForm.reset();
  eventId.value = "";
  imagePreview.innerHTML = "";
  formTitle.textContent = "Add a Past Event";
  saveEventBtn.textContent = "Add Event";
  cancelEditBtn.classList.add("hidden");
  document.getElementById("new-images-area").querySelector("label").textContent = "Photos";
}

async function deleteEvent(id) {
  const event = events.find(item => item.id === id);
  if (!event) return;

  if (!confirm(`Delete "${event.title}" and all of its photos? This cannot be undone.`)) return;

  const response = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Could not delete event.");
    return;
  }

  await loadEvents();
}

async function deleteImage(eventId, encodedName) {
  if (!confirm("Delete this photo? This cannot be undone.")) return;

  const response = await fetch(`/api/admin/events/${eventId}/images/${encodedName}`, {
    method: "DELETE"
  });
  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Could not delete photo.");
    return;
  }

  await loadEvents();
}

async function addPhotos(id, files) {
  if (!files.length) return;

  const formData = new FormData();
  [...files].forEach(file => formData.append("images", file));

  const response = await fetch(`/api/admin/events/${id}/images`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Could not upload photos.");
    return;
  }

  await loadEvents();
}

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  adminPanel.classList.add("hidden");
  loginPanel.classList.remove("hidden");
});

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}