module.exports = function(grunt) {
  // Load Grunt tasks declared in the package.json file
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  var jsSrc = [
        'lib/angular/angular.js',
        'lib/jquery/jquery.js',
        'lib/underscore/underscore.js',
        'lib/bootstrap/bootstrap.js',
        'lib/moment/moment.js',
        'lib/waslidemenu/dist/jquery.waslidemenu.js',
        'bower_components/Chart.js/Chart.js',
        'bower_components/tc-angular-chartjs/dist/tc-angular-chartjs.js',
        'lib/angular-moment/angular-moment.js',
        'lib/sifter/sifter.js',
        'lib/microplugin/microplugin.js',
        'lib/selectize/selectize.js',
        'lib/angular-ui-select/select.js'
      ],
      cssSrc = [
        'lib/bootstrap/bootstrap.css',
        'lib/font-awesome/font-awesome.css',
        'lib/waslidemenu/dist/waslidemenu.css',
        'lib/selectize/selectize.css',
        'lib/angular-ui-select/select.css',
        'app/client/css/default.css'
      ];
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bower: {
      install: {
        options: {
          targetDir: './lib',
          layout: 'byType',
          install: true,
          verbose: false,
          cleanTargetDir: true,
          cleanBowerDir: false
        }
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'app/client/js/**/*.js'],
      server: ['server.js', 'app/index.js']
    },
    uglify: {
      options: {
        beautify: false,
        mangle: true
      },
      vendors: {
        files: {
          'public/js/vendors.min.js': jsSrc
        }
      },
      app: {
        files: {
          'public/js/app.min.js': [
            'app/client/js/**/*.js'
          ]
        }
      }
    },
    cssmin: {
      combine: {
        files: {
          'public/css/app.css': cssSrc
        }
      }
    },
    concat: {
      options: {
        stripBanners: true,
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %> */',
      },
      css: {
        src: cssSrc,
        dest: 'public/css/app.css',
      },
      app: {
        src: [
          'app/client/js/**/*.js'
        ],
        dest: 'public/js/app.min.js',
      },
      jsDev: {
        src: jsSrc,
        dest: 'public/js/vendors.min.js',
      },
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            flatten: true,
            src: [
              'lib/bootstrap/*.svg',
              'lib/bootstrap/*.eot',
              'lib/bootstrap/*.ttf',
              'lib/bootstrap/*.woff',
              'lib/font-awesome/*.svg',
              'lib/font-awesome/*.eot',
              'lib/font-awesome/*.ttf',
              'lib/font-awesome/*.woff',
              'lib/bootcards/*.svg',
              'lib/bootcards/*.eot',
              'lib/bootcards/*.ttf',
              'lib/bootcards/*.woff'
            ],
            dest: 'public/fonts/',
            filter: 'isFile'
          },
          {
            expand: true,
            flatten: true,
            src: [
              'assets/images/*.*'
            ],
            dest: 'public/images/',
            filter: 'isFile'
          },

          {
            expand: true,
            flatten: true,
            src: [
              'lib/font-awesome/*.css'
            ],
            dest: 'public/css/',
            filter: 'isFile'
          },

          {
            expand: true,
            flatten: true,
            src: [
              'app/client/*.html'
            ],
            dest: 'public/',
            filter: 'isFile'
          }

        ]
      }
    },
    json: {
      data: {
        options: {
          namespace: 'Data',
          includePath: true,
          processName: function(filename) {
            var _name = filename.split("/"),
                len = _name.length-1,
                name = _name[len].split(".")[0];
            return name.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
          }
        },
        src: ['app/client/data/**/*.json'],
        dest: 'public/js/json.js'
      }
    },
    watch: {
      grunt: {
        files: ['Gruntfile.js'],
        tasks: ['build', 'express:dev', 'watch'],
        options: {
          spawn: true,
        },
      },
      scripts: {
        files: ['app/client/js/**/*.js'],
        tasks: ['jshint:all', 'concat:app'],
        options: {
          spawn: true,
        },
      },
      html: {
        files: ['app/client/*.html'],
        tasks: ['copy'],
        options: {
          spawn: true,
        },
      },
      express: {
        files: ['server.js', 'app/routes.js'],
        tasks: ['jshint:server', 'express:dev'],
        options: {
          nospawn: true //Without this option specified express won't be reloaded
        }
      },
      css: {
        files: ['app/client/css/*.css'],
        tasks: ['concat:css'],
        options: {
          spawn: true,
        },
      }
    },
    express: {
      options: {
        debug: true
        // Override defaults here
      },
      dev: {
        options: {
          script: 'server.js'
        }
      }
    },
    'node-inspector': {
      default: {}
    }
  });

  grunt.registerTask('build', [
    'bower:install',
    'jshint:server',
    'jshint:all',
    'uglify',
    'cssmin',
    'copy',
    'json:data'
  ]);

  grunt.registerTask('build-dev', [
    'bower:install',
    'jshint:server',
    'jshint:all',
    'concat',
    'copy',
    'json:data'
  ]);

  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
  });

  grunt.registerTask('server', [ 'build-dev', 'express:dev', 'watch' ]);

  // Default task(s).
  grunt.registerTask('default', ['build']);

};
