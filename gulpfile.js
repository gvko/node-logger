const gulp = require('gulp');
const tsc = require('gulp-typescript');
const tslint = require('gulp-tslint');
const tsProject = tsc.createProject('./node_modules/.bin/tsconfig.json');

const srcGlob = 'src/**/*';
const outDir = 'dist';
const tslintConfig = './node_modules/.bin/tslint.json';

/*
 * Compile
 */
gulp.task('tsc', ['tslint'], () => {
  return gulp.src(srcGlob)
    .pipe(tsProject())
    .pipe(gulp.dest(outDir));
});

/*
 * Lint
 */
gulp.task('tslint', () => {
  return gulp.src(srcGlob)
    .pipe(tslint({ configuration: tslintConfig }))
    .pipe(tslint.report())
});

/*
 * Run tasks asynchronous
 */
gulp.task('default', ['tslint', 'tsc']);