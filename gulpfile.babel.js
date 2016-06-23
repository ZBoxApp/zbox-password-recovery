import gulp from "gulp";
import sassLint from "gulp-sass-lint";
import path from "path";
import eslint from 'gulp-eslint';

gulp.task('default', ['sass-lint', 'js-lint']);

gulp.task('sass-lint', () => {
    "use strict";

    return gulp.src(path.join(__dirname, "src", "assets", "stylesheets", "*.s+(a|c)ss"))
        .pipe(sassLint())
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError());
});

gulp.task('js-lint', () => {
    "use strict";

    let dirs = [
        path.join(__dirname, 'src', 'assets', 'javascripts', '*.jsx'),
        path.join(__dirname, 'src', 'assets', 'javascripts', '**', '*.jsx')
    ];

    return gulp.src(dirs)
        .pipe(eslint({
            configFile: path.join(__dirname, '.eslintrc.yml')
        }))
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});
