angular.module('politkzController', ['tc.chartjs', 'angularMoment', 'ui.select'])

  // inject the Todo service factory into our controller
  .controller('mainController', ['$scope','$http','Elections', function($scope, $http, Elections) {
    $scope.formData = {};
    $scope.loading = true;
    $scope.currentState = false;
    $scope.currentType = false;
    $scope.topline = false;
    $scope.sim = false;
    $scope.showPred = false;
    $scope.selectedState = {
      selected: []
    };
    $scope.races = [];

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
      if (moment().isBefore('2014-11-05T20:00:00+00:00')) {
        race.start = moment().subtract(1, 'hour').unix();
      } else {
        race.start = moment('2014-11-05T20:00:00+00:00').subtract(1, 'hour').unix();
      }
      race.stateName = Data.states[race.state];
      $scope.currentState = race;
      Elections.getRaceDataStart(race).success(function(data) {
        $scope.showPred = false;
        $scope.sim = data.sims;
        $scope.topline = data.topline;
        $scope.loading = false;
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
          labels.push(moment.utc(result.unixtime*1000).zone(moment().zone()).format("hh:mm a"));
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

          // Sets the chart to be responsive
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
          pointHitDetectionRadius : 20,

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
      });
    };

    // GET =====================================================================
    // when landing on the page, get all election types and show them
    // use the service to get all the election types
    Elections.get().success(function(data) {
      $scope.elections = data;
      $scope.loading = false;
    });
    Elections.getSenatePrediction().success(function(data) {
      $scope.showPred = true;
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
          labels.push(42+result.count);
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

    });

  }]);
