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
const clean = require('gulp-clean');

function styles() {
    return src('dist/scss/style.scss')
        .pipe(concat('style.min.css'))
        .pipe(autoprefixer({overrideBrowserslist: ['last 3 version'],}))
        .pipe(scss({outputStyle: 'compressed'}))
        .pipe(dest('dist/css/'))
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
        .pipe(dest('dist/fonts/fonts-build'))
}
//___________________________________________________
function images () {
    return src([
        'dist/images/src-img/*.*',
    ])
        .pipe(newer('dist/images/build'))
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
        .pipe(dest('dist/images/build'))
        .pipe(newer('dist/images/build'))
        .pipe(webp())
        .pipe(dest('dist/images/build'))
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
        // 'node_modules/swiper/swiper-bundle.js',
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
            baseDir: "dist/pages/",
        },
    });
        watch(['dist/scss/style.scss'], styles)
        watch(['dist/js/*.js','!dist/js/main.min.js'], script)
        watch(['dist/components/*', 'dist/pages/*'])
        watch(['dist/images/src-img'], images)
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
        'dist/fonts/fonts-build/*.*',
        'dist/js/main.min.js',
        'dist/**/*.html',
        'dist/images/build/sprite.svg'
    ], {base: 'dist'})
        .pipe(dest('build'));
}
//___________________________________________________

exports.styles = styles;
exports.fonts = fonts;
exports.images = images;
exports.sprite = sprite;
exports.script = script;
exports.watching = watching;
exports.building = building;


exports.default = parallel(styles, images, script, watching);
exports.build = series(cleanDist, building);
