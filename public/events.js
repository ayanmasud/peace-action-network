document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const upcoming =
            document.getElementById(
                "upcoming-events-list"
            );

        const past =
            document.getElementById(
                "past-events-list"
            );


        try {

            const response =
                await fetch(
                    "/api/events"
                );


            if (!response.ok) {
                throw new Error(
                    "Could not load events"
                );
            }


            const data =
                await response.json();


            renderUpcoming(
                data.upcoming || [],
                upcoming
            );


            renderPast(
                data.past || [],
                past
            );


        } catch (error) {

            upcoming.innerHTML = `
                <div class="empty-public-state">

                    Events are temporarily
                    unavailable.

                </div>
            `;


            past.innerHTML = `
                <div class="empty-public-state">

                    Past events are temporarily
                    unavailable.

                </div>
            `;
        }

    }
);


/* =========================================
   UPCOMING
========================================= */

function renderUpcoming(
    events,
    container
) {

    if (!events.length) {

        container.innerHTML = `
            <div class="empty-public-state">

                <i class="far fa-calendar"></i>

                <h3>
                    No upcoming events
                </h3>

                <p>
                    Check back soon for
                    new community events.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        events.map(event => {


            /*
                IMPORTANT:

                If there is a flyer,
                show it.

                If there isn't,
                don't create an
                empty image box.
            */

            const flyer =
                event.flyer

                    ? `
                        <div class="upcoming-flyer">

                            <img
                                src="${escapeAttr(event.flyer)}"
                                alt="${escapeAttr(event.title)} flyer"
                            >

                        </div>
                    `

                    : "";


            const activities =
                (event.activities || [])
                    .filter(Boolean);


            const activitiesHTML =
                activities.length

                    ? `
                        <div class="event-activities">

                            <h4>
                                What to Expect
                            </h4>

                            <ul>

                                ${activities
                                    .map(
                                        item =>
                                            `<li>
                                                ${escapeHtml(item)}
                                            </li>`
                                    )
                                    .join("")
                                }

                            </ul>

                        </div>
                    `

                    : "";


            const joinButton =
                event.joinUrl

                    ? `
                        <a
                            href="${escapeAttr(event.joinUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="cta-button"
                        >
                            Join This Event
                        </a>
                    `

                    : "";


            return `

                <article
                    class="upcoming-event-card
                    ${event.flyer
                        ? "has-flyer"
                        : "no-flyer"}"
                >

                    ${flyer}


                    <div
                        class="upcoming-event-content"
                    >

                        <h3>
                            ${escapeHtml(
                                event.title
                            )}
                        </h3>


                        <div
                            class="event-meta"
                        >

                            ${
                                event.date
                                    ? `
                                        <span>

                                            <i
                                                class="far fa-calendar-alt"
                                            ></i>

                                            ${formatDate(
                                                event.date
                                            )}

                                        </span>
                                    `
                                    : ""
                            }


                            ${
                                event.time
                                    ? `
                                        <span>

                                            <i
                                                class="far fa-clock"
                                            ></i>

                                            ${escapeHtml(
                                                event.time
                                            )}

                                        </span>
                                    `
                                    : ""
                            }


                            ${
                                event.location
                                    ? `
                                        <span>

                                            <i
                                                class="fas fa-map-marker-alt"
                                            ></i>

                                            ${escapeHtml(
                                                event.location
                                            )}

                                        </span>
                                    `
                                    : ""
                            }

                        </div>


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


                        ${activitiesHTML}


                        ${joinButton}

                    </div>

                </article>

            `;

        })
        .join("");
}


/* =========================================
   PAST EVENTS
========================================= */

function renderPast(
    events,
    container
) {

    if (!events.length) {

        container.innerHTML = `
            <div class="empty-public-state">

                <i class="far fa-images"></i>

                <h3>
                    No past events yet
                </h3>

            </div>
        `;

        return;
    }


    const sorted =
        [...events].sort(
            (a, b) =>
                (b.date || "")
                    .localeCompare(
                        a.date || ""
                    )
        );


    container.innerHTML =
        sorted.map(event => {

            const photos =
                event.photos || [];


            let gallery;


            if (photos.length) {

                gallery = `

                    <div
                        class="event-photo-collage
                        ${galleryClass(
                            photos.length
                        )}"
                    >

                        ${photos
                            .map(
                                (photo, index) => `

                                    <img
                                        src="${escapeAttr(photo)}"
                                        alt="${escapeAttr(event.title)} photo ${index + 1}"
                                        loading="lazy"
                                    >

                                `
                            )
                            .join("")
                        }

                    </div>

                `;

            } else {

                gallery = `

                    <div class="no-event-photos">

                        <i
                            class="far fa-image"
                        ></i>

                        <span>
                            No photos available
                        </span>

                    </div>

                `;
            }


            return `

                <article
                    class="past-event-card"
                >

                    <div
                        class="past-event-heading"
                    >

                        <div>

                            <div
                                class="past-event-date"
                            >
                                ${formatDate(
                                    event.date
                                )}
                            </div>


                            <h3>
                                ${escapeHtml(
                                    event.title
                                )}
                            </h3>

                        </div>

                    </div>


                    ${
                        event.description
                            ? `
                                <p
                                    class="past-event-description"
                                >
                                    ${escapeHtml(
                                        event.description
                                    )}
                                </p>
                            `
                            : ""
                    }


                    ${gallery}

                </article>

            `;

        })
        .join("");
}


/* =========================================
   GALLERY LAYOUT
========================================= */

function galleryClass(count) {

    if (count === 1)
        return "photos-1";

    if (count === 2)
        return "photos-2";

    if (count === 3)
        return "photos-3";

    if (count === 4)
        return "photos-4";

    return "photos-many";
}


/* =========================================
   DATE
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


/* =========================================
   SECURITY HELPERS
========================================= */

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