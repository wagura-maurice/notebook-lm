// js/app.js

document.addEventListener("DOMContentLoaded", function () {
  const dropdownTrigger = document.getElementById("profile-dropdown-trigger");
  const dropdownMenu = document.querySelector("#profile-dropdown-container .profile-dropdown");
  const mobileMenuButton = document.getElementById("mobile-menu-button");

  // Toggle dropdown on desktop
  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      const isExpanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", !isExpanded);
      dropdownMenu.classList.toggle("hidden");
      dropdownMenu.classList.toggle("opacity-0");
      dropdownMenu.classList.toggle("translate-y-2");
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (
      dropdownMenu &&
      !dropdownMenu.contains(e.target) &&
      dropdownTrigger &&
      !dropdownTrigger.contains(e.target)
    ) {
      dropdownMenu.classList.add("hidden", "opacity-0", "translate-y-2");
      if (dropdownTrigger) {
        dropdownTrigger.setAttribute("aria-expanded", "false");
      }
    }
  });

  // Handle mobile menu button
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", function () {
      const isExpanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", !isExpanded);
      // Toggle mobile menu visibility (you can add your mobile menu logic here)
      console.log("Mobile menu toggled");
    });
  }

  // Handle keyboard navigation
  if (dropdownMenu) {
    const menuItems = dropdownMenu.querySelectorAll('a[role="menuitem"]');
    const firstItem = menuItems[0];
    const lastItem = menuItems[menuItems.length - 1];

    dropdownMenu.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        dropdownTrigger.focus();
        dropdownMenu.classList.add("hidden", "opacity-0", "translate-y-2");
        dropdownTrigger.setAttribute("aria-expanded", "false");
      }

      if (!e.shiftKey && e.key === "Tab" && e.target === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }

      if (e.shiftKey && e.key === "Tab" && e.target === firstItem) {
        e.preventDefault();
        lastItem.focus();
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Preloader logic
  function showPreloader() {
    var preloader = document.getElementById("preloader");
    var mainContent = document.getElementById("main-content");
    if (preloader) {
      preloader.classList.remove("hide");
      preloader.style.opacity = "1";
      preloader.style.pointerEvents = "auto";
    }
    if (mainContent) {
      mainContent.classList.remove("show");
      mainContent.style.opacity = "0";
      mainContent.style.pointerEvents = "none";
    }
  }
  function hidePreloader() {
    var preloader = document.getElementById("preloader");
    var mainContent = document.getElementById("main-content");
    if (preloader) {
      preloader.classList.add("hide");
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
    }
    if (mainContent) {
      mainContent.classList.add("show");
      mainContent.style.opacity = "1";
      mainContent.style.pointerEvents = "auto";
    }
  }
  showPreloader();
  setTimeout(hidePreloader, 3000);
});

document.addEventListener("DOMContentLoaded", function () {
  const leftColumn = document.getElementById("left-column");
  const rightColumn = document.getElementById("right-column");
  const middleColumn = document.getElementById("middle-column");

  const collapseLeftBtn = document.getElementById("collapse-left");
  const expandLeftBtn = document.getElementById("expand-left");
  const collapseRightBtn = document.getElementById("collapse-right");
  const expandRightBtn = document.getElementById("expand-right");
  const expandMiddleBtn = document.getElementById("expand-middle");

  function updateColumnState(columnElement, shouldCollapse) {
    if (!columnElement) return;
    const expandedContent = columnElement.querySelector(".expanded-content");
    const collapsedContent = columnElement.querySelector(".collapsed-content");

    if (shouldCollapse) {
      columnElement.classList.add("collapsed");
      if (expandedContent) expandedContent.classList.add("hidden");
      if (collapsedContent) collapsedContent.classList.remove("hidden");
    } else {
      columnElement.classList.remove("collapsed");
      if (expandedContent) expandedContent.classList.remove("hidden");
      if (collapsedContent) collapsedContent.classList.add("hidden");
    }
  }

  // Function to handle left column collapse/expand
  if (collapseLeftBtn && expandLeftBtn) {
    collapseLeftBtn.addEventListener("click", () => {
      updateColumnState(leftColumn, true);
    });

    expandLeftBtn.addEventListener("click", () => {
      updateColumnState(leftColumn, false);
    });
  }

  // Function to handle right column collapse/expand
  if (collapseRightBtn && expandRightBtn) {
    collapseRightBtn.addEventListener("click", () => {
      updateColumnState(rightColumn, true);
    });

    expandRightBtn.addEventListener("click", () => {
      updateColumnState(rightColumn, false);
    });
  }

  // Function to handle middle column expand
  if (expandMiddleBtn) {
    expandMiddleBtn.addEventListener("click", () => {
      const leftIsCollapsed = leftColumn?.classList.contains("collapsed");
      const rightIsCollapsed = rightColumn?.classList.contains("collapsed");

      const bothCollapsed = leftIsCollapsed && rightIsCollapsed;

      if (bothCollapsed) {
        // Currently focused on middle; expand side columns
        updateColumnState(leftColumn, false);
        updateColumnState(rightColumn, false);
      } else {
        // Collapse both sides to focus middle
        updateColumnState(leftColumn, true);
        updateColumnState(rightColumn, true);
      }
    });
  }

  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-button");
  const mobileTabContents = document.querySelectorAll(".mobile-tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.getAttribute("data-tab");

      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      mobileTabContents.forEach((content) => {
        if (content.id === tab) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    });
  });
});
