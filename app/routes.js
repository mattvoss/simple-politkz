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
            'SELECT *, UNIX_TIMESTAMP(time) as unixtime FROM sim WHERE state = ? AND topic = ? ORDER BY time ASC',
            [
              req.params.state,
              req.params.topic
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
              'FROM (SELECT * FROM sim WHERE state = ? AND topic = ? ORDER BY time DESC LIMIT 50) AS sub  ' +
              'JOIN (  ' +
              '  SELECT @x:=1  ' +
              ') AS dummy  ' +
              'ORDER BY time ASC';
          connection.query(
            sql,
            [
              req.params.state,
              req.params.topic
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
            'SELECT *, UNIX_TIMESTAMP(time) as unixtime FROM sim WHERE state = ? AND topic = ? AND time >= FROM_UNIXTIME(?) ORDER BY time ASC',
            [
              req.params.state,
              req.params.topic,
              req.params.start
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
              'FROM (SELECT * FROM sim WHERE state = ? AND topic = ? ORDER BY time DESC LIMIT 50) AS sub  ' +
              'JOIN (  ' +
              '  SELECT @x:=1  ' +
              ') AS dummy  ' +
              'ORDER BY time ASC';
          connection.query(
            sql,
            [
              req.params.state,
              req.params.topic
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
    pool.getConnection(function(err, connection) {
      async.waterfall([
        function(callback){
          connection.query(
            'SELECT *, UNIX_TIMESTAMP(time) as unixtime FROM sim WHERE state = ? AND topic = ? AND time BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?) ORDER BY time ASC',
            [
              req.params.state,
              req.params.topic,
              req.params.start,
              req.params.end
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
              'FROM (SELECT * FROM sim WHERE state = ? AND topic = ? ORDER BY time DESC LIMIT 50) AS sub  ' +
              'JOIN (  ' +
              '  SELECT @x:=1  ' +
              ') AS dummy  ' +
              'ORDER BY time ASC';
          connection.query(
            sql,
            [
              req.params.state,
              req.params.topic
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
          "WHERE count < 15 "+
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
          console.log(sum);
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
              console.log(senate);
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

  app.get('/api/:state/:topic', getSim);
  app.get('/api/:state/:topic/:start', getSimStart);
  app.get('/api/:state/:topic/:start/:end', getSimRange);
  app.get('/api/topics', getTopics);
  app.get('/api/:topic', getTopicRaces);
  app.get('/prediction/senate', getSenatePrediction);

  // application -------------------------------------------------------------
  app.get('*', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
  });
};
