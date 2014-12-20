/*  ==============================================================
    Include required packages
=============================================================== */

var pollster = require('pollster'),
    gauss = require('gauss'),
    moment = require('moment'),
    mysql = require('mysql'),
    async = require('async'),
    crypto = require('crypto'),
    CronJob = require('cron').CronJob,
    nconf = require('nconf'),
    page = 1, connection,
    job = new CronJob({
      cronTime: '00 00,30 * * * *',
      onTick: function() {
        getRaces();
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

var getRaces = function() {
  if (moment().isBefore('2014-11-05T20:00:00+00:00')) {
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM races ORDER BY id ASC', function(err, rows) {
        var updateRace = function(race, callback) {
          var finished = function() {
                callback();
              }
          console.log("State: ", race.state);
          console.log("Topic: ", race.topic);
          console.log("Date: ", race.after);
          console.log("------------------");
          getPoll(page, race, finished);
        };

        var getPoll = function(pollPage, race, cb0) {
          var pollPage = pollPage || 1;

          var response = function(poll, cb1) {
            var question = function(question, cb2) {
              if (question.topic === race.topic && question.chart === race.chart) {
                var data  = {
                      id: null,
                      pollsterId: poll.id,
                      pollster: poll.pollster,
                      topic: question.topic,
                      start: poll.start_date,
                      end: poll.end_date,
                      state: question.state,
                      observations: question.subpopulations[0].observations,
                      moe: question.subpopulations[0].margin_of_error || 0,
                      republican: null,
                      democrat: null
                    };
                var sub = function(sub, cb3) {
                  var dem = race.demSub || "Dem";
                  console.log("demSub:", race.demSub);
                  if (sub.party === dem) {
                    data.democrat = sub.value;
                  } else if (sub.party === "Rep") {
                    data.republican = sub.value;
                  }
                  cb3();
                };
                async.each(question.subpopulations[0].responses, sub, function(err) {
                  console.log("Topic: ", question.topic);
                  console.log("Pollster: ", poll.pollster);
                  console.log("State Date: ", poll.start_date);
                  console.log("End Date: ", poll.end_date);
                  console.log("State: ", question.state);
                  console.log("Type: ", question.subpopulations[0].name);
                  console.log("MOE: ", data.moe);
                  console.log("D: ", data.democrat);
                  console.log("R: ", data.republican);
                  console.log("------------------");

                  connection.query('SELECT id FROM polls WHERE pollsterId = ?', [data.pollsterId], function(err, rows) {
                    if (rows.length === 0) {
                      connection.query('INSERT INTO polls SET ?', data, function(err, result) {
                        console.log(err);
                        console.log(result);
                        cb2();
                      });
                    } else {
                      cb2();
                    }
                  });

                });

              } else {
                cb2();
              }
            };

            async.each(poll.questions, question, function(err) {
              cb1();
            });
          };

          pollster.polls({
            state: race.state,
            topic: race.topic,
            page: pollPage,
            after: race.after
          }, function(resp){
            if (resp.length != 0) {
              async.each(resp, response, function(err){
                pollPage++;
                getPoll(pollPage, race, cb0);
              });
            } else {
              cb0();
            }
          });
        };

        //console.log(rows);
        async.each(rows, updateRace, function(err){
          console.log("update completed");
          connection.release();
          //completed();
        });
      });
    });
  } else {
    end();
  }
};


function completed() {
  job.stop();
  console.log('Terminating!');
  pool.end(function (err) {
    // all connections in the pool have ended
  });
}

function checksum (str, algorithm, encoding) {
  return crypto
    .createHash(algorithm || 'md5')
    .update(str, 'utf8')
    .digest(encoding || 'hex')
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

