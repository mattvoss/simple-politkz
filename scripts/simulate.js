/*  ==============================================================
    Include required packages
=============================================================== */

var pollster = require('pollster'),
    gauss = require('gauss'),
    moment = require('moment'),
    async = require('async'),
    mysql = require('mysql'),
    CronJob = require('cron').CronJob,
    cdf = require('./cdf'),
    nconf = require('nconf'),
    min_σ  = 0.0,
    page = 1,
    runs = 100,
    job = new CronJob({
      cronTime: '00 */10 * * * *',
      onTick: function() {
        init();
      },
      start: false
    });

if (process.argv[2]) {
  if (fs.lstatSync(process.argv[2])) {
    configFile = require(process.argv[2]);
  } else {
    configFile = process.cwd() + '/../config/settings.json';
  }
} else {
    configFile = process.cwd()+'/../config/settings.json';
}

config = nconf
  .argv()
  .env("__")
  .file({ file: configFile });

var init = function() {
  if (moment().isBefore('2014-11-05T20:00:00+00:00')) {
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM races ORDER BY id ASC', function(err, rows) {
        var finished = function() {
              console.log("update completed");
              connection.release();
            };

        var getLastDay = function(race, callback) {
          var done = function() {
                callback();
              };
          connection.query('SELECT * FROM polls WHERE topic = ? AND state = ? ORDER BY END DESC LIMIT 1', [race.topic, race.state], function(err, result) {
            if (err) console.log(err);
            //console.log(result);
            var lastDay = moment(result[0].end);
            //console.log(lastDay);
            getPolls(lastDay, race, done);
          });
        };

        var getPolls = function(lastDay, race, cb) {
          connection.query('SELECT * FROM polls WHERE topic = ? AND state = ? ORDER BY END ASC', [race.topic, race.state], function(err, results) {
            if (err) console.log(err);
            //console.log(results);
            montecarlo(results, lastDay, race, cb);
          });
        };


        var montecarlo = function (results, lastDay, race, cb) {
          var s = {
              'democrat': 0.00,
              'republican': 0.00,
              'N': 0,
              'σ': 0.00,
              'democratPerc': 0.00,
              'democratProbability': 0.00
              },
              votes = {
                  'd':0,
                  'r':0,
                  'totalvotes':0,
                  'dperc':0.0
              },
              wins = {
                state: race.state,
                topic: race.topic,
                year: race.year,
                dem: 0,
                demProbRaw: 0,
                demProb: 0,
                rep: 0,
                repProbRaw: 0,
                repProb: 0
              };

          var update = function(poll, cb0) {
            var pollDay = moment(poll.end),
                diff = lastDay.diff(pollDay, 'days'),
                //decayedVotes = poll.observations * Math.pow((1 - 0.6), diff),
                decayedVotes = poll.observations * Math.exp(-diff/0.5),
                factor = getRandomArbitary (-poll.moe, poll.moe),
                newDPerc = poll.democrat + factor,
                newRPerc = poll.republican - factor,
                democratVotes = newDPerc * decayedVotes / 100.0,
                republicanVotes = newRPerc * decayedVotes / 100.0;
            s.democrat += democratVotes;
            s.republican += republicanVotes;
            s.N += democratVotes + republicanVotes;

            s.democratPerc = s.democrat / s.N;
            s.σ = Math.sqrt((s.democratPerc - (s.democratPerc * s.democratPerc)) / s.N);
            if (min_σ != 0.0 && s.σ < min_σ) {
                s.σ = min_σ;
            }
            s.democratProbability = cdf.prOverX(0.50, s.democratPerc, s.σ);
            cb0(null, s);
          };

          async.times(runs, function(n, next){
            s.democrat = 0;
            s.republican = 0;
            s.N = 0;
            async.map(results, update, function(err, results){
              //console.log(s.democratPerc);
              if (s.democratPerc >= 0.50) {
                wins.dem += 1;
              } else {
                wins.rep += 1;
              }
              wins.demProbRaw += s.democratProbability;
              wins.demProb = wins.demProbRaw / (wins.dem + wins.rep);
              wins.repProbRaw += 1 - s.democratProbability;
              wins.repProb = wins.repProbRaw / (wins.dem + wins.rep);
              next(err, null);
            });
          }, function(err, users) {
            //console.log(wins);
            connection.query('INSERT INTO sim SET ?', wins, function(err, result) {
              //console.log(err);
              //console.log(result);
              cb();
            });
          });
        };

        async.each(rows, getLastDay, function(err){
          finished();
        });
      });
    });
  } else {
    end();
  }
};

function getRandomArbitary (min, max) {
    return Math.random() * (max - min) + min;
}

function extend(from, to) {
    if (from == null || typeof from != "object") return from;
    if (from.constructor != Object && from.constructor != Array) return from;
    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
        from.constructor == String || from.constructor == Number || from.constructor == Boolean)
        return new from.constructor(from);

    to = to || new from.constructor();

    for (var name in from)
    {
        to[name] = typeof to[name] == "undefined" ? extend(from[name], null) : to[name];
    }

    return to;
}

function end() {
  job.stop();
  console.log('Terminating!');
  pool.end(function (err) {
    // all connections in the pool have ended
  });
}

if (moment().isBefore('2014-11-05T20:00:00+00:00')) {
  var pool  = mysql.createPool({
      connectionLimit : 10,
      host     : config.get("mysql:host"),
      user     : config.get("mysql:username"),
      password : config.get("mysql:password"),
      database : config.get("mysql:database"),
      debug    : config.get("mysql:debug")
    });

  job.start();
}
