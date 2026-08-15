let eventsData = {
    upcoming: [],
    past: []
};

const $ = id =>
    document.getElementById(id);


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const response =
            await fetch(
                "/api/admin/status"
            );

        const status =
            await response.json();

        if (!status.authenticated) {
            window.location.href =
                "/admin-login.html";

            return;
        }


        $("logout-btn")
            .addEventListener(
                "click",
                logout
            );


        $("new-upcoming-btn")
            .addEventListener(
                "click",
                () =>
                    openUpcomingForm()
            );


        $("cancel-upcoming-btn")
            .addEventListener(
                "click",
                closeUpcomingForm
            );


        $("new-past-btn")
            .addEventListener(
                "click",
                () =>
                    openPastForm()
            );


        $("cancel-past-btn")
            .addEventListener(
                "click",
                closePastForm
            );


        $("upcoming-form")
            .addEventListener(
                "submit",
                saveUpcoming
            );


        $("past-form")
            .addEventListener(
                "submit",
                savePast
            );


        await loadEvents();
    }
);


/* =========================================
   LOAD EVENTS
========================================= */

async function loadEvents() {

    const response =
        await fetch(
            "/api/events"
        );

    if (!response.ok) {

        showMessage(
            "Could not load events.",
            "error"
        );

        return;
    }


    eventsData =
        await response.json();


    renderUpcoming();
    renderPast();
}


/* =========================================
   UPCOMING EVENTS
========================================= */

function renderUpcoming() {

    const container =
        $("upcoming-admin-list");


    if (
        !eventsData.upcoming.length
    ) {

        container.innerHTML = `
            <div class="admin-empty">
                <i class="far fa-calendar"></i>
                <p>
                    No upcoming events yet.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        eventsData.upcoming
            .map(event => `

        <article class="admin-event-card">

            <div class="admin-event-main">

                ${
                    event.flyer
                        ? `
                            <img
                                class="admin-event-thumb"
                                src="${escapeAttr(event.flyer)}"
                                alt=""
                            >
                        `
                        : `
                            <div class="admin-event-thumb no-flyer">
                                <i class="far fa-image"></i>
                            </div>
                        `
                }


                <div class="admin-event-info">

                    <div class="admin-event-date">
                        ${formatDate(event.date)}
                    </div>

                    <h3>
                        ${escapeHtml(event.title)}
                    </h3>

                    <p>
                        ${escapeHtml(
                            event.location ||
                            "Location not specified"
                        )}

                        ${
                            event.time
                                ? ` · ${escapeHtml(event.time)}`
                                : ""
                        }
                    </p>


                    ${
                        event.flyer
                            ? `
                                <span class="admin-badge">
                                    <i class="fas fa-check"></i>
                                    Flyer attached
                                </span>
                            `
                            : `
                                <span class="admin-badge muted">
                                    No flyer
                                </span>
                            `
                    }

                </div>

            </div>


            <div class="admin-card-actions">

                <button
                    class="admin-secondary-btn"
                    onclick="editUpcoming('${escapeAttr(event.id)}')"
                >
                    <i class="fas fa-pen"></i>
                    Edit
                </button>


                <button
                    class="admin-danger-btn"
                    onclick="deleteUpcoming('${escapeAttr(event.id)}')"
                >
                    <i class="fas fa-trash"></i>
                    Delete
                </button>

            </div>

        </article>

    `)
    .join("");
}


/* =========================================
   PAST EVENTS
========================================= */

function renderPast() {

    const container =
        $("past-admin-list");


    if (!eventsData.past.length) {

        container.innerHTML = `
            <div class="admin-empty">

                <i class="far fa-images"></i>

                <p>
                    No past events yet.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        eventsData.past
            .map(event => `

        <article class="admin-event-card">

            <div>

                <div class="admin-event-date">
                    ${formatDate(event.date)}
                </div>


                <h3>
                    ${escapeHtml(event.title)}
                </h3>


                ${
                    event.description
                        ? `
                            <p>
                                ${escapeHtml(
                                    event.description
                                )}
                            </p>
                        `
                        : ""
                }


                <div class="photo-count">

                    <i class="far fa-images"></i>

                    ${(event.photos || []).length}

                    photo${
                        (event.photos || [])
                            .length === 1
                            ? ""
                            : "s"
                    }

                </div>


                <div class="admin-photo-grid">

                    ${
                        (event.photos || [])
                            .map(
                                photo => `

                        <div class="admin-photo">

                            <img
                                src="${escapeAttr(photo)}"
                                alt=""
                            >

                            <button
                                title="Delete photo"
                                onclick="deletePastPhoto(
                                    '${escapeAttr(event.id)}',
                                    '${escapeAttr(photo)}'
                                )"
                            >
                                <i class="fas fa-times"></i>
                            </button>

                        </div>

                    `
                            )
                            .join("")
                    }

                </div>

            </div>


            <div class="admin-card-actions">

                <button
                    class="admin-secondary-btn"
                    onclick="editPast('${escapeAttr(event.id)}')"
                >
                    <i class="fas fa-pen"></i>
                    Edit / Add Photos
                </button>


                <button
                    class="admin-danger-btn"
                    onclick="deletePast('${escapeAttr(event.id)}')"
                >
                    <i class="fas fa-trash"></i>
                    Delete Event
                </button>

            </div>

        </article>

    `)
    .join("");
}


