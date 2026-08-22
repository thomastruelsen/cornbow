const fs = require("fs");
console.log("adjusting index file");
const fileToReplaceStuffIn = "./minified/index.html";
fs.readFile(fileToReplaceStuffIn, "utf8", function (err, data) {
  const searchString = '<link rel="stylesheet" href="src/style.css"/>';
  const regex = new RegExp("^.*" + searchString + ".*$", "gm");
  const styleFormated = data.replace(
    regex,
    '<link rel="stylesheet" href="style.min.css"/>',
  );

  const searchStringJS = '<script src="src/main.js"></script>';
  const regexJs = new RegExp("^.*" + searchStringJS + ".*$", "gm");
  const formatted = styleFormated.replace(
    regexJs,
    '<script src="main.js"></script>',
  );

  fs.writeFile(fileToReplaceStuffIn, formatted, "utf8", function (err) {
    if (err) return console.log(err);
    else {
      // console.log("Remapped style path", formatted);
      console.log("Build completed!");
    }
  });
});
