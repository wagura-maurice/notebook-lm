// js/index.js
document.addEventListener("DOMContentLoaded", function () {
  // Hide preloader after 5 seconds
  setTimeout(function () {
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.style.opacity = "0";
      setTimeout(() => (preloader.style.display = "none"), 500);
    }
  }, 5000);

  // Toggle modal
  const createButton = document.querySelector(".create-button");
  const modal = document.querySelector(".modal");

  if (createButton && modal) {
    createButton.addEventListener("click", function () {
      modal.classList.toggle("hidden");
    });

    // Close modal when clicking outside
    modal.addEventListener("click", function (e) {
      if (e.target.classList.contains("modal-overlay")) {
        modal.classList.add("hidden");
      }
    });

    // Close button
    const cancelButton = modal.querySelector("button:first-of-type");
    if (cancelButton) {
      cancelButton.addEventListener("click", function () {
        modal.classList.add("hidden");
      });
    }
  }

  // View toggle buttons
  const gridView = document.getElementById("grid-view");
  const listView = document.getElementById("list-view");
  const gridButton = document.querySelector(".grid-view");
  const listButton = document.querySelector(".list-view");

  if (gridButton && listButton) {
    gridButton.addEventListener("click", function () {
      gridView.classList.remove("hidden");
      listView.classList.add("hidden");
      gridButton.classList.add("active");
      listButton.classList.remove("active");
    });

    listButton.addEventListener("click", function () {
      listView.classList.remove("hidden");
      gridView.classList.add("hidden");
      listButton.classList.add("active");
      gridButton.classList.remove("active");
    });
  }

  // Create notebook form submission
  const createFormButton = document.querySelector(
    ".modal-content button:last-of-type"
  );
  if (createFormButton) {
    createFormButton.addEventListener("click", function (e) {
      e.preventDefault();
      const title = document.getElementById("notebook-title").value;
      const description = document.getElementById("notebook-description").value;

      if (title.trim() === "") {
        alert("Please enter a notebook title");
        return;
      }

      // Here you would typically send the data to your backend
      console.log("Creating notebook:", { title, description });
      modal.classList.add("hidden");

      // Reset form
      document.getElementById("notebook-title").value = "";
      document.getElementById("notebook-description").value = "";
    });
  }
});

function toggleDropdown() {
  document.getElementById("sort-menu").classList.toggle("hidden");
}

function selectSort(option) {
  document.getElementById("sort-label").textContent = option;
  document.getElementById("sort-menu").classList.add("hidden");
  // Implement sorting logic here
}

// Optional: Close dropdown if clicked outside
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("sort-menu");
  const button = event.target.closest("button");
  if (!button && !dropdown.contains(event.target)) {
    dropdown.classList.add("hidden");
  }
});
