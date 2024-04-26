'use strict';

const {src, dest, watch, parallel, series} = require('gulp');

const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer= require('gulp-autoprefixer');
const newer = require('gulp-newer');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgSprite = require('gulp-svg-sprite');
const fonter = require('gulp-fonter');
const fontsFormat = require('gulp-ttf2woff2');
const pug = require('gulp-pug');
const include = require('gulp-include');
const clean = require('gulp-clean');
const gulpIf = require('gulp-if');
const rename = require('gulp-rename');

function compileStyles(f) { f();
    return src([
        'node_modules/swiper/swiper-bundle.css',
        'dist/scss/style.scss'
    ])
        .pipe(concat('style.min.css'))
        .pipe(scss({outputStyle: 'compressed'}).on('error', scss.logError))
        .pipe(autoprefixer({overrideBrowserslist: ['last 3 version'],}))
        .pipe(dest('dist/css/'))
        .pipe(browserSync.stream());
}
//___________________________________________________
function compilePug() {
    return src('dist/pug/*.pug')
        .pipe(pug({pretty: true}))
        .pipe(dest('build/'))
        .pipe(browserSync.stream());
}
//___________________________________________________
function  includePages () {
    return src('dist/pages/*.html')
        .pipe(include({
            includePaths: 'dist/components',
        }))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}
//___________________________________________________
function fonts () {
    return src('dist/fonts/*.*')
        .pipe(fonter({
            formats: ['woff', 'ttf']
        }))
        .pipe(src('dist/fonts/*.ttf'))
        .pipe(fontsFormat())
        .pipe(dest('dist/fonts/'))
}
//___________________________________________________

function images() {
    const buildDir = 'dist/images/build';

    return src('dist/images/**/*.*', { base: 'dist/images' })
        .pipe(gulpIf(
            file => !file.isDirectory(),
            rename(filePath => {
                filePath.dirname = '';
            })
        ))
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true }),
            imagemin.mozjpeg({quality: 75, progressive: true }),
            imagemin.optipng({optimizationLevel: 5 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ]))

        .pipe(webp())
        .pipe(dest(buildDir));
}
//___________________________________________________
function sprite () {
    return src('dist/images/build/*.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg',
                    example: true
                }
            }
        }))
        .pipe(dest('dist/images/build'))
}
//___________________________________________________

function script () {
    return src([
        'node_modules/swiper/swiper-bundle.js',
        'dist/js/*.js',
        '!dist/js/main.min.js'
    ])
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(dest('dist/js/'))
        .pipe(browserSync.stream());
}
//___________________________________________________

function watching () {
    browserSync.init({
        server: {
            baseDir: "dist/",
        },
    });
    watch(['dist/scss/**/*.scss'], compileStyles);
    watch(['dist/pug/*.pug'], compilePug);
    watch(['dist/js/*.js','!dist/js/main.min.js'], script)
    watch(['dist/components/*', 'dist/pages/*'], includePages)
    watch(['dist/images/**/*.*'], series(images, browserSync.reload));
    watch(['dist/**/*.html']).on('change', browserSync.reload);
}
//___________________________________________________

function cleanDist () {
    return src('build')
        .pipe(clean());
}

function building () {
    return src([
        'dist/css/style.min.css',
        'dist/images/build/**/!(*.svg)',
        'dist/fonts/*',
        'dist/js/main.min.js',
        'dist/**/*.html',
        'dist/images/build/sprite.svg',
        '!dist/images/build/stack'
    ], {base: 'dist'})
        .pipe(dest('build'));
}
//___________________________________________________

exports.compileStyles = compileStyles;
exports.fonts = fonts;
exports.images = images;
exports.sprite = sprite;
exports.script = script;
exports.includePages = includePages;
exports.watching = watching;
exports.building = building;


exports.default = parallel(compileStyles, fonts, images, script, compilePug, includePages,  watching);
exports.build = series(cleanDist, building);
