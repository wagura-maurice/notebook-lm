document.addEventListener("DOMContentLoaded", function () {
  const dropdownTrigger = document.getElementById("avatar-dropdown-trigger");
  const dropdownMenu = document.getElementById("avatar-dropdown");

  // Toggle dropdown on click
  dropdownTrigger.addEventListener("click", function (e) {
    e.stopPropagation();
    const isHidden = dropdownMenu.classList.toggle("hidden");

    // Position the dropdown for mobile
    if (!isHidden && window.innerWidth < 1024) {
      // lg breakpoint
      const rect = dropdownTrigger.getBoundingClientRect();
      dropdownMenu.style.top = `${rect.bottom + window.scrollY}px`;
      dropdownMenu.style.right = "1rem";
    }
  });

  // Handle window resize
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!dropdownMenu.classList.contains("hidden")) {
        dropdownMenu.classList.add("hidden");
      }
    }, 250);
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (
      !dropdownTrigger.contains(e.target) &&
      !dropdownMenu.contains(e.target)
    ) {
      dropdownMenu.classList.add("hidden");
    }
  });

  // Close dropdown when clicking on a menu item
  const menuItems = dropdownMenu.querySelectorAll("a");
  menuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      dropdownMenu.classList.add("hidden");
      // Here you can add navigation logic for each menu item
      console.log("Clicked:", item.textContent.trim());
    });
  });

  // Close dropdown when pressing Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      dropdownMenu.classList.add("hidden");
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const dropdownTrigger = document.getElementById(
    "desktop-avatar-dropdown-trigger"
  );
  const dropdownMenu = document.getElementById("desktop-avatar-dropdown");

  // Toggle dropdown on click
  dropdownTrigger.addEventListener("click", function (e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle("hidden");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (
      !dropdownTrigger.contains(e.target) &&
      !dropdownMenu.contains(e.target)
    ) {
      dropdownMenu.classList.add("hidden");
    }
  });

  // Close dropdown when clicking on a menu item
  const menuItems = dropdownMenu.querySelectorAll("a");
  menuItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      dropdownMenu.classList.add("hidden");
      // Here you can add navigation logic for each menu item
      console.log("Clicked:", item.textContent.trim());
    });
  });

  // Close dropdown when pressing Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      dropdownMenu.classList.add("hidden");
    }
  });
});
