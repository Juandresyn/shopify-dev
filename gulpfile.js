const dotenv             = require('dotenv').config();
const argv               = require('yargs').argv;

const gulp               = require('gulp');
const gulpif             = require('gulp-if');
const watch              = require('gulp-watch');
const notify             = require('gulp-notify');
const rename             = require('gulp-rename');
const filter             = require('gulp-filter');
const flatten            = require('gulp-flatten');
const changed            = require('gulp-changed');
const plumber            = require('gulp-plumber');

const sass               = require('gulp-sass');
const stylefmt           = require('gulp-stylefmt');
const stylelint          = require('gulp-stylelint');
const autoprefixer       = require('gulp-autoprefixer');

const jscs               = require('gulp-jscs');
const uglify             = require('gulp-uglify');
const concat             = require('gulp-concat');
const stylish            = require('gulp-jscs-stylish');

const sourcemaps         = require('gulp-sourcemaps');
const shopify            = require('gulp-shopify-upload-with-callbacks');

const del                = require('del');
const opn                = require('open');
const path               = require('path');
const runsequence        = require('run-sequence');

const debug              = require('gulp-debug');

var plumberErrorHandler = {
  errorHandler: notify.onError({
    title: '<%= error.plugin %>',
    message: 'Error: <%= error.message %>'
  })
};

gulp.task('lint-styles', () => {
  return gulp.src(['dev/styles/**/*.scss', '!dev/styles/**/{_variables,_mixins,_normalize}.scss'])
    .pipe(stylefmt())
    .pipe(stylelint({
      reporters: [{formatter: 'string', console: true}]
    }))
    .pipe(gulp.dest('dev/styles/'));
});

gulp.task('styles', () => {
  return gulp.src(['dev/styles/*.scss'])
    .pipe(plumber(plumberErrorHandler))
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'compressed', errLogToConsole: true }))
    .pipe(autoprefixer({ browsers: ['> 2.5% in US', 'ie >= 10', 'Android >= 4.3', 'iOS >= 7'] }))
    .pipe(sourcemaps.write())
    .pipe(rename({ suffix: '.css', extname: '.liquid' }))
    .pipe(gulp.dest('deploy/assets'));
});

gulp.task('lint-scripts', () => {
  return gulp.src('dev/scripts/*.js')
    .pipe(jscs({fix: true}))
    .pipe(stylish())
    .pipe(jscs.reporter('fail'))
    .pipe(gulp.dest('dev/scripts/'));
});

gulp.task('scripts', () => {
  return gulp.src(['dev/scripts/*.js'])
    .pipe(plumber(plumberErrorHandler))
    .pipe(sourcemaps.init())
    .pipe(concat('scripts.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(rename({ suffix: '.js', extname: '.liquid' }))
    .pipe(gulp.dest('deploy/assets'));
});

gulp.task('vendor', () => {
  var styles = filter(['styles/**/*.scss']);
  var scripts = filter(['scripts/**/*.js']);
  return gulp.src(['dev/vendor/**'])
    .pipe(plumber(plumberErrorHandler))
    .pipe(styles)
    .pipe(sass({ outputStyle: 'compressed', errLogToConsole: true }))
    .pipe(styles.restore())
    .pipe(scripts)
    .pipe(concat('vendor.js'))
    .pipe(uglify())
    .pipe(scripts.restore())
    .pipe(flatten())
    .pipe(gulp.dest('deploy/assets'));
});

var isAccountTemplate = function (file) {
  return file.path.indexOf('templates/customers') !== -1;
};

gulp.task('copy', () => {
  return gulp.src(['dev/liquid/**/*'], {base: 'dev/liquid'})
    .pipe(plumber(plumberErrorHandler))
    .pipe(gulpif(isAccountTemplate, flatten({includeParents: 2}), flatten({includeParents: 1})))
    .pipe(changed('deploy/'))
    .pipe(gulp.dest('deploy/'));
});

gulp.task('imagecopy', () => {
  return gulp.src(['dev/images/*'])
    .pipe(plumber(plumberErrorHandler))
    .pipe(changed('deploy/assets', {hasChanged: changed.compareSha1Digest}))
    .pipe(gulp.dest('deploy/assets'));
});

gulp.task('clean', function (cb) {
  del(['deploy/**/*'], {force: true}, cb);
});

gulp.task('build', ['clean'], function (cb) {
  runsequence(['copy', 'imagecopy', 'styles', 'scripts', 'vendor'], cb);
});

gulp.task('watch', ['build'], () => {
  gulp.watch(['dev/styles/**/*.scss'], ['styles']);
  gulp.watch(['dev/scripts/**/*.js'], ['scripts']);
  gulp.watch(['dev/vendor/**/*.{js,scss}'], ['vendor']);
  gulp.watch(['dev/images/*'], ['imagecopy']);
  gulp.watch(['dev/liquid/**/*'], ['copy'])
    .on('change', function (event) {
      if (event.type === 'deleted') {
        var filePathFromSrc = path.relative(path.resolve('dev/liquid'), event.path);
        var destFilePath = path.resolve('deploy', filePathFromSrc);
        del.sync(destFilePath);
      }
    });
});

gulp.task('open', () => {
  if (!isNaN(parseInt(process.env.THEME_ID))) {
    opn('http://' + process.env.URL + '?preview_theme_id=' + process.env.THEME_ID);
  }
});

gulp.task('upload', ['watch'], function (cb) {
  if (!process.env.THEME_ID) {
    return false;
  } else {
    if (argv.o) {
      runsequence(['open'], cb);
    }
    return watch('deploy/{assets|layout|config|snippets|templates|locales|sections}/**')
      .pipe(shopify(process.env.API_KEY, process.env.PASSWORD, process.env.URL, process.env.THEME_ID, {basePath: 'deploy/'}));
  }
});

gulp.task('default', ['clean', 'build', 'watch', 'upload']);
