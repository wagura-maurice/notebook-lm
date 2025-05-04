// script.js
$(document).ready(function () {
  // DOM Elements
  const $container = $("#columns-container");
  const $leftColumn = $("#left-column");
  const $middleColumn = $("#middle-column");
  const $rightColumn = $("#right-column");
  const $tabButtons = $(".tab-button");

  // State
  let state = {
    leftVisible: true,
    rightVisible: true,
    activeTab: "middle-column",
    isMobile: window.innerWidth < 1024,
  };

  // Initialize
  initLayout();
  setupEventListeners();

  // Functions
  function initLayout() {
    if (state.isMobile) {
      setupMobileView();
    } else {
      setupDesktopView();
    }
  }

  function setupMobileView() {
    $container.removeClass("collapsed-left collapsed-right full-expand");
    $(".mobile-tab-content").removeClass("active").hide();
    $(`#${state.activeTab}`).addClass("active").show();
    $tabButtons.removeClass("active");
    $(`.tab-button[data-tab="${state.activeTab}"]`).addClass("active");
  }

  function setupDesktopView() {
    $(".mobile-tab-content").removeClass("active").show();
    $tabButtons.removeClass("active");
    updateColumnLayout();
  }

  function updateColumnLayout() {
    $container.removeClass("collapsed-left collapsed-right full-expand");

    if (!state.leftVisible && !state.rightVisible) {
      $container.addClass("full-expand");
    } else {
      if (!state.leftVisible) $container.addClass("collapsed-left");
      if (!state.rightVisible) $container.addClass("collapsed-right");
    }
  }

  function setupEventListeners() {
    // Column toggles
    $("#collapse-left").click(function () {
      state.leftVisible = !state.leftVisible;
      updateColumnLayout();
    });

    $("#collapse-right").click(function () {
      state.rightVisible = !state.rightVisible;
      updateColumnLayout();
    });

    $(".expand-middle").click(function () {
      if (state.leftVisible || state.rightVisible) {
        state.leftVisible = false;
        state.rightVisible = false;
      } else {
        state.leftVisible = true;
        state.rightVisible = true;
      }
      updateColumnLayout();
    });

    // Mobile tabs
    $tabButtons.click(function () {
      const tabId = $(this).data("tab");
      state.activeTab = tabId;

      $tabButtons.removeClass("active");
      $(this).addClass("active");

      $(".mobile-tab-content").removeClass("active").hide();
      $(`#${tabId}`).addClass("active").show();
    });

    // Window resize
    $(window).resize(function () {
      const isMobileNow = window.innerWidth < 1024;
      if (isMobileNow !== state.isMobile) {
        state.isMobile = isMobileNow;
        if (state.isMobile) {
          setupMobileView();
        } else {
          setupDesktopView();
        }
      }
    });
  }
});
