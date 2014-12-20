angular.module('politkzController', ['tc.chartjs', 'angularMoment', 'ui.select', 'nouislider'])

  // inject the Todo service factory into our controller
  .controller('mainController', ['$scope','$http','Elections', function($scope, $http, Elections) {
    $scope.formData = {};
    $scope.loading = true;
    $scope.currentState = false;
    $scope.currentType = false;
    $scope.topline = false;
    $scope.sim = false;
    $scope.showPred = false;
    $scope.showDateSlider = false;
    $scope.sliderVal = false;
    $scope.date = false;
    $scope.dateVals = [];
    $scope.selectedState = {
      selected: []
    };
    $scope.races = [];
    $scope.partisan = {
      current: null,
      start: -10,
      end: 10,
      from: 0,
      range: {
        'min': -10,
        '15%': -5,
        '30%': -2,
        '50%': 0,
        '70%': 2,
        '85%': 5,
        'max': 10
      },
      pips: {
        mode: 'values',
        values: [-10, -5, -2, 0, 2, 5, 10],
        density: 5,
        stepped: true,
        format: {
          to: function(value) {
            var txt = "0";
            if (value > 0) {
              txt = "Rep +" + value + "%";
            } else if (value < 0) {
              txt = "Dem +" + Math.abs(value) + "%";
            }
            return txt;
          }
        }
      },
      tooltipUpper: function (value) {
        var txt = "0";
        if (value > 0) {
          txt = "Rep +" + value + "%";
        } else if (value < 0) {
          txt = "Democrat +" + Math.abs(value) + "%";
        }
        $(this).siblings().find(".tooltip").parent().remove();
        $(this).html(
          '<div class="tooltip right" role="tooltip" style="opacity:1"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
          txt +
          '</div></div>'
        );
        $(this).find('.tooltip').tooltip({
          'selector': '',
          'placement': 'top',
          'container':'body'
        });
      },
      tooltipLower: function (value) {
        var txt = "0";
        if (value > 0) {
          txt = "Republican +" + value + "%";
        } else if (value < 0) {
          txt = "Democrat +" + Math.abs(value) + "%";
        }
        $(this).siblings().find(".tooltip").parent().remove();
        $(this).html(
          '<div class="tooltip left" role="tooltip" style="opacity:1"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
          txt +
          '</div></div>'
        );
        $(this).find('.tooltip').tooltip({
          'selector': '',
          'placement': 'top',
          'container':'body'
        });
      },
      change: function(entry, value) {
        if ($scope.currentType) {
          var race = $scope.currentState;
          race.start = parseInt($scope.date.from, 10);
          race.end = parseInt($scope.date.to, 10);
          race.partisan = value;
          Elections.getRaceDataRange(race).success(function(data) {
            gotRaceData(data);
          });
        } else {
          Elections.getSenatePredictionRange({
            start: $scope.date.from,
            end: $scope.date.to,
            partisan: value
          }).success(function(data) {
            renderSenateSeats(data);
          });
        }
      }
    };

    var getRange = function(value) {
          var race = $scope.currentState,
            times = value.split(";");
          race.start = parseInt(times[0], 10);
          race.end = parseInt(times[1], 10);
          race.partisan = $scope.partisan.current;
          Elections.getRaceDataRange(race).success(function(data) {
            gotRaceData(data);
          });
        },
        gotRaceData = function(data) {
          $scope.showPred = false;
          $scope.sim = data.sims;
          $scope.topline = data.topline;
          $scope.loading = false;
          $scope.sliderVal = $scope.currentState.start.toString()+";"+data.lastDate.toString();
          $scope.date.start = data.firstDate;
          $scope.date.end = data.lastDate;
          $scope.date.from = $scope.currentState.start;
          $scope.date.to = data.lastDate;
          var dem = {
                label: 'Democrat',
                fillColor: 'rgba(255,51,102,0.2)',
                strokeColor: 'rgba(255,51,102,1)',
                pointColor: 'rgba(255,51,102,1)',
                pointStrokeColor: '#fff',
                pointHighlightFill: '#fff',
                pointHighlightStroke: 'rgba(255,51,102,1)',
                data: []
              },
              rep = {
                label: 'Republican',
                fillColor: 'rgba(51,102,255,0.2)',
                strokeColor: 'rgba(51,102,255,1)',
                pointColor: 'rgba(51,102,255,1)',
                pointStrokeColor: '#fff',
                pointHighlightFill: '#fff',
                pointHighlightStroke: 'rgba(51,102,255,1)',
                data: []
              },
              labels = [];
          data.sims.forEach(function(result, index, array) {
            labels.push(moment.utc(result.unixtime*1000).zone(moment().zone()).format("MMM D hh:mm a"));
            dem.data.push(result.demProbRaw.toFixed(2));
            rep.data.push(result.repProbRaw.toFixed(2));


          });
          // Chart.js Data
          $scope.data = {
            labels: labels,
            datasets: [dem, rep]
          };

          // Chart.js Options
          $scope.options =  {

            // Sets telhe chart to be responsive
            responsive: true,

            ///Boolean - Whether grid lines are shown across the chart
            scaleShowGridLines : true,

            //String - Colour of the grid lines
            scaleGridLineColor : "rgba(0,0,0,.05)",

            //Number - Width of the grid lines
            scaleGridLineWidth : 1,

            //Boolean - Whether the line is curved between points
            bezierCurve : true,

            //Number - Tension of the bezier curve between points
            bezierCurveTension : 0.4,

            //Boolean - Whether to show a dot for each point
            pointDot : true,

            //Number - Radius of each point dot in pixels
            pointDotRadius : 4,

            //Number - Pixel width of point dot stroke
            pointDotStrokeWidth : 1,

            //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
            pointHitDetectionRadius : 1,

            //Boolean - Whether to show a stroke for datasets
            datasetStroke : true,

            //Number - Pixel width of dataset stroke
            datasetStrokeWidth : 2,

            //Boolean - Whether to fill the dataset with a colour
            datasetFill : true,

            // Function - on animation progress
            onAnimationProgress: function(){},

            // Function - on animation complete
            onAnimationComplete: function(){},

            legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].strokeColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
          };
        },
        renderSenateSeats = function(data) {
          $scope.showPred = true;
          $scope.showDateSlider = true;
          $scope.loading = false;
          var rep = {
                  label: 'Seats',
                  fillColor: 'rgba(51,102,255,0.2)',
                  strokeColor: 'rgba(51,102,255,1)',
                  pointColor: 'rgba(51,102,255,1)',
                  pointStrokeColor: '#fff',
                  pointHighlightFill: '#fff',
                  pointHighlightStroke: 'rgba(51,102,255,1)',
                  data: []
                },
                labels = [];
            data.predictions.forEach(function(result, index, array) {
              labels.push(30+result.count);
              rep.data.push(result.percent.toFixed(2)*100);
            });
            // Chart.js Data
            $scope.prediction = {
              labels: labels,
              datasets: [rep]
            };

            $scope.predOptions =  {

              // Sets the chart to be responsive
              responsive: true,

              //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
              scaleBeginAtZero : true,

              //Boolean - Whether grid lines are shown across the chart
              scaleShowGridLines : true,

              //String - Colour of the grid lines
              scaleGridLineColor : "rgba(0,0,0,.05)",

              //Number - Width of the grid lines
              scaleGridLineWidth : 1,

              //Boolean - If there is a stroke on each bar
              barShowStroke : true,

              //Number - Pixel width of the bar stroke
              barStrokeWidth : 2,

              //Number - Spacing between each of the X value sets
              barValueSpacing : 5,

              //Number - Spacing between data sets within X values
              barDatasetSpacing : 1,

              //String - A legend template
              legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].strokeColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
            };
            $scope.date = {
              start: moment('2014-06-01T00:00:00+00:00').unix(),
              end: moment('2014-11-05T12:00:00+00:00').unix(),
              from: data.start,
              to: data.end,
              pips: {
                mode: 'count',
                values: 6,
                density: 4,
                stepped: true,
                format: {
                  to: function(value) {
                    return moment.utc(value*1000).zone(moment().zone()).format("MMM D hh:mm a");
                  }
                }
              },
              tooltipUpper: function (value) {
                $(this).siblings().find(".tooltip").parent().remove();
                $(this).html(
                  '<div class="tooltip right" role="tooltip" style="opacity:1"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
                  moment.utc(value*1000).zone(moment().zone()).format("MMM D hh:mm a") +
                  '</div></div>'
                );
                $(this).find('.tooltip').tooltip({
                  'selector': '',
                  'placement': 'top',
                  'container':'body'
                });
              },
              tooltipLower: function (value) {
                $(this).siblings().find(".tooltip").parent().remove();
                $(this).html(
                  '<div class="tooltip left" role="tooltip" style="opacity:1"><div class="tooltip-arrow"></div><div class="tooltip-inner">' +
                  moment.utc(value*1000).zone(moment().zone()).format("MMM D hh:mm a") +
                  '</div></div>'
                );
                $(this).find('.tooltip').tooltip({
                  'selector': '',
                  'placement': 'top',
                  'container':'body'
                });
              },
              changeDate: function(entry, value) {
                if ($scope.currentType) {
                  var race = $scope.currentState;
                  race.start = parseInt(value[0], 10);
                  race.end = parseInt(value[1], 10);
                  race.partisan = $scope.partisan.current;
                  Elections.getRaceDataRange(race).success(function(data) {
                    gotRaceData(data);
                  });
                } else {
                  Elections.getSenatePredictionRange({
                    start: value[0],
                    end: value[1],
                    partisan: $scope.partisan.current
                  }).success(function(data) {
                    renderSenateSeats(data);
                  });
                }
              }
            };
        };

    $scope.$on('onRepeatLast', function(scope, element, attrs){
      //$('#menu').waSlideMenu({});
    });

    $scope.typeClick = function($event) {
      $scope.currentType = this.election;
      $scope.races = this.election.races;
      var el = ($event.target.className.indexOf("list-group-item") > -1) ? $event.target : $event.target.parentNode;
      $(el).addClass("active");
      $(el).siblings().removeClass("active");
    };

    $scope.menuClick = function(race, model) {
      $scope.loading = true;
      if (moment().isBefore('2014-11-05T12:00:00+00:00')) {
        race.start = moment().subtract(1, 'week').unix();
        race.end  = moment().unix();
      } else {
        race.start = moment('2014-11-05T12:00:00+00:00').subtract(1, 'week').unix();
        race.end  = moment('2014-11-05T12:00:00+00:00').unix();
      }
      race.partisan = 0;
      race.stateName = Data.states[race.state];
      $scope.currentState = race;
      $scope.partisan.current = 0;
      Elections.getRaceDataRange(race).success(function(data) {
        gotRaceData(data);
      });
    };

    // GET =====================================================================
    // when landing on the page, get all election types and show them
    // use the service to get all the election types
    Elections.get().success(function(data) {
      $scope.elections = data;
      $scope.loading = false;
    });

    var senateSeats = {
          start: moment('2014-11-05T12:00:00+00:00').subtract(168, 'hour').unix(),
          end: moment('2014-11-05T12:00:00+00:00').unix(),
          partisan: $scope.partisan.from
        };
    Elections.getSenatePredictionRange(senateSeats).success(function(data) {
      renderSenateSeats(data);
    });

  }]);
