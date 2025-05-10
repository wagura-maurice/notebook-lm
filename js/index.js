// js/index.js
document.addEventListener("DOMContentLoaded", function () {
  // Toggle modal
  const createButton = document.querySelector(".create-button");
  const modal = document.querySelector(".modal");

  if (createButton && modal) {
    createButton.addEventListener("click", function () {
      modal.classList.toggle("hidden");
    });

    // Close modal when clicking outside
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
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
  const viewButtons = document.querySelectorAll(".view-toggle button");
  viewButtons.forEach((button) => {
    button.addEventListener("click", function () {
      viewButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
    });
  });
});
