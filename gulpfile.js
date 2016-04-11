'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var nodemon = require('gulp-nodemon');


gulp.task('sass', function() {
    return gulp.src('./public/sass/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./public/css/sass'));
});

gulp.task('default', ['sass'], function() {
    nodemon({
        script: 'index.js',
        ext: 'js html',
        env: {
        },
        ignore: ['public']
    });
    gulp.watch('./public/sass/*.scss', ['sass']);
});
