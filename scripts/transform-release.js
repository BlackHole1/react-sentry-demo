const { writeFile, writeFileSync, readFileSync } = require("fs");
const { release } = require("../package.json");

// 从package获取release信息，并写入到release.json文件
writeFile("./release.json", `{"release": "${release}"}`, err => {
  if (err) {
    throw Error(`无法把release写入到release.json文件里，错误输出: ${err}`);
  }

  // 复制release.json文件到src目录下，用于应用获取
  copyFile("./release.json", "./src/release.json");
});

/**
 * 复制文件到指定目录
 * @param {*} src 源文件
 * @param {*} dist 将要复制的地方
 */
function copyFile(src, dist) {
  writeFileSync(dist, readFileSync(src));
}
