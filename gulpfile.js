
/**
 * USAGE:
 * 	gulp (build | lint | watch | clean | help )
 *  gulp test          # test all 
 *  gulp test --name RiString  # test one
 */

var del = require('del'),
  gulp = require('gulp'),
  chmod = require('gulp-chmod'),
  gulpif = require('gulp-if'),
  argv = require('yargs').argv,
  concat = require('gulp-concat'),
  size = require('gulp-size'),
  uglify = require('gulp-uglify'),
  replace = require('gulp-replace'),
  jshint = require('gulp-jshint'),
  tasks = require('gulp-task-listing'),
  sourcemaps = require('gulp-sourcemaps'),
  pjson = require('./package.json'),
  rename = require('gulp-rename'),
  chmod = require('gulp-chmod'),
  exec = require('child_process').exec,
  version = pjson.version;

var testDir = 'test',
  destDir = 'dist',
  npm = 'npm',
  nodeDir = destDir+'/node/rita',
  tmpDir = '/tmp',
  srcDir = 'src',
  rita = 'rita',
  testFile = 'rita',
  minimize = false,
  sourceMaps = false;

// create a pkg in tmpDir then run 'npm test' on it
gulp.task('test-npm-test', ['npm.build'], function(done) {
  var tgz = 'rita-'+version+'.tgz';
  var cmd = 'cp '+tgz+' '+tmpDir+' && cd '+tmpDir+' && npm install '+tgz+' &&';
  cmd += ' cd node_modules/rita && npm install && npm test';
  exec(cmd, function (err, stdout, stderr) {
    log("Running 'npm test' on "+tgz);
    stderr && console.error(stderr);
    done(err);
  });
});

// do npm pack on whatever is already in the dist dir
gulp.task('npm.build', ['setup-npm'], function(done) {
  exec(npm + ' pack '+nodeDir, function (err, stdout, stderr) {
    log("Packing "+nodeDir+'/'+stdout);
    stderr && console.error(stderr);
    del(destDir+'/node'); // remove the build dir
    done(err);
  });
});

// do npm publish on already created .tgz file
gulp.task('npm.publish', [], function(done) {
  var tgz = 'rita-'+version+'.tgz';
  exec(npm + ' publish '+tgz, function (err, stdout, stderr) {
    log("Publishing "+tgz, stdout);
    stderr && console.error(stderr);
    done(err);
  });
});

// build everything, then do npm pack
gulp.task('make.lib', [ 'build.full' ], function(done) {
  gulp.start('npm.build');
});

gulp.task('setup-npm', ['clean-npm', 'build-minify'], function(done) {

  // copy in the node readme
  gulp.src('README.node.md')
    .pipe(rename('README.md'))
    .pipe(gulp.dest(nodeDir));

  // copy in other loose files
  gulp.src(['./LICENSE', './package.json', './gulpfile.js', 'examples/tonic.js'])
    .pipe(gulp.dest(nodeDir));

  // copy in the tests
  gulp.src(testFiles(true))
    .pipe(gulp.dest(nodeDir + '/test'));

  // copy in the tests
  gulp.src(testDir + '/html/data/*')
    .pipe(gulp.dest(nodeDir + '/test/html/data/'));

  // copy in the (default) code
  gulp.src(destDir + '/rita-full.min.js')
    .pipe(rename('rita.js'))
    .pipe(gulp.dest(nodeDir + '/lib'));

  // copy in the (core-only) code
  gulp.src(destDir + '/rita-small.min.js')
    .pipe(rename('rita-tiny.js'))
    .pipe(gulp.dest(nodeDir + '/lib'));

  done();
});

// list all the defined tasks
gulp.task('help', tasks);

// clean out the build-dir
gulp.task('clean', function(f) { del(destDir, f); });

gulp.task('clean-npm', function(f) { del(nodeDir, f); });

// run lint on the non-uglified output (no lexicon)
gulp.task('lint', ['build'], function() {

  log('Linting '+destDir+'/rita.js');

  return gulp.src(destDir+'/rita.js')
    .pipe(jshint({ expr: 1, laxbreak: 1 }))
    .pipe(jshint.reporter('default'));
});

// run lint on the non-uglified output (with lexicon)
gulp.task('lint.full', ['build'], function() {

  log('Linting '+destDir+'/rita-full.js');

  return gulp.src(destDir+'/rita-full.js')
    .pipe(jshint({ expr: 1, laxbreak: 1 }))
    .pipe(jshint.reporter('default'));
});

// watch the src-dir for changes, then build
gulp.task('watch.full', ['build.full'], function() {

  log('Watching ' + srcDir + '/*.js');
  gulp.watch(srcDir + '/*.js', [ 'build.full' ]);
});

gulp.task('watch', [ 'build' ], function() {

  log('Watching ' + srcDir + '/*.js');
  gulp.watch(srcDir + '/*.js', [ 'build' ]);
});

