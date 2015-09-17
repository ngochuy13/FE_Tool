/*global -$ */
'use strict';
// generated on 2015-03-11 using generator-gulp-webapp 0.3.0
var gulp              = require('gulp'),
    //pngquant          = require('imagemin-pngquant'),
    fs                = require('fs'),
    browserSync       = require('browser-sync'),
    replaceBuildBlock = require('gulp-replace-build-block'),
    $                 = require('gulp-load-plugins')(),
    reload            = browserSync.reload;

var buildAssetArray = [
  'home.html'
];

var dependecyStyles = {
  'vendors.scss' : [
    'bower_components/fontawesome/css/font-awesome.css',
    'bower_components/owl-carousel2/dist/assets/owl.carousel.css',
    'bower_components/bootstrap-select/dist/css/bootstrap-select.css',
    'bower_components/slick.js/slick/slick.css',
    'bower_components/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css',
    'bower_components/nouislider/distribute/nouislider.min.css',
    'bower_components/lightbox2/dist/css/lightbox.css',
    'bower_components/jquery-rateyo/src/jquery.rateyo.css'
  ]
};

var folders = {
  app: 'app',
  dist: 'dist',
  tmp: '.tmp'
};

// Style Related ============================================================
gulp.task("sass-css-import", function() {
  for( var file in dependecyStyles){
    gulp.src(dependecyStyles[file])
    .pipe($.sass())
    .pipe($.concat(file))
    .pipe(gulp.dest('app/styles'));
  }
});

gulp.task('styles', ['sass-css-import'], function () {
  return gulp.src(folders.app+'/styles/main.sass')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      indentedSyntax: true,
      outputStyle: 'nested', // libsass doesn't support expanded yet
      precision: 10,
      includePaths: ['.'],
      onError: console.error.bind(console, 'Sass error:')
    }))
    .pipe($.postcss([
      require('autoprefixer-core')({browsers: ['last 1 version', 'IE 9']})
    ]))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('sprite', function () {
  // Generate our spritesheet
  var spriteData = gulp.src(folders.app+'/images/sprites/*.png').pipe($.spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.scss',
    cssFormat: 'css',
    cssOpts: {
      cssClass: function (item) {
        // If this is a hover sprite, name it as a hover one (e.g. 'home-hover' -> 'home:hover')
        if (item.name.indexOf('-hover') !== -1) {
          return '.icon-' + item.name.replace('-hover', ':hover');
          // Otherwise, use the name as the selector (e.g. 'home' -> 'home')
        } else {
          return '.icon-' + item.name;
        }
      }
    }
  }));

  // Pipe image stream through image optimizer and onto disk
  spriteData.img
    .pipe($.imagemin())
    .pipe(gulp.dest(folders.app+'/images/'));

  // Pipe CSS stream through CSS optimizer and onto disk
  spriteData.css
    .pipe($.csso())
    .pipe(gulp.dest(folders.app+'/styles/'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

// End Style Related ============================================================



// Script Related ============================================================
gulp.task('jshint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});
// End Script Related ============================================================






// Template Related ============================================================
gulp.task('all-templates', function() {
  return gulp.src('./app/jade/*.jade')
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest('.tmp/'));
});

gulp.task('all-templates-watch', ['all-templates'], reload);

// Task for jade files page templates and component template
gulp.task('page-templates', function() {
  return gulp.src('./app/jade/*.jade')
    .pipe($.changed('.tmp', {extension: '.html'}))
    .pipe($.jade())
    .pipe(gulp.dest('.tmp/'));
});

gulp.task('page-templates-watch', ['page-templates'], function(){
  console.log('page-templates task done compiled completely');
  reload();
});

gulp.task('html', ['all-templates', 'styles'], function() {
  var assets = $.useref.assets({
    searchPath: ['.tmp', 'app', '.']
  });
  var isBuildAssetList = function(file) {
    console.log(file.relative);
    return buildAssetArray.indexOf(file.relative) >= 0;
  };

  gulp.src('.tmp/*.html')
    .pipe($.ignore.include(isBuildAssetList))
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    //.pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));

  return gulp.src('.tmp/*.html')
    .pipe(replaceBuildBlock()).pipe(gulp.dest('dist'));
});

// End Template Related ============================================================

gulp.task('extras', function () {
  return gulp.src([
    'app/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['all-templates', 'styles', 'fonts'], function () {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  // watch for changes
  gulp.watch([
    'app/scripts/**/*.js',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('app/jade/*.jade', ['page-templates-watch']);
  gulp.watch('app/jade/*/*.jade', ['all-templates-watch']);
  gulp.watch('app/styles/**/*.{sass,scss}', ['styles']);
  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass-official'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', [ 'html', 'images', 'fonts', 'extras'], function () {
  gulp.src('.tmp/styles/*').pipe(gulp.dest('dist/styles/'));
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});




gulp.task('font-gen', function(){
  return gulp.src(folders.app+'/fonts/*.{otf,ttf}').pipe($.fontGen({
      dest: "./fonts/"
  }))
});

