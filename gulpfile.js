"use strict";
/*!
 * gulp
 */

// Load plugins
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    inject = require('gulp-inject'),
    browserSync = require('browser-sync').create(),
    clean = require('gulp-clean'),
    runSequence = require('run-sequence'),
    debug = require('gulp-debug'),
    browserify = require('gulp-browserify'),
    insert = require('gulp-insert');

var fileDiscriminator = '';
var isDebug = false;

// Html
gulp.task('html', function() {
    return gulp.src('src/app/views/**/*')
        .pipe(gulp.dest('dist/app/views'));
    //.pipe(notify({ message: 'HTML task complete' }));
});

// Styles
gulp.task('styles', function() {
    return sass('src/app/styles/**/*.scss', { style: 'expanded' })
        .pipe(gulp.dest('dist/app/css'))
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('src/app/styles'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(cssnano())
        .pipe(gulp.dest('dist/app/css'));
        //.pipe(notify({ message: 'Styles task complete' }));
});

// Application
gulp.task('app', function() {
    gulp.src('src/app/**/*.js')
        .pipe(gulp.dest('dist/app'));

    return gulp.src('src/app/app.js', { read: false })
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(browserify({ insertGlobals: true, debug: isDebug }))
        .pipe(gulp.dest('dist/app'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(uglify())
        .pipe(gulp.dest('dist/app'));
    //.pipe(notify({ message: 'JS task complete' }));
});

// Video
gulp.task('video', function() {
    return gulp.src('src/app/video/**/*')
        .pipe(gulp.dest('www/museum-app/app/video'));
        //.pipe(notify({ message: 'Video task complete' }));
});

// Server
gulp.task('server', function() {
    return gulp.src('src/server/server.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest('dist/server'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(uglify())
        .pipe(gulp.dest('dist/server'));
        //.pipe(notify({ message: 'Server task complete' }));
});

gulp.task('jquery', function() {
    return gulp.src('node_modules/jquery/dist/**/*')
        .pipe(gulp.dest('dist/app/third-party/jquery'));
        //.pipe(notify({ message: 'JQuery task complete' }));
});

gulp.task('bootstrap', function() {
    return gulp.src('node_modules/bootstrap/dist/!(fonts)/!(npm.js)')
        .pipe(gulp.dest('dist/app/third-party/bootstrap'));
        //.pipe(notify({ message: 'Bootstrap task complete' }));
});

gulp.task('font-awesome', function() {
    return gulp.src('node_modules/font-awesome/+(css|fonts)/*')
        .pipe(gulp.dest('dist/app/third-party/font-awesome'));
        //.pipe(notify({ message: 'Font Awesome task complete' }));
});

gulp.task('swig', function() {
    return gulp.src('node_modules/swig/dist/**/*')
        .pipe(gulp.dest('dist/app/third-party/swig'));
    //.pipe(notify({ message: 'Swig task complete' }));
});

// bust cache
gulp.task('bust', function (done) {
    return cache.clearAll(done);
});

// deploy startup code
gulp.task('deploy-start', ['server'], function() {
    var stream = gulp.src('src/index.js')
        .pipe(gulp.dest('www/museum-app/'));
    //.pipe(notify({ message: 'Deploy start script complete' }));

    return stream;
});

// deploy server code
gulp.task('deploy-server', ['server'], function() {
    var env = '';
    if (isDebug)
        env = 'app.set(\'env\', \'develop\');';
    else
        env = 'app.set(\'env\', \'production\');';

    var stream = gulp.src('dist/server/**/' + fileDiscriminator)
        .pipe(insert.append(env))
        .pipe(gulp.dest('www/museum-app/server'));
    //.pipe(notify({ message: 'Deploy server complete' }));

    return stream;
});

gulp.task('deploy-views', function() {
    return gulp.src('dist/app/views/**/!(index.*)')
        .pipe(gulp.dest('www/museum-app/app/views'));
    //.pipe(notify({ message: 'Deploy views complete' }));
})

gulp.task('deploy-app', function() {
    return gulp.src('dist/app/**/' + fileDiscriminator)
        .pipe(gulp.dest('www/museum-app/app'));
        //.pipe(notify({ message: 'Deploy app complete' }));
});

gulp.task('deploy-css', function() {
    return gulp.src('dist/app/css/**/' + fileDiscriminator)
        .pipe(gulp.dest('www/museum-app/app/css'));
        //.pipe(notify({ message: 'Deploy css task complete' }));
});

gulp.task('deploy-third-party', function() {
    return gulp.src('dist/app/third-party/**/' + fileDiscriminator)
        .pipe(gulp.dest('www/museum-app/app/third-party'));
        //.pipe(notify({ message: 'Deploy third-party task complete' }));
});

gulp.task('deploy-third-party-fonts', function() {
    return gulp.src('dist/app/third-party/font-awesome/fonts/*')
        .pipe(gulp.dest('www/museum-app/app/third-party/font-awesome/fonts'));
        //.pipe(notify({ message: 'Deploy third-party fonts task complete' }));
});

// deploy
gulp.task('deploy', [
    'deploy-app',
    'deploy-css',
    'deploy-third-party',
    'deploy-third-party-fonts',
    'deploy-views']);


// Static Server + watching files
gulp.task('serve', function() {

    browserSync.init({
        server: "./app"
    });

    // Watch app files
    gulp.watch('src/app/views/index.html', ['inject']);

    // Watch .scss files
    gulp.watch('src/app/styles/**/*.scss', ['deploy-css']);

    // Watch .app files
    gulp.watch('src/app/**/*.js', ['deploy-app']);

    // Watch third party files
    gulp.watch('node_modules/jquery/**/*', ['jquery']);
    gulp.watch('node_modules/bootstrap/**/*', ['bootstrap']);
    gulp.watch('node_modules/font-awesome/**/*', ['font-awesome']);
    gulp.watch('node_modules/swig/**/*', ['swig']);

    //Watch .mp4 files
    gulp.watch('src/app/video/**/*.mp4', ['video']);

    // Watch any files in src/, reload on change
    gulp.watch(['src/**']).on('change', browserSync.reload);
});

// Clean
gulp.task('clean', function() {
    return gulp.src(['dist/*', 'www/*'])
        .pipe(clean());
});

// Common tasks
gulp.task('common', ['styles', 'app', 'video', 'jquery', 'bootstrap', 'font-awesome', 'swig', 'html']);

// Inject styles and javascript into index.html
gulp.task('inject', function() {

    var sources = gulp.src([
            './www/museum-app/app/third-party/**/'.concat(fileDiscriminator)
            , './www/museum-app/app/css/**/simple'.concat(fileDiscriminator)
            , './www/museum-app/app/css/**/app'.concat(fileDiscriminator)
            , './www/museum-app/app/app/index/**/*.js'.concat(fileDiscriminator)
            , './www/museum-app/app/app.js'.concat(fileDiscriminator)
        ], {read: false});

    return gulp.src('./dist/app/views/index.html')
        .pipe(inject(sources, { ignorePath: 'www/museum-app/app/', addRootSlash: false })) //, addPrefix: './..' }))
        .pipe(gulp.dest('./www/museum-app/app/views'));
});

// Default task
gulp.task('default', ['clean'], function(cb) {
    fileDiscriminator = '+(*.min.*)';
    isDebug = false;
    runSequence('common', 'deploy', 'inject', 'deploy-server', 'deploy-start'); //, 'serve');
});

// Debug task
gulp.task('debug', ['clean'], function() {
    fileDiscriminator = '!(*.min.*)';
    isDebug = true;
    runSequence('common', 'deploy', 'inject', 'deploy-server', 'deploy-start'); //, 'serve');
});
