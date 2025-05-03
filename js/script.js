// js/script.js

class NotebookApp {
  constructor() {
    this.initElements();
    this.initEvents();
    this.checkInitialState();
    this.setupResizeObserver();
  }

  initElements() {
    this.$leftColumn = $("#left-column");
    this.$rightColumn = $("#right-column");
    this.$middleColumn = $("#middle-column");
    this.$collapseLeft = $("#collapse-left");
    this.$collapseRight = $("#collapse-right");
    this.$expandMiddle = $(".fa-expand");
    this.isMobile = window.innerWidth < 768;
  }

  initEvents() {
    // Column toggle events
    this.$collapseLeft.on("click", () => this.toggleColumn("left"));
    this.$collapseRight.on("click", () => this.toggleColumn("right"));

    // Middle expand button
    this.$expandMiddle.on("click", () => this.toggleFullScreenMode());

    // Note card selection
    $(document).on("click", ".note-card", (e) =>
      this.selectNoteCard(e.currentTarget)
    );
  }

  toggleColumn(side) {
    const $column = side === "left" ? this.$leftColumn : this.$rightColumn;
    const $button = side === "left" ? this.$collapseLeft : this.$collapseRight;

    $column.toggleClass("collapsed");
    $button.find("i").toggleClass("fa-chevron-left fa-chevron-right");
    this.updateMiddleColumn();
  }

  toggleFullScreenMode() {
    const isFullScreen = this.$middleColumn.hasClass("full-screen");

    if (isFullScreen) {
      // Exit full screen - restore both columns
      this.$leftColumn.removeClass("collapsed");
      this.$rightColumn.removeClass("collapsed");
      this.$collapseLeft
        .find("i")
        .removeClass("fa-chevron-right")
        .addClass("fa-chevron-left");
      this.$collapseRight
        .find("i")
        .removeClass("fa-chevron-left")
        .addClass("fa-chevron-right");
    } else {
      // Enter full screen - collapse both columns
      this.$leftColumn.addClass("collapsed");
      this.$rightColumn.addClass("collapsed");
      this.$collapseLeft
        .find("i")
        .removeClass("fa-chevron-left")
        .addClass("fa-chevron-right");
      this.$collapseRight
        .find("i")
        .removeClass("fa-chevron-right")
        .addClass("fa-chevron-left");
    }

    this.$middleColumn.toggleClass("full-screen");
    this.updateMiddleColumn();
  }

  updateMiddleColumn() {
    const leftCollapsed = this.$leftColumn.hasClass("collapsed");
    const rightCollapsed = this.$rightColumn.hasClass("collapsed");

    // Remove all state classes first
    this.$middleColumn.removeClass(
      "left-collapsed right-collapsed both-collapsed"
    );

    if (leftCollapsed && rightCollapsed) {
      this.$middleColumn.addClass("both-collapsed");
    } else if (leftCollapsed) {
      this.$middleColumn.addClass("left-collapsed");
    } else if (rightCollapsed) {
      this.$middleColumn.addClass("right-collapsed");
    }
  }

  selectNoteCard(card) {
    $(".note-card").removeClass("selected");
    $(card).addClass("selected");
  }

  checkInitialState() {
    // Initialize columns as visible
    this.$leftColumn.removeClass("collapsed");
    this.$rightColumn.removeClass("collapsed");

    // Check mobile state
    if (this.isMobile) {
      this.handleMobileLayout();
    }
  }

  handleMobileLayout() {
    this.$leftColumn.addClass("collapsed");
    this.$rightColumn.addClass("collapsed");
    this.updateMiddleColumn();
  }

  setupResizeObserver() {
    $(window).on("resize", () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== this.isMobile) {
        this.isMobile = newIsMobile;
        if (this.isMobile) {
          this.handleMobileLayout();
        } else {
          this.$leftColumn.removeClass("collapsed");
          this.$rightColumn.removeClass("collapsed");
          this.updateMiddleColumn();
        }
      }
    });
  }
}

// Initialize the application when DOM is ready
$(document).ready(() => {
  new NotebookApp();
});
