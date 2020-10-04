var gulp = require("gulp"),
  sass = require("gulp-sass"),
  browserSync = require("browser-sync").create(),
  concat = require("gulp-concat"),
  uglify = require("gulp-uglify-es").default,
  cleancss = require("gulp-clean-css"),
  autoprefixer = require("gulp-autoprefixer"),
  rsync = require("gulp-rsync"),
  ftp = require("vinyl-ftp"),
  gutil = require("gulp-util"),
  babel = require("rollup-plugin-babel"),
  rollup = require("gulp-rollup");

// Local Server
gulp.task("browser-sync", function () {
  browserSync.init({
    server: {
      baseDir: "app",
    },
    notify: false,
    // online: false, // Work offline without internet connection
    // tunnel: true, tunnel: 'projectname', // Demonstration page: http://projectname.localtunnel.me
  });
});
function bsReload(done) {
  browserSync.reload();
  done();
}

// Custom Styles
gulp.task("styles", function () {
  return (
    gulp
      .src("app/sass/main.sass")
      .pipe(
        sass({
          outputStyle: "expanded",
          includePaths: [__dirname + "/node_modules"],
        })
      )
      .pipe(concat("styles.min.css"))
      .pipe(
        autoprefixer({
          grid: true,
          overrideBrowserslist: ["last 10 versions"],
        })
      )
      // .pipe(cleancss({ level: { 1: { specialComments: 0 } } })) // Optional. Comment out when debugging
      .pipe(gulp.dest("app/css"))
      .pipe(browserSync.stream())
  );
});

// JS Libraries
gulp.task("scripts", function () {
  return gulp
    .src([
      "app/js/src/_libs.js", // JS libraries (all in one)
      "app/js/_custom.js",
    ])
    .pipe(concat("scripts.min.js"))
    .pipe(uglify()) // Minify js (opt.)
    .pipe(gulp.dest("app/js"))
    .pipe(browserSync.reload({ stream: true }));
});

// Scripts & babel
gulp.task("babel", function () {
  return gulp
    .src(["app/js/src/_custom.js"])
    .pipe(
      rollup({
        allowRealFiles: true,
        input: "./app/js/src/_custom.js",
        format: "umd",
        plugins: [
          babel({
            presets: [["@babel/env", { modules: false }]],
          }),
        ],
      })
    )
    .pipe(gulp.dest("app/js/"));
});

// Code & Reload
gulp.task("code", function () {
  return gulp.src("app/**/*.html").pipe(browserSync.reload({ stream: true }));
});

// Deploy
gulp.task("rsync", function () {
  return gulp.src("app/").pipe(
    rsync({
      root: "app/",
      hostname: "username@yousite.com",
      destination: "yousite/public_html/",
      // include: ['*.htaccess'], // Included files
      exclude: ["**/Thumbs.db", "**/*.DS_Store"], // Excluded files
      recursive: true,
      archive: true,
      silent: false,
      compress: true,
    })
  );
});

gulp.task("deploy", function () {
  gulp.parallel("dist");

  var domen = "test.amado.company";

  var conn = ftp.create({
    host: "",
    user: "",
    password: "",
    parallel: 10,
    log: gutil.log,
  });

  var globs = ["dist/**"];
  return gulp
    .src(globs, { buffer: false })
    .pipe(conn.dest("/www/" + domen + "/privetDima"));
});

gulp.task("dist", function () {
  return gulp
    .src(["app/*.html", "app/img", "app/fonts", "app/js"])
    .pipe(gulp.dest("dist"));
});

gulp.task("push", gulp.series("dist", "deploy"));

gulp.task("watch", function () {
  gulp.watch("app/sass/**/*.sass", gulp.parallel("styles"));
  gulp.watch(["app/js/src/**/*.js"], gulp.series("babel", "scripts"));
  gulp.watch("app/*.html", gulp.parallel("code"));
});

gulp.task(
  "default",
  gulp.parallel("styles", "babel", "scripts", "browser-sync", "watch")
);