/* =========================================
   UPCOMING FORM
========================================= */

function openUpcomingForm(event = null) {

    $("upcoming-form-wrap")
        .hidden = false;


    $("upcoming-form").reset();


    $("upcoming-id").value =
        event?.id || "";


    $("upcoming-title").value =
        event?.title || "";


    $("upcoming-date").value =
        event?.date || "";


    $("upcoming-time").value =
        event?.time || "";


    $("upcoming-location").value =
        event?.location || "";


    $("upcoming-description").value =
        event?.description || "";


    $("upcoming-activities").value =
        (event?.activities || [])
            .join("\n");


    $("upcoming-join-url").value =
        event?.joinUrl || "";


    $("current-flyer").innerHTML =
        event?.flyer

            ? `
                <div class="current-flyer-row">

                    <img
                        src="${escapeAttr(event.flyer)}"
                        alt="Current flyer"
                    >

                    <label>

                        <input
                            type="checkbox"
                            id="remove-flyer"
                        >

                        Remove current flyer

                    </label>

                </div>
            `

            : "";


    $("upcoming-form-wrap")
        .scrollIntoView({
            behavior: "smooth"
        });
}


function closeUpcomingForm() {

    $("upcoming-form-wrap")
        .hidden = true;

    $("upcoming-form").reset();
}


/* =========================================
   PAST FORM
========================================= */

function openPastForm(event = null) {

    $("past-form-wrap")
        .hidden = false;


    $("past-form").reset();


    $("past-id").value =
        event?.id || "";


    $("past-title").value =
        event?.title || "";


    $("past-date").value =
        event?.date || "";


    $("past-description").value =
        event?.description || "";


    $("past-form-wrap")
        .scrollIntoView({
            behavior: "smooth"
        });
}


function closePastForm() {

    $("past-form-wrap")
        .hidden = true;

    $("past-form").reset();
}


/* =========================================
   SAVE UPCOMING
========================================= */

async function saveUpcoming(event) {

    event.preventDefault();


    const id =
        $("upcoming-id").value;


    const formData =
        new FormData(
            $("upcoming-form")
        );


    const removeFlyer =
        document.getElementById(
            "remove-flyer"
        );


    if (
        removeFlyer &&
        removeFlyer.checked
    ) {

        formData.append(
            "removeFlyer",
            "true"
        );
    }


    const url = id
        ? `/api/admin/upcoming/${encodeURIComponent(id)}`
        : "/api/admin/upcoming";


    const response =
        await fetch(url, {

            method:
                id ? "PUT" : "POST",

            body: formData
        });


    const data =
        await response
            .json()
            .catch(() => ({}));


    if (!response.ok) {

        showMessage(
            data.error ||
            "Could not save event.",
            "error"
        );

        return;
    }


    showMessage(
        id
            ? "Upcoming event updated."
            : "Upcoming event added.",

        "success"
    );


    closeUpcomingForm();

    await loadEvents();
}


