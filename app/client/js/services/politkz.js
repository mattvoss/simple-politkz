angular.module('politkzService', [])

  // super simple service
  // each function returns a promise object
  .factory('Elections', ['$http',function($http) {
    return {
      get : function() {
        return $http.get('/api/topics');
      },
      getRaces : function(topic) {
        return $http.get('/api/' + topic);
      },
      getRaceData : function(race) {
        return $http.get('/api/' + race.state + '/' + race.chart);
      },
      getRaceDataStart : function(race) {
        return $http.get('/api/' + race.state + '/' + race.chart + '/' + race.start);
      },
      getRaceDataRange : function(race) {
        return $http.get('/api/' + race.state + '/' + race.chart + '/' + race.partisan + '/' + race.start + '/' + race.end);
      },
      getSenatePrediction : function() {
        return $http.get('/prediction/senate');
      },
      getSenatePredictionRange : function(data) {
        return $http.get('/prediction/senate/' + data.partisan + '/' + data.start + '/' + data.end);
      },
    };
  }]);
