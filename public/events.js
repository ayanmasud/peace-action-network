document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("past-events-grid");
  if (!grid) return;

  try {
    const response = await fetch("/api/events");
    if (!response.ok) throw new Error("Could not load events.");
    const events = await response.json();

    if (!events.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="far fa-calendar"></i>
          <h3>No past events yet</h3>
          <p>Check back soon for photos and updates.</p>
        </div>`;
      return;
    }

    grid.innerHTML = events.map(event => {
      const images = event.images || [];
      const imageMarkup = images.length
        ? images.slice(0, 6).map((src, index) =>
            `<img src="${escapeHtml(src)}" alt="${escapeHtml(event.title)} photo ${index + 1}" loading="lazy">`
          ).join("")
        : `<div class="gallery-placeholder"><i class="far fa-image"></i></div>`;

      return `
        <article class="past-event-card">
          <div class="event-gallery ${images.length === 1 ? "single-image" : ""}">
            ${imageMarkup}
          </div>
          <div class="past-event-info">
            <time datetime="${escapeHtml(event.date)}">${formatDate(event.date)}</time>
            <h3>${escapeHtml(event.title)}</h3>
            ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
          </div>
        </article>`;
    }).join("");
  } catch (error) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-triangle-exclamation"></i>
        <h3>Unable to load events</h3>
        <p>Please try refreshing the page.</p>
      </div>`;
  }
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