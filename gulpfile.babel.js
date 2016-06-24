import autoprefixer from 'gulp-autoprefixer';
import concat from 'gulp-concat';
import eslint from 'gulp-eslint';
import gulp from "gulp";
import path from "path";
import sass from 'gulp-sass';
import sassLint from "gulp-sass-lint";
import sourcemaps from 'gulp-sourcemaps';

let paths= {
    src: {
        js: path.join(__dirname, "src", "assets", "javascripts"),
        styles: path.join(__dirname, "src", "assets", "stylesheets")
    },
    dist: {
        js: path.join(__dirname, "dist", "assets", "javascripts"),
        styles: path.join(__dirname, "dist", "assets", "stylesheets")
    }
};

gulp.task('sass-lint', () => {
    "use strict";

    return gulp.src(path.join(paths.src.styles, "*.s+(a|c)ss"))
        .pipe(sassLint())
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError());
});

gulp.task('js-lint', () => {
    "use strict";

    let dirs = [
        path.join(paths.src.js, '*.jsx'),
        path.join(paths.src.js, '**', '*.jsx')
    ];

    return gulp.src(dirs)
        .pipe(eslint({
            configFile: path.join(__dirname, '.eslintrc.yml')
        }))
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task('styles', function () {
    return gulp.src(path.join(paths.src.styles, "*.s+(a|c)ss"))
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(concat('style.css'))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.join(paths.dist.styles)));
});

gulp.task('default', ['lint', 'styles']);
gulp.task('lint', ['sass-lint', 'js-lint']);
