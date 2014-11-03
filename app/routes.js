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
      connection.query(
        'SELECT *, UNIX_TIMESTAMP(time) as unixtime FROM sim WHERE state = ? AND topic = ? ORDER BY time ASC',
        [
          req.params.state,
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

  var getSimStart = function(req, res) {
    pool.getConnection(function(err, connection) {
      connection.query(
        'SELECT *, UNIX_TIMESTAMP(time) as unixtime FROM sim WHERE state = ? AND topic = ? AND time >= FROM_UNIXTIME(?) ORDER BY time ASC',
        [
          req.params.state,
          req.params.topic,
          req.params.start
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

  var getSimRange = function(req, res) {
    pool.getConnection(function(err, connection) {
      connection.query(
        'SELECT *, UNIX_TIMESTAMP(time) as unixtime FROM sim WHERE state = ? AND topic = ? AND time BETWEEN FROM_UNIXTIME(?) AND FROM_UNIXTIME(?) ORDER BY time ASC',
        [
          req.params.state,
          req.params.topic,
          req.params.start,
          req.params.end
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

  // api ---------------------------------------------------------------------

  app.get('/api/:state/:topic', getSim);
  app.get('/api/:state/:topic/:start', getSimStart);
  app.get('/api/:state/:topic/:start/:end', getSimRange);
  app.get('/api/topics', getTopics);
  app.get('/api/:topic', getTopicRaces);

  // application -------------------------------------------------------------
  app.get('*', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
  });
};
