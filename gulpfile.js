'use strict'

const { task, parallel, watch, series, src, dest } = require('gulp');

const sass = require('gulp-sass')(require('sass'));
const htmlmin = require('gulp-htmlmin');
const fileInclude = require('gulp-file-include');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const groupmedia = require('gulp-group-css-media-queries');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const clean = require('gulp-clean');
const imagemin = require('gulp-imagemin');
const gulpif = require('gulp-if');
const yargs = require('yargs');
const argP = yargs.argv,
    production = !!argP.production;
    const replace = require('gulp-replace');

task('serve', () => {
    return browserSync.init({
        server: {
            baseDir: ('./dist')
        },
        port: 9000,
        open: true
    });
});

task('cleanDist', () => {
    return src('./dist', { allowEmpty: true }).pipe(clean())
})

task('html', () => {
    return src('./src/*.html')
        .pipe(fileInclude())
        .pipe(gulpif(production, replace(/<link rel="stylesheet" type="text\/css" href=".\/css\/style.css">/g, () => { // Поиск тег link с ссылкой ./css/style.css
			return '<link rel="stylesheet" type="text/css" href="./css/style.min.css">'; // и меняем ./css/style.css => ./css/style.min.css
		})))
        .pipe(gulpif(production, htmlmin({ collapseWhitespace: true })))
        .pipe(gulpif(production, rename({ suffix: ".min" })))
        .pipe(browserSync.stream())
        .pipe(dest('./dist'));
})

task('sass', () => {
    return src('./src/scss/**/*.scss')
        .pipe(sass().on("error", sass.logError))
        .pipe(groupmedia())
        .pipe(gulpif(production, cleanCss()))
        .pipe(autoprefixer({
            grid: true,
            cascade: true,
            Browserslist: [
                "last 1 version",
                "> 1%"
            ]
        }))
        .pipe(gulpif(production, rename({ suffix: ".min" })))
        .pipe(browserSync.stream())
        .pipe(dest('./dist/css/'));
})

task('js', () => {
    return src('./src/js/**/*.js')
    .pipe(gulpif(production, terser()))
    .pipe(concat('scripts.min.js'))
        .pipe(browserSync.stream())
        .pipe(dest('./dist/js/'));
})

task('img', () => {
    return src('./src/img/**/*')
        .pipe(imagemin())
        .pipe(browserSync.stream())
        .pipe(dest('./dist/img'));
})

task('fonts', () => {
    return src('./src/fonts/*')
        .pipe(browserSync.stream())
        .pipe(dest('./dist/fonts'));
})

task('watch', () => {
    watch('./src/**/*.html', parallel('html')).on('change', browserSync.reload);
    watch('./src/scss/**/*.scss', parallel('sass')).on('change', browserSync.reload);
    watch('./src/js/**/*.js', parallel('js')).on('change', browserSync.reload);
    watch('./src/img/**/*', series('img')).on('change', browserSync.reload);
    watch('./src/fonts/*', series('fonts')).on('change', browserSync.reload);
    watch('./dist/**/*.html').on('change', browserSync.reload);
})

task('build', series('cleanDist', parallel('html', 'fonts', 'js', 'img', 'sass')));
task('dev', series('build', parallel('serve', 'watch')));