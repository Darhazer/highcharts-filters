(function (H) {
    "use strict";

    if(!Array.isArray) {
        Array.isArray = function (vArg) {
            return Object.prototype.toString.call(vArg) === "[object Array]";
        };
    }

    var low_pass = function(data, smoothing) {
      var result = [];
      var value = data[0];
      smoothing = smoothing || 3;
      result[0] = data[0];

      for (var i = 1, l = data.length; i < l; i += 1) {
        var currentValue = data[i];
        value += (currentValue - value) / smoothing;
        result.push(value);
      }
      return result;
    };

    var median = function(data, window_size) {
      var getMiddleValue = function(arr) {
        var middle;
        var sorted = arr.slice().sort(function(a,b){
          return a - b;
        });

        if (sorted.length % 2 === 0) {
          middle = sorted.length / 2;
          return (sorted[middle - 1] + sorted[middle]) / 2;
        }

         middle = (sorted.length - 1) / 2;
         return sorted[middle];
      };

      window_size = window_size || 3;

      if (data.length < window_size) {
        return data;
      }

      var result = [];
      var window = [];

      window.push(data[0]);
      for (var i = 0; i < data.length; i += 1) {
          if (data.length - 1 >= i + Math.floor(window_size / 2)) {
            window.push(data[i + Math.floor(window_size / 2)]);
          }
          result.push(getMiddleValue(window));
          if (i >= Math.floor(window_size / 2)) {
            window.shift();
          }
      }
      return result;
    };

    var apply = function(data, threshold, filter) {
      var xValues = [], size = data.length, result = [];
      for (var i = 0; i < size; i += 1) {
        xValues.push(data[i][1]);
      }

      var modifiedValues = filter(xValues, threshold);

      for (var i = 0; i < size; i += 1) {
        result.push([data[i][0], modifiedValues[i]]);
      }
      return result;
    };

    H.wrap(H.Series.prototype, 'setData', function (proceed) {

        var opt = this.chart.options;
        if (opt.hasOwnProperty('filters')) {

            if (!isNaN(parseFloat(arguments[1][0])) && isFinite(arguments[1][0])) {
              // Data is array of numerical values.
              var point_x = typeof opt.pointStart != 'undefined' ? opt.pointStart : 0; // First X
              var pointInterval = typeof opt.pointInterval != 'undefined' ? opt.pointInterval : 1;
              // Turn it into array of arrays with two values.
              for (var i = 0, len = arguments[1].length; i < len; i++) {
                arguments[1][i] = [point_x, arguments[1][i]];
                point_x += pointInterval;
              }
            }

            if (Array.isArray(arguments[1][0]) && arguments[1][0].length == 2) {
                // Data is array of arrays with two values
                if (opt.filters.hasOwnProperty('median')) {
                  arguments[1] = apply(arguments[1], opt.filters.median.threshold, median);
                }
                if (opt.filters.hasOwnProperty('lowpass')) {
                  arguments[1] = apply(arguments[1], opt.filters.lowpass.threshold, low_pass);
                }
            } else {
                console.log("Filter Error: Invalid data format! Note: Array of objects and Range Series are not supported");
            }
        }
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
    });

}(Highcharts));
