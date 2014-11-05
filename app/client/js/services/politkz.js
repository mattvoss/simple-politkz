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
        return $http.get('/api/' + race.state + '/' + race.topic);
      },
      getRaceDataStart : function(race) {
        return $http.get('/api/' + race.state + '/' + race.topic + '/' + race.start);
      },
      getSenatePrediction : function() {
        return $http.get('/prediction/senate');
      },
    };
  }]);
