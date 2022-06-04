/**
 * @fileoverview common behaviors for Analytic pages.
 * @author Hayder Al Rubaye
 * @author Mayor Inna Gurung
 * @copyright COSMOS 2021
 */

/**
 * @classdesc Implements general behaviors for the Analytic pages.
 */
class BaseAnalytics {
  constructor() {
    this.figure = document.querySelectorAll(
      "main#content div#dashboard section#visualizations figure.figure"
    );
    this.datePickerButton = document.querySelector(
      "main#content div#dashboard section#navigation div#navigationWrapper button#datePickerButton"
    );
    this.datePickerMenu = document.querySelector(
      "main#content div#dashboard section#navigation div#navigationWrapper button#datePickerButton div#datePicker"
    );
    this.sideMenuButton = document.querySelector("div#menu");
    this.sideMenu = document.querySelector("div#sideMenu");
    this.submenu = document.querySelectorAll(".submenu");
    this.timeoutClass = "timeout";
    this.displayedClass = "displayed";
    this.selectedClass = "selected";
    this.disabledClass = "disabled";
    this.activeClass = "active";
    this.submenuClass = "submenu";
    this.reverseClass = "reverse";
    this.selectabelClass = "selectable";
  }

  /** Binds events for the page. */
  initialize() {
    setTimeout(this.timeout.bind(this), 3000);
    this.sideMenuButton.addEventListener(
      "click",
      this.sideMenuButtonClickHandler.bind(this)
    );
    this.datePickerButton.addEventListener(
      "click",
      this.datePickerButtonClickHandler.bind(this)
    );

    window.addEventListener("click", this.windowClickHandler.bind(this));
  }

  /**
   * Set loading icon for figures. This is in effect until the setTimeout expires.
   * @todo This needs to be called when the data is loaded, not when the arbitrary timer expires.
   */
  timeout() {
    for (let i = 0; i < this.figure.length; i++) {
      this.figure[i].classList.add(this.timeoutClass);
    }
  }

  /**
   * Handles the date picker.
   * @param {Event} event Default click event.
   */
  datePickerButtonClickHandler(event) {
    this.hideAllSubmenus();
    this.datePickerMenu.parentElement.classList.add(this.activeClass);
    this.datePickerMenu.classList.add(this.displayedClass);
    event.stopPropagation();
  }

  /**
   * Handles clicks to the side menu button.
   * @param {Event} event Default click event.
   */
  sideMenuButtonClickHandler(event) {
    this.hideAllSubmenus();
    this.sideMenu.parentElement.classList.add(this.activeClass);
    this.sideMenu.classList.add(this.displayedClass);
    event.stopPropagation();
  }

  /**
   * Closes sub menus when clicking within the window.
   * @param {Event} event Default click event.
   */
  windowClickHandler(event) {
    this.hideAllSubmenus();
  }

  /**
   * Closes all submenus.
   */
  hideAllSubmenus() {
    for (let i = 0; i < this.submenu.length; i++) {
      this.submenu[i].classList.remove(this.displayedClass);
      if (this.submenu[i].parentElement.classList.contains(this.activeClass))
        this.submenu[i].parentElement.classList.remove(this.activeClass);
    }
  }
}
