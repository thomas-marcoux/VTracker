/**
 * @fileoverview Generic utility functions.
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see abbreviateNumber
 */

/**
 * Abbreviate given number.
 * @see {@link https://stackoverflow.com/questions/10599933/convert-long-number-into-abbreviated-string-in-javascript-with-a-special-shortn}
 * @param {int} value Number to abbreviate
 * @returns {string} Value to display
 */
function abbreviateNumber(value) {
  var newValue = value;
  if (value >= 1000) {
    var suffixes = ["", "K", "M", "B", "T"];
    var suffixNum = Math.floor(("" + value).length / 3);
    var shortValue = "";
    for (var precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat(
        (suffixNum != 0
          ? value / Math.pow(1000, suffixNum)
          : value
        ).toPrecision(precision)
      );
      var dotLessShortValue = (shortValue + "").replace(/[^a-zA-Z 0-9]+/g, "");
      if (dotLessShortValue.length <= 2) {
        break;
      }
    }
    if (shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
    newValue = shortValue + suffixes[suffixNum];
  }
  return newValue;
}

/**
 * Fetch data from given parameters.
 * @param {*} query The parameters to send to the data fetching query.
 * @param {*} dataURL The url to use to collect data.
 * @returns {Promise} Promise object.
 */
function fetchData(query, dataURL) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      data: query,
      url: dataURL,
      cache: false,
      dataType: "json",
      headers: { "X-CSRFToken": getCookieByName("csrftoken") },
      success: function (response) {
        resolve(response);
      },
      error: function (error) {
        console.log(error);
        reject(error);
      },
    });
  });
}



/**
 * Update given button's value.
 * @param {Element} sideBarButtonContent The text element of the button to update.
 * @param {string} token Token data.
 * @param {Object} formatFunction Function to use to format the token for display.
 */
function updateSideButton(buttonContent, token, formatFunction = null, default_value = 0) {
  if (typeof token  === 'undefined' || token === null){
    buttonContent.innerHTML = default_value;
  }else{
    buttonContent.innerHTML = formatFunction ? formatFunction(token) : token;
  } 
}

/**
 * Insert the render fetched to the given wrapper.
 * @param {Element} wrapper The figure's parent wrapper.
 * @param {string} url The url to use to collect data.
 * @param {Object} queryParams The parameters to send to the data fetching query.
 */
function insertRender(wrapper, url, queryParams) {
  return new Promise((resolve) => {
    fetchData(queryParams, "/" + url).then((response) => {
      let render = new DOMParser().parseFromString(
        response.render,
        "text/html"
      );
      render.body.childNodes.forEach((child) => {
        wrapper.append(child);
      });
      resolve(response);
    });
  });
}

/**
 * Update the render fetched to the given wrapper.
 * @param {Element} wrapper The figure's parent wrapper.
 * @param {string} url The url to use to collect data.
 * @param {Object} queryParams The parameters to send to the data fetching query.
 */
 function updateRender(wrapper, url, queryParams) {
  return new Promise((resolve) => {
    fetchData(queryParams, "/" + url).then((response) => {
      let render = new DOMParser().parseFromString(
        response.render,
        "text/html"
      );
      wrapper.innerHTML = render.body.innerHTML;
      resolve(response);
    });
  });
}


/**
 * Get requested cookie.
 * @param {string} name Cookie's name.
 * @returns Cookie
 */
window.getCookieByName = function (name) {
  let match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
};
