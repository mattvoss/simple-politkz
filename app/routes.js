var mysql = require('mysql'),
    async = require('async');

module.exports = function(app, config) {
  var pool  = mysql.createPool({
        connectionLimit : 10,
        host     : config.get("mysql:host"),
        user     : config.get("mysql:username"),
        password : config.get("mysql:password"),
        database : config.get("mysql:database"),
        debug    : config.get("mysql:debug")
      });

  var getSim = function(req, res) {
    pool.getConnection(function(err, connection) {
      async.waterfall([
        function(callback){
          connection.query(
            'SELECT *, UNIX_TIMESTAMP(time) as unixtime FROM sim WHERE state = ? AND chart = ? ORDER BY time ASC',
            [
              req.params.state,
              req.params.chart
            ],
            function(err, rows) {
              callback(null, {sims: rows});
            }
          );
        },
        function(obj, callback){
          var sql = 'SELECT  ' +
              '  time,  ' +
              '  demProbRaw,  ' +
              '  @x:=Round((9*@x+demProbRaw)/10,2) as ExpMovingAvg  ' +
              'FROM (SELECT * FROM sim WHERE state = ? AND chart = ? ORDER BY time DESC LIMIT 50) AS sub  ' +
              'JOIN (  ' +
              '  SELECT @x:=1  ' +
              ') AS dummy  ' +
              'ORDER BY time ASC';
          connection.query(
            sql,
            [
              req.params.state,
              req.params.chart
            ],
            function(err, rows) {
              if (err) console.log(err);
              obj.topline = {
                "demPct": rows[rows.length-1].ExpMovingAvg.toFixed(2),
                "repPct": (100 - rows[rows.length-1].ExpMovingAvg).toFixed(2)
              };
              callback(null, obj);
            }
          );
        },
        function(obj, callback) {
          var sql ="SELECT " +
              "(SELECT UNIX_TIMESTAMP(time) FROM sim WHERE state = ? AND chart = ? ORDER BY time ASC LIMIT 1) as 'first',  " +
              "(SELECT UNIX_TIMESTAMP(time) FROM sim WHERE state = ? AND chart = ? ORDER BY time DESC LIMIT 1) as 'last'  ";
          connection.query(
            sql,
            [
              req.params.state,
              req.params.chart,
              req.params.state,
              req.params.chart
            ],
            function(err, rows) {
              if (err) console.log(err);
              obj.firstDate = rows[0].first;
              obj.lastDate = rows[0].last;
              callback(null, obj);
            }
          );
        }
      ],
      function (err, result) {
        if (err) console.log(err);
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.write(JSON.stringify(result), 'utf-8');
        res.end('\n');
        connection.release();
      });
    });
  };

  var getSimStart = function(req, res) {
    pool.getConnection(function(err, connection) {
      async.waterfall([
        function(callback){
          connection.query(
            'SELECT *, UNIX_TIMESTAMP(time) as unixtime FROM sim WHERE state = ? AND chart = ? AND time >= FROM_UNIXTIME(?) ORDER BY time ASC',
            [
              req.params.state,
              req.params.chart,
              req.params.start
            ],
            function(err, rows) {
              var numPoints = 2 * Math.round(logslider(rows.length) / 2),
                  mod = Math.round(rows.length / numPoints);
              var i = 1;
              //console.log(rows.length, numPoints, mod);
              async.filter(rows,
                function(item, cb) {
                  var use =  false;
                  if (i % mod === 0) {
                    use = true;
                  }
                  i++;
                  cb(use);
                },
                function(results){
                  callback(null, {sims: results});
                }
              );
            }
          );
        },
        function(obj, callback){
          var sql = 'SELECT  ' +
              '  time,  ' +
              '  demProbRaw,  ' +
              '  @x:=Round((9*@x+demProbRaw)/10,2) as ExpMovingAvg  ' +
              'FROM (SELECT * FROM sim WHERE state = ? AND chart = ? ORDER BY time DESC LIMIT 50) AS sub  ' +
              'JOIN (  ' +
              '  SELECT @x:=1  ' +
              ') AS dummy  ' +
              'ORDER BY time ASC';
          connection.query(
            sql,
            [
              req.params.state,
              req.params.chart
            ],
            function(err, rows) {
              if (err) console.log(err);
              obj.topline = {
                "demPct": rows[rows.length-1].ExpMovingAvg.toFixed(2),
                "repPct": (100 - rows[rows.length-1].ExpMovingAvg).toFixed(2)
              };
              callback(null, obj);
            }
          );
        },
        function(obj, callback) {
          var sql ="SELECT "+
              "(SELECT UNIX_TIMESTAMP(time) FROM sim WHERE state = ? AND chart = ? ORDER BY time ASC LIMIT 1) as 'first',  "+
              "(SELECT UNIX_TIMESTAMP(time) FROM sim WHERE state = ? AND chart = ? ORDER BY time DESC LIMIT 1) as 'last'  ";
          connection.query(
            sql,
            [
              req.params.state,
              req.params.chart,
              req.params.state,
              req.params.chart
            ],
            function(err, rows) {
              if (err) console.log(err);
              obj.firstDate = rows[0].first;
              obj.lastDate = rows[0].last;
              callback(null, obj);
            }
          );
        }
      ],
      function (err, result) {
        if (err) console.log(err);
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.write(JSON.stringify(result), 'utf-8');
        res.end('\n');
        connection.release();
      });
    });
  };

  var getSimRange = function(req, res) {
    //console.log("Get Simulation Range");
    pool.getConnection(function(err, connection) {
      async.waterfall([
        function(callback){
          var table = "sim";

          if (req.params.partisan > 0) {
            table += Math.abs(req.params.partisan) + "r";
          } else if (req.params.partisan < 0) {
            table += Math.abs(req.params.partisan) + "d";
          }
          connection.query(
            'SELECT *, UNIX_TIMESTAMP(time) as unixtime FROM ?? WHERE state = ? AND chart = ? AND time BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?) ORDER BY time ASC',
            [
              table,
              req.params.state,
              req.params.chart,
              req.params.start,
              req.params.end
            ],
            function(err, rows) {
              var numPoints = 2 * Math.round(logslider(rows.length) / 2),
                  mod = Math.round(rows.length / numPoints);
              var i = 1;
              //console.log("Records:", rows.length);
              async.filter(rows,
                function(item, cb) {
                  var use =  false;
                  if (i % mod === 0) {
                    use = true;
                  }
                  i++;
                  cb(use);
                },
                function(results){
                  callback(null, {sims: results});
                }
              );
            }
          );
        },
        function(obj, callback){
          var sql = 'SELECT  ' +
              '  time,  ' +
              '  demProbRaw,  ' +
              '  @x:=Round((9*@x+demProbRaw)/10,2) as ExpMovingAvg  ' +
              'FROM (SELECT * FROM ?? WHERE state = ? AND chart = ? AND time BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?) ORDER BY time DESC) AS sub  ' +
              'JOIN (  ' +
              '  SELECT @x:=1  ' +
              ') AS dummy  ' +
              'ORDER BY time ASC',
              table = "sim";

          if (req.params.partisan > 0) {
            table += Math.abs(req.params.partisan) + "r";
          } else if (req.params.partisan < 0) {
            table += Math.abs(req.params.partisan) + "d";
          }
          connection.query(
            sql,
            [
              table,
              req.params.state,
              req.params.chart,
              req.params.start,
              req.params.end
            ],
            function(err, rows) {
              if (err) console.log(err);
              obj.topline = {
                "demPct": rows[rows.length-1].ExpMovingAvg.toFixed(2),
                "repPct": (100 - rows[rows.length-1].ExpMovingAvg).toFixed(2)
              };
              callback(null, obj);
            }
          );
        },
        function(obj, callback) {
          var sql ="SELECT "+
              "(SELECT UNIX_TIMESTAMP(time) FROM ?? WHERE state = ? AND chart = ? ORDER BY time ASC LIMIT 1) as 'first',  "+
              "(SELECT UNIX_TIMESTAMP(time) FROM ?? WHERE state = ? AND chart = ? ORDER BY time DESC LIMIT 1) as 'last'  ",
              table = "sim";

          if (req.params.partisan > 0) {
            table += Math.abs(req.params.partisan) + "r";
          } else if (req.params.partisan < 0) {
            table += Math.abs(req.params.partisan) + "d";
          }
          connection.query(
            sql,
            [
              table,
              req.params.state,
              req.params.chart,
              table,
              req.params.state,
              req.params.chart
            ],
            function(err, rows) {
              if (err) console.log(err);
              obj.firstDate = rows[0].first;
              obj.lastDate = rows[0].last;
              callback(null, obj);
            }
          );
        }
      ],
      function (err, result) {
        if (err) console.log(err);
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.write(JSON.stringify(result), 'utf-8');
        res.end('\n');
        connection.release();
      });
    });
  };

  var getTopics = function(req, res) {
    pool.getConnection(function(err, connection) {
      connection.query(
        'SELECT DISTINCT topic FROM races',
        function(err, rows) {
          var getRaces = function(topic, callback) {
                connection.query(
                  'SELECT * FROM races WHERE topic = ? ORDER BY state ASC',
                  [
                    topic.topic
                  ],
                  function(err, rows) {
                    topic.races = rows;
                    callback(null);
                  }
                );
              };
          if (err) console.log(err);
          async.each(rows, getRaces, function(err){
            res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.write(JSON.stringify(rows), 'utf-8');
            res.end('\n');
            connection.release();
          });
        }
      );
    });
  };

  var getTopicRaces = function(req, res) {
    pool.getConnection(function(err, connection) {
      connection.query(
        'SELECT * FROM races WHERE topic = ? ORDER BY state ASC',
        [
          req.params.topic
        ],
        function(err, rows) {
          if (err) console.log(err);
          res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
          res.writeHead(200, { 'Content-type': 'application/json' });
          res.write(JSON.stringify(rows), 'utf-8');
          res.end('\n');
          connection.release();
        }
      );
    });
  };

  var getSenatePrediction = function(req, res) {
    var sql = "SELECT "+
          "  count(count) as total, "+
          "  count, "+
          "  winner "+
          "FROM ( "+
          "  SELECT COUNT(id) as count, "+
          "         DATE_FORMAT(time,'%Y-%m-%d %H:%i:00') AS niceDate, "+
          "         CASE WHEN demProbRaw > repProbRaw THEN 'dem' ELSE 'rep' END AS winner "+
          "  FROM sim "+
          "  WHERE topic = '2014-senate' AND time >= '2014-11-02 21:00:00' "+
          "  GROUP BY niceDate, winner "+
          "  ORDER BY niceDate ASC "+
          ") AS sub "+
          "GROUP BY winner, count ";

    pool.getConnection(function(err, connection) {
      connection.query(
        sql,
        null,
        function(err, rows) {
          var senate = {predictions:[]},
              sum = rows.reduce(
                function(prev, current){
                  var count = (current.winner === 'rep') ? current.total : 0;
                  return  +(count) + prev;
                }, 0
              );
          //console.log(sum);
          async.each(
            rows,
            function(row, callback) {
              if (row.winner === 'rep') {
                senate.predictions.push({
                  count: row.count,
                  percent: row.total/sum
                });
              }
              callback();
            },
            function(err){
              //console.log(senate);
              res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
              res.writeHead(200, { 'Content-type': 'application/json' });
              res.write(JSON.stringify(senate), 'utf-8');
              res.end('\n');
              connection.release();
            }
          );
        }
      );
    });
  };

  var getSenatePredictionRange = function(req, res) {
    var sql = "SELECT "+
          "  count(count) as total, "+
          "  count, "+
          "  winner "+
          "FROM ( "+
          "  SELECT COUNT(id) as count, "+
          "         DATE_FORMAT(time,'%Y-%m-%d %H:%i:00') AS niceDate, "+
          "         CASE WHEN demProbRaw > repProbRaw THEN 'dem' ELSE 'rep' END AS winner "+
          "  FROM ?? "+
          "  WHERE topic = '2014-senate' AND time BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?) "+
          "  GROUP BY niceDate, winner "+
          "  ORDER BY niceDate ASC "+
          ") AS sub "+
          "GROUP BY winner, count ",table = "sim";

    if (req.params.partisan > 0) {
      table += Math.abs(req.params.partisan) + "r";
    } else if (req.params.partisan < 0) {
      table += Math.abs(req.params.partisan) + "d";
    }
        table = "sim";

    if (req.params.partisan > 0) {
      table += Math.abs(req.params.partisan) + "r";
    } else if (req.params.partisan < 0) {
      table += Math.abs(req.params.partisan) + "d";
    }
    pool.getConnection(function(err, connection) {
      connection.query(
        sql,
        [
          table,
          req.params.start,
          req.params.end
        ],
        function(err, rows) {
          var senate = {predictions:[]},
              sum = rows.reduce(
                function(prev, current){
                  var count = (current.winner === 'rep') ? current.total : 0;
                  return  +(count) + prev;
                }, 0
              );
          //console.log(sum);
          async.each(
            rows,
            function(row, callback) {
              if (row.winner === 'rep') {
                senate.predictions.push({
                  count: row.count,
                  percent: row.total/sum
                });
              }
              callback();
            },
            function(err){
              senate.start = req.params.start;
              senate.end = req.params.end;
              //console.log(senate);
              res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
              res.writeHead(200, { 'Content-type': 'application/json' });
              res.write(JSON.stringify(senate), 'utf-8');
              res.end('\n');
              connection.release();
            }
          );
        }
      );
    });
  };

  // api ---------------------------------------------------------------------

  app.get('/api/:state/:chart', getSim);
  app.get('/api/:state/:chart/:start', getSimStart);
  app.get('/api/:state/:chart/:partisan/:start/:end', getSimRange);
  app.get('/api/topics', getTopics);
  app.get('/api/:topic', getTopicRaces);
  app.get('/prediction/senate', getSenatePrediction);
  app.get('/prediction/senate/:partisan/:start/:end', getSenatePredictionRange);

  // application -------------------------------------------------------------
  app.get('*', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
  });
};

var logslider = function(position) {
  // position will be between 0 and 5000
  var minp = 0;
  var maxp = 25000;

  // The result should be between 40 an 80
  var minv = Math.log(30);
  var maxv = Math.log(50);

  // calculate adjustment factor
  var scale = (maxv-minv) / (maxp-minp);

  return Math.exp(minv + scale*(position-minp));
};
