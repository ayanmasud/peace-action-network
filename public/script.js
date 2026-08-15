document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.innerHTML = open
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.innerHTML = '<i class="fas fa-bars"></i>';
      });
    });
  }

  document.querySelectorAll(".nav-dropdown-toggle").forEach(button => {
    button.addEventListener("click", e => {
      e.stopPropagation();
      const dropdown = button.parentElement;
      const isOpen = dropdown.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".nav-dropdown.open").forEach(dropdown => {
      dropdown.classList.remove("open");
      const button = dropdown.querySelector(".nav-dropdown-toggle");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  });

  const year = document.getElementById("current-year");
  if (year) year.textContent = new Date().getFullYear();

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
});