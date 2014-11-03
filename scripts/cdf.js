exports.prOverX = function (x, μ, σ ) {
    return 1.0 - this.cdf(x, μ, σ);
}

// cdf returns the probability of a random variable (μ, σ) being less than x.
exports.cdf =  function (x, μ, σ) {
    return 0.5 * (1.0 + this.erf((x-μ)/(σ*Math.sqrt(2.0))));
}

exports.erf = function(x) {
    // constants
    var a1 =  0.254829592;
    var a2 = -0.284496736;
    var a3 =  1.421413741;
    var a4 = -1.453152027;
    var a5 =  1.061405429;
    var p  =  0.3275911;

    // Save the sign of x
    var sign = 1;
    if (x < 0) {
        sign = -1;
    }
    x = Math.abs(x);

    // A&S formula 7.1.26
    var t = 1.0/(1.0 + p*x);
    var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);

    return sign*y;
}

