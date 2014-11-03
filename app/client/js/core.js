angular.module('politkz', ['politkzController', 'politkzService'])
  .directive('onLastRepeat', function() {
    return function(scope, element, attrs) {
      if (scope.$last) setTimeout(function(){
          scope.$emit('onRepeatLast', element, attrs);
      }, 1);
    };
  })
  .filter('split', function() {
    return function(input, splitChar, splitIndex) {
      // do some bounds checking here to ensure it has that index
      return input.split(splitChar)[splitIndex];
    };
  })
  .filter('capitalize', function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
    };
  });
