/**
 * @fileoverview Behavior for the Date Picker Widget.
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @todo Implement class.
 */

/**
 * @classdesc Implements behavior for the Date Picker widget.
 * @todo Existing code is non-functional reference from old implementation - implement new version by either adapting and reusing or using new solution.
 */
class DatePicker {
  constructor() {}

  initialize() {
    let pythonDateFormat = "YYYY-MM-DD";
    let momentStartDate = moment(trackerData["start_date"], pythonDateFormat);
    let momentEndDate = moment(trackerData["end_date"], pythonDateFormat);
    let startDate = momentStartDate.toDate();
    let endDate = momentEndDate.toDate();

    let postfreqStartDate = moment(
      trackerData["start_date"],
      pythonDateFormat
    ).toDate();
    let postfreqEndDate = moment(
      trackerData["end_date"],
      pythonDateFormat
    ).toDate();

    let dateRangePickerElement = $("button.date-range-picker");
    dateRangePickerElement.html(
      momentStartDate.format("DD MMM, YYYY") +
        " - " +
        momentEndDate.format("DD MMM, YYYY")
    );
    dateRangePickerElement.daterangepicker(
      {
        opens: "left",
        minYear: 1995,
        showDropdowns: true,
        startDate: momentStartDate.format("L").toString(),
        endDate: momentEndDate.format("L").toString(),
      },
      function (start, end, label) {
        let latestDateRange =
          start.format("DD MMM, YYYY") + " - " + end.format("DD MMM, YYYY");
        dateRangePickerElement.text(latestDateRange);
        console.log(
          "A new date selection was made: " + latestDateRange,
          start,
          end
        );
        dateRangeChanged(start, end);
      }
    );
    dateRangePickerElement.on("hide.daterangepicker", function () {
      dateRangePickerElement.removeClass("active");
    });
  }

  dateRangeChanged(momentStartDate, momentEndDate) {
    console.log("date range change listener");
    startDate = momentStartDate.toDate();
    endDate = momentEndDate.toDate();
    postfreqStartDate = momentStartDate.toDate();
    postfreqEndDate = momentEndDate.toDate();
    postingFrequencyChart.drawLineChart(
      trackerData.tracker_videos,
      formatter,
      postfreqStartDate,
      postfreqEndDate
    );
    getUpdatedTrackerData(momentStartDate, momentEndDate);
    getPostingFreqChart();
    getVideosDailyViewChart();
  }
}