/* =========================================
   SAVE PAST
========================================= */

async function savePast(event) {

    event.preventDefault();


    const id =
        $("past-id").value;


    const formData =
        new FormData(
            $("past-form")
        );


    const url = id
        ? `/api/admin/past/${encodeURIComponent(id)}`
        : "/api/admin/past";


    const response =
        await fetch(url, {

            method:
                id ? "PUT" : "POST",

            body: formData
        });


    const data =
        await response
            .json()
            .catch(() => ({}));


    if (!response.ok) {

        showMessage(
            data.error ||
            "Could not save event.",
            "error"
        );

        return;
    }


    showMessage(
        id
            ? "Past event updated."
            : "Past event added.",

        "success"
    );


    closePastForm();

    await loadEvents();
}


/* =========================================
   EDIT
========================================= */

window.editUpcoming =
    function(id) {

        const event =
            eventsData.upcoming.find(
                item => item.id === id
            );


        if (event) {
            openUpcomingForm(event);
        }
    };


window.editPast =
    function(id) {

        const event =
            eventsData.past.find(
                item => item.id === id
            );


        if (event) {
            openPastForm(event);
        }
    };


/* =========================================
   DELETE UPCOMING
========================================= */

window.deleteUpcoming =
    async function(id) {

        const event =
            eventsData.upcoming.find(
                item => item.id === id
            );


        if (!event) return;


        if (
            !confirm(
                `Delete "${event.title}"?`
            )
        ) {
            return;
        }


        const response =
            await fetch(
                `/api/admin/upcoming/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );


        if (response.ok) {

            showMessage(
                "Upcoming event deleted.",
                "success"
            );

            await loadEvents();

        } else {

            showMessage(
                "Could not delete event.",
                "error"
            );
        }
    };


/* =========================================
   DELETE PAST
========================================= */

window.deletePast =
    async function(id) {

        const event =
            eventsData.past.find(
                item => item.id === id
            );


        if (!event) return;


        if (
            !confirm(
                `Delete "${event.title}" and all of its photos?`
            )
        ) {
            return;
        }


        const response =
            await fetch(
                `/api/admin/past/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );


        if (response.ok) {

            showMessage(
                "Past event deleted.",
                "success"
            );

            await loadEvents();

        } else {

            showMessage(
                "Could not delete event.",
                "error"
            );
        }
    };


/* =========================================
   DELETE PHOTO
========================================= */

window.deletePastPhoto =
    async function(
        id,
        photo
    ) {

        if (
            !confirm(
                "Delete this photo?"
            )
        ) {
            return;
        }


        const response =
            await fetch(
                `/api/admin/past/${encodeURIComponent(id)}/photos`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            photo
                        })
                }
            );


        if (response.ok) {

            showMessage(
                "Photo deleted.",
                "success"
            );

            await loadEvents();

        } else {

            showMessage(
                "Could not delete photo.",
                "error"
            );
        }
    };


/* =========================================
   LOGOUT
========================================= */

async function logout() {

    await fetch(
        "/api/admin/logout",
        {
            method: "POST"
        }
    );


    window.location.href =
        "/admin-login.html";
}


/* =========================================
   HELPERS
========================================= */

function formatDate(value) {

    if (!value) {
        return "Date TBD";
    }


    const date =
        new Date(
            `${value}T12:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }


    return date.toLocaleDateString(
        undefined,
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


function showMessage(
    text,
    type
) {

    const element =
        $("admin-message");


    element.textContent =
        text;


    element.className =
        `admin-message ${type}`;


    element.hidden = false;


    setTimeout(
        () => {
            element.hidden = true;
        },
        3500
    );
}


function escapeHtml(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character])
    );
}


function escapeAttr(value) {
    return escapeHtml(value);
}