const path = require("path");

module.exports = {
    mode: "production",
    entry: "./src/index.ts",
    output: {
        filename: "build.js",
        path: path.resolve(__dirname, "public"),
  },
};
