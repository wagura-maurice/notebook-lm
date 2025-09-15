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
      preloader.classList.add("hidden");
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
    }
    if (mainContent) {
      mainContent.style.opacity = "1";
      mainContent.style.pointerEvents = "auto";
      mainContent.classList.remove("hidden");
    }
  }

  // Initialize preloader - only show if it's the first visit
  const hasVisited = sessionStorage.getItem("hasVisited");
  if (!hasVisited) {
    showPreloader();
    setTimeout(hidePreloader, 1000); // Reduced from 3000ms to 1000ms for better UX
    sessionStorage.setItem("hasVisited", "true");
  } else {
    // If already visited, ensure content is visible
    hidePreloader();
  }

  // Handle profile dropdown
  const profileDropdownTrigger = document.getElementById(
    "profile-dropdown-trigger"
  );
  const profileDropdownMenu = document.getElementById("profile-dropdown");
  const avatarDropdownTrigger = document.getElementById(
    "avatar-dropdown-trigger"
  );
  const avatarDropdownMenu = document.getElementById("avatar-dropdown");
  // Shared desktop-only grace period after opening a dropdown
  let dropdownIgnoreOutsideUntil = 0;

  function setupDropdown(trigger, menu) {
    if (!trigger || !menu) return;

    // Track if we should ignore the next click (to prevent immediate close)
    let ignoreNextClick = false;
    // Desktop-only grace period to ignore outside clicks right after opening
    let ignoreOutsideUntil = 0;

    // Close other dropdowns when opening a new one
    function closeOtherDropdowns(currentMenu) {
      document.querySelectorAll(".dropdown-menu").forEach((dropdown) => {
        if (
          dropdown !== currentMenu &&
          !dropdown.classList.contains("hidden")
        ) {
          // Add a small delay to prevent flickering when switching between dropdowns
          const closeTimer = setTimeout(() => {
            dropdown.classList.add("opacity-0", "translate-y-2");
            setTimeout(() => {
              if (
                dropdown.classList.contains("opacity-0") &&
                dropdown !== currentMenu
              ) {
                dropdown.classList.add("hidden");
              }
            }, 150);

            const dropdownTrigger = document.querySelector(
              `[aria-controls="${dropdown.id}"]`
            );
            if (dropdownTrigger) {
              dropdownTrigger.setAttribute("aria-expanded", "false");
            }
          }, 50);

          // Store the timer ID so we can cancel it if needed
          dropdown._closeTimer = closeTimer;
        }
      });
    }

    // Close this dropdown
    function closeDropdown() {
      menu.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => {
        menu.classList.add("hidden");
      }, 200);
      trigger.setAttribute("aria-expanded", "false");
    }

    // Toggle dropdown on click
    trigger.addEventListener("mousedown", function (e) {
      // Prevent default to avoid focus changes that might interfere
      e.preventDefault();
      e.stopPropagation();
      
      // Get current state before any changes
      const isExpanded = this.getAttribute("aria-expanded") === "true";

      // Set a flag to ignore the next click if needed
      if (ignoreNextClick) {
        ignoreNextClick = false;
        return;
      }

      // If clicking the same trigger that's already open, just close it
      if (isExpanded) {
        closeDropdown();
        return;
      }
      
      // Close other dropdowns first
      closeOtherDropdowns(menu);
      
      // Clear any pending close timers for this menu
      if (menu._closeTimer) {
        clearTimeout(menu._closeTimer);
        menu._closeTimer = null;
      }
      
      // Open the dropdown
      this.setAttribute("aria-expanded", "true");
      menu.classList.remove("hidden");
      // Force reflow to enable the transition
      void menu.offsetWidth;
      menu.classList.remove("opacity-0", "translate-y-2");
      
      // Set a longer grace period for desktop
      if (window.innerWidth >= 1024) {
        dropdownIgnoreOutsideUntil = Date.now() + 500;
      }

      // Don't auto-focus any element in the dropdown
      // This prevents the first item from being automatically selected
      // and allows the dropdown to open in a neutral state

      // Set a small delay before allowing the next click
      ignoreNextClick = true;
      setTimeout(() => (ignoreNextClick = false), 150);

      // Position the dropdown for mobile
      if (window.innerWidth < 1024) {
        const rect = trigger.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.right = "1rem";
      } else {
        // Reset positioning for desktop
        menu.style.top = "";
        menu.style.right = "";
      }
    });

    // Pre-arm grace period on pointerdown to avoid race with outside handler
    trigger.addEventListener("pointerdown", function (e) {
      if (window.innerWidth >= 1024) {
        dropdownIgnoreOutsideUntil = Date.now() + 400;
      }
      e.stopPropagation();
    });

    // Close dropdown when clicking on a menu item
    const menuItems = menu.querySelectorAll("a");
    menuItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        menu.classList.add("hidden");
        if (menu === profileDropdownMenu) {
          menu.classList.add("opacity-0", "translate-y-2");
        }
        trigger.setAttribute("aria-expanded", "false");
        console.log("Clicked:", item.textContent.trim());
      });
    });
  }

  // Initialize dropdowns
  setupDropdown(profileDropdownTrigger, profileDropdownMenu);
  setupDropdown(avatarDropdownTrigger, avatarDropdownMenu);

  // Handle window resize: keep dropdowns open but reposition across breakpoints
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      const pairs = [
        [profileDropdownTrigger, profileDropdownMenu],
        [avatarDropdownTrigger, avatarDropdownMenu],
      ];
      pairs.forEach(([trigger, menu]) => {
        if (!trigger || !menu || menu.classList.contains("hidden")) return;
        if (window.innerWidth < 1024) {
          const rect = trigger.getBoundingClientRect();
          menu.style.top = `${rect.bottom + window.scrollY}px`;
          menu.style.right = "1rem";
        } else {
          menu.style.top = "";
          menu.style.right = "";
        }
      });
    }, 150);
  });

  // Handle outside clicks for dropdowns
  function handleOutsideClick(e) {
    // Check if click is inside any dropdown trigger or menu
    const clickedTrigger = e.target.closest("[aria-expanded]");
    const clickedMenu = e.target.closest(".dropdown-menu");

    // If click is outside both menu and its trigger, close all dropdowns
    if (!clickedTrigger && !clickedMenu) {
      // Skip if we're in the grace period for desktop
      if (
        window.innerWidth >= 1024 &&
        Date.now() < dropdownIgnoreOutsideUntil
      ) {
        return;
      }

      // Close all visible dropdowns with animation
      document
        .querySelectorAll(".dropdown-menu:not(.hidden)")
        .forEach((menu) => {
          menu.classList.add("opacity-0", "translate-y-2");
          setTimeout(() => {
            if (menu.classList.contains("opacity-0")) {
              menu.classList.add("hidden");
            }
          }, 200);

          const trigger = document.querySelector(
            `[aria-controls="${menu.id}"][aria-expanded="true"]`
          );
          if (trigger) trigger.setAttribute("aria-expanded", "false");
        });
    } else if (clickedMenu) {
      // If clicking inside a menu, prevent it from closing
      e.stopPropagation();
    }
    // If clicking a trigger, let the click handler handle it
  }

  // Remove any existing handlers to prevent duplicates
  document.removeEventListener("mousedown", handleOutsideClick, true);
  document.removeEventListener("click", handleOutsideClick);
  
  // Add new handler with capture phase
  document.addEventListener("mousedown", handleOutsideClick, true);

  // Desktop hover persistence to prevent accidental close while hovering
  [
    profileDropdownTrigger,
    profileDropdownMenu,
    avatarDropdownTrigger,
    avatarDropdownMenu,
  ].forEach((el) => {
    if (!el) return;

    el.addEventListener("mouseenter", (e) => {
      if (window.innerWidth >= 1024) {
        // Extend the ignore period when hovering over the menu or trigger
        dropdownIgnoreOutsideUntil = Date.now() + 500;
        e.stopPropagation();
      }
    });

    el.addEventListener("mouseleave", (e) => {
      if (window.innerWidth >= 1024) {
        // Set a shorter ignore period when leaving the menu
        dropdownIgnoreOutsideUntil = Date.now() + 200;
      }
    });
  });

  // Keyboard navigation for open dropdown
  document.addEventListener("keydown", (e) => {
    const openMenu = document.querySelector(".dropdown-menu:not(.hidden)");
    if (!openMenu) return;
    const items = Array.from(
      openMenu.querySelectorAll('a, button, [tabindex="0"], [role="menuitem"]')
    );
    if (!items.length) return;
    const index = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[(index + 1 + items.length) % items.length];
      next.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = items[(index - 1 + items.length) % items.length];
      prev.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1].focus();
    } else if (e.key === "Enter" || e.key === " ") {
      const el = document.activeElement;
      if (openMenu.contains(el)) {
        el.click();
      }
    }
  });

  // Close dropdowns when pressing Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        if (!menu.classList.contains("hidden")) {
          menu.classList.add("opacity-0", "translate-y-2");
          setTimeout(() => {
            menu.classList.add("hidden");
          }, 200);
          const trigger = document.querySelector(
            `[aria-controls="${menu.id}"][aria-expanded="true"]`
          );
          if (trigger) trigger.setAttribute("aria-expanded", "false");
        }
      });
    }
  });

  // (Consolidated Escape handler above)
}); // Close the main DOMContentLoaded event listener

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