// concatenate sources to 'dist' folder
gulp.task('build-lex', ['clean'], function() {

  return gulp.src(sourceFiles("full"))
    .pipe(replace('##version##', version))
    .pipe(concat(rita+'-full.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});

gulp.task('build-novb', function() {

  return gulp.src(sourceFiles("novb"))
    .pipe(replace('##version##', version))
    .pipe(concat(rita+'-novb.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});

gulp.task('build-1000-lex', ['clean'], function() {

  return gulp.src(sourceFiles("medium"))
    .pipe(replace('##version##', version))
    .pipe(concat(rita+'-small.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});

gulp.task('build-nolex', [ 'clean' ], function() {

  return gulp.src(sourceFiles(false))
    .pipe(replace('##version##', version))
    .pipe(concat(rita+'.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});

// concatenate/minify sources to 'dist' folder

gulp.task('build-medium', ['clean'], function() {

  return gulp.src(sourceFiles("medium"))
    .pipe(replace('##version##', version))
    .pipe(concat(rita+'-medium.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});

gulp.task('build-small', ['clean'], function() {

  return gulp.src(sourceFiles("small"))
    .pipe(replace('##version##', version))
    .pipe(concat(rita+'-small.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});

gulp.task('build-tiny', ['clean'], function() {

  return gulp.src(sourceFiles("tiny"))
    .pipe(replace('##version##', version))
    .pipe(concat(rita+'-tiny.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});


gulp.task('build-minify-lex', [ 'build-lex' ], function() {

  return gulp.src(destDir+'/'+rita+'-full.js')
    .pipe(gulpif(sourceMaps, sourcemaps.init()))
    .pipe(uglify())
    .pipe(gulpif(sourceMaps, sourcemaps.write('./')))
    .pipe(rename(rita+'-full.min.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});

// concatenate/minify sources to 'dist' folder
gulp.task('build-minify-1000-lex', [ 'build-1000-lex' ], function() {

  return gulp.src(destDir+'/'+rita+'-small.js')
    .pipe(gulpif(sourceMaps, sourcemaps.init()))
    .pipe(uglify())
    .pipe(gulpif(sourceMaps, sourcemaps.write('./')))
    .pipe(rename(rita+'-small.min.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});

gulp.task('build-minify-nolex', [ 'build-nolex' ], function() {

  return gulp.src(destDir+'/'+rita+'.js')
    .pipe(gulpif(sourceMaps, sourcemaps.init()))
    .pipe(uglify())
    .pipe(gulpif(sourceMaps, sourcemaps.write('./')))
    .pipe(rename(rita+'.min.js'))
    .pipe(size({showFiles:true}))
    .pipe(chmod(644))
    .pipe(gulp.dest(destDir));
});


// runs tests without loading lexicon
// usage: gulp test
//        gulp test --name RiString
gulp.task('test.quick', [ 'build' ], function() {

  destDir = 'dist';
  testFile = 'rita';
  tests = testFiles(true);

  return gulp.start('test-only');
});

// do tests after npm install (same as test, but runs on 'lib')
gulp.task('test-npm', [ 'build' ], function() {

  destDir = 'lib';
  testFile = 'rita';
  tests = testFiles(true);

  return gulp.start('test-only');
});

// runs tests with lexicon loaded
// usage: gulp test
//        gulp test --name RiString
gulp.task('test', [ 'build' ], function (done) {

  destDir = 'dist';
  testFile = 'rita-full';
  tests = testFiles(false);

  return gulp.start('test-only');
});

// runs tests without building first
gulp.task('test-only', function (done) {

  var testrunner = require("qunit");

  if (argv.name) {
    if (argv.name === 'RiLexicon' || argv.name ==='SimilarBySound') // tmp
      testFile = 'rita-full'
    tests = [ testDir + '/' + argv.name + '-tests.js' ];
    log('Testing: ' + tests[0]);
  }

  testrunner.setup({
    maxBlockDuration: 20000,
    log: {
      globalSummary: true,
      errors: true
    }
  });

  var testSrc = destDir + '/' + testFile + '.js';
  log('Source: ' + testSrc);

  testrunner.run({
      deps: [ testDir + '/qunit-helpers.js' ],
      code: testSrc,
      tests: tests
    },
    function (err, report) {
      if (err) {
        console.error(err);
        console.error(report);
        process.exit(1);
      }
      testFile = 'rita' // restore
      done();
    });
});


// Helper functions --------------------------------------

function testFiles(skipRiLexicon) {

  var tests = [
    testDir + '/qunit-helpers.js',
    testDir + '/LibStructure-tests.js',
    //testDir + '/RiTaEvent-tests.js',
    testDir + '/RiString-tests.js',
    testDir + '/RiTa-tests.js',
    testDir + '/RiGrammar-tests.js',
    testDir + '/RiMarkov-tests.js',
    testDir + '/UrlLoading-tests.js'
  ];

  if (!skipRiLexicon) {
    tests.push(testDir + '/RiLexicon-tests.js');
  }

  return tests;
}

function sourceFiles(lexStatus) {

  var src = [ srcDir + '/header.js', srcDir + '/rita.js' ];

  if (lexStatus === "full") {
    src.push(srcDir + '/rita_lts.js');
    src.push(srcDir + '/rita_dict.js');
    //src.push(srcDir + '/rilexicon.js');
  }
  else if ( lexStatus === "medium") {
     src.push(srcDir + '/rita_dict_1000.js');
     src.push(srcDir + '/rita_lts.js');
    // src.push(srcDir + '/rilexicon.js');
  }
  else if ( lexStatus === "small") {
     src.push(srcDir + '/rita_dict_1000.js');
     //src.push(srcDir + '/rilexicon.js');
  }
  else if (lexStatus === "novb") {
    src.push(srcDir + '/rita_lts.js');
    src.push(srcDir + '/rita_dict_novb.js');
    //src.push(srcDir + '/rilexicon.js');
  }
  //tiny only rita.js

  src.push(srcDir + '/footer.js');

  //console.log(src);
  return src;
}

function log(msg) { console.log('[INFO] '+ msg); }

// ----------------------------------------------------

// task composition
gulp.task('build', [ 'build-lex', 'build-1000-lex','build-nolex']);
gulp.task('make-sizes', [ 'build-lex', 'build-medium','build-small','build-tiny']);
gulp.task('build.full', [ 'build', 'build-minify' ]);
gulp.task('build-minify', [ 'build-minify-1000-lex', 'build-minify-lex','build-minify-nolex' ]);

// help is the default task
gulp.task('default', [ 'help' ]);
