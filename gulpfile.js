(function() {
  'use strict';
  var gulp = require('gulp');
  var gutil = require('gulp-util');
  var less = require('gulp-less');
  var jade = require('gulp-jade');
  var bower = require('gulp-bower');
  var mocha = require('gulp-mocha');
  var cover = require('gulp-coverage');
  var path = require('path');
  var changed = require('gulp-changed');
  var jshint = require('gulp-jshint');
  var imagemin = require('gulp-imagemin');
  var reporter = require('gulp-codeclimate-reporter');

  var watchify = require('watchify');
  var assign = require('lodash.assign');
  var browserify = require('browserify');
  var source = require('vinyl-source-stream');
  var nodemon = require('gulp-nodemon');
  var babelify = require('babelify');


  var paths = {
    public: 'public/**',
    jade: ['app/**/*.jade'],
    scripts: 'app/**/*.js',
    images: 'app/images/**/*',
    staticFiles: [
      '!app/**/*.+(less|css|js|jade)',
      '!app/images/**/*',
      'app/**/*.*',
      'app/styles/*.css'
    ],
    unitTests: [
      'public/lib/angular/angular.min.js',
      'public/lib/angular-ui-router/release/angular-ui-router.min.js',
      'public/js/application.js',
      'tests/unit/**/*.spec.js'
    ],
    serverTests: ['./tests/server/**/*.spec.js'],
    libTests: ['lib/tests/**/*.js'],
    styles: 'app/styles/*.+(less|css)'
  };

  // generate lint report
  gulp.task('lint', function() {
    return gulp.src(['./app/**/*.js', './index.js',
        './server/**/*.js', './tests/**/*.js'
      ])
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
  });

  // copy static files
  gulp.task('static-files', function() {
    return gulp.src(paths.staticFiles)
      .pipe(gulp.dest('./public/'));
  });

  // build stylesheet
  gulp.task('less', function() {
    gulp.src(paths.styles)
      .pipe(changed('./public', {
        extension: '.css'
      }))
      .pipe(less({
        paths: [path.join(__dirname, './app/styles')]
      }))
      .pipe(gulp.dest('./public/css'));
  });

  // render jade to html files
  gulp.task('jade', function() {
    gulp.src(paths.jade)
      // .pipe(changed('./public', {
      //   extension: '.html'
      // }))
      .pipe(jade())
      .pipe(gulp.dest('./public/'));
  });

  // install front-end dependencies
  gulp.task('bower', function() {
    return bower()
      .pipe(gulp.dest('public/lib/'));
  });

  // build custom scripts
  // add custom browserify options here
  var customOpts = {
    cache: {},
    packageCache: {},
    entries: ['./app/src/app.js'],
    debug: true
  };

  var bundler = function() {
    return browserify(customOpts)
      .transform(babelify, {
        presets: 'es2015'
      });
  };

  var w = watchify(bundler());
  w.on('log', gutil.log); // output build logs to terminal

  function bundle(b) {
    return b.bundle()
      .on('success', gutil.log.bind(gutil, 'Browserify bundle'))
      // log errors if they happen
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('app.js'))
      .pipe(gulp.dest('./public/js'));
  }

  gulp.task('watch', function() {
    gulp.watch(paths.jade, ['jade']);
    gulp.watch(paths.styles, ['less']);
    // on any dep update, runs the bundler
    bundle(w);
    w.on('update', bundle.bind(null, w));
  });

  gulp.task('buildjs', bundle.bind(null, bundler()));

  // test runners
  // server api tests
  gulp.task('test:bend', function() {
    return gulp.src(['tests/server/index.js'], {
        read: false
      })
      .pipe(cover.instrument({
        pattern: ['server/**/*.js'],
        debugDirectory: 'debug'
      }))
      .pipe(mocha({
        reporter: 'spec',
        globals: {
          assert: require('assert')
        }
      }))
      .once('error', function(err) {
        gutil.log(err);
        process.exit(1);
      })
      .pipe(cover.gather())
      .pipe(cover.format(
        ['lcov', 'html', 'json']))
      .pipe(gulp.dest('./reports'))
      .once('end', function() {
        process.exit();
      });
  });

  gulp.task('nodemon', function() {
    nodemon({
      script: 'index.js',
      ext: 'js',
      ignore: ['public/', 'node_modules/']
    }).on('restart', function() {
      console.log('application restarted');
    });
  });

  gulp.task('images', function() {
    gulp.src(paths.images)
      .pipe(imagemin({
        optimizationLevel: 3,
        progressive: true,
        interlaced: true
      }))
      .pipe(gulp.dest('./public/images/'));
  });

  gulp.task('codeclimate', ['test:bend'], function() {
    return gulp
      .src(['./reports/coverage.lcov'], {
        read: false
      })
      .pipe(reporter({
        token: process.env.CODECLIMATE_REPO_TOKEN
      }));
  });

  gulp.task('test', ['codeclimate']);
  // // var envOptions = {
  //  //   string: 'env',
  //  //   default: {
  //  //     env: process.env.NODE_ENV || 'test'
  //  //   }
  //  // };

  //  gulp.task('heroku:production', ['build']);
  //  gulp.task('heroku:staging', ['build']);
  //  gulp.task('production', ['nodemon', 'build']);
  //  gulp.task('test', ['test:fend', 'test:bend']);

  gulp.task('build', ['jade', 'less', 'static-files',
    'buildjs', 'images', 'bower',
  ]);


  gulp.task('default', ['nodemon', 'watch', 'build']);
})();
