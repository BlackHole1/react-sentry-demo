const { writeFile } = require("fs");
const { release } = require("../package.json");

// 从package获取release信息，并写入到src目录下的release.json文件
writeFile("./src/release.json", `{"release": "${release}"}`, err => {
  if (err) {
    throw Error(`无法把release写入到src/release.json文件里，错误输出: ${err}`);
  }
});
