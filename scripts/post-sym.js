const path = require("path");
const glob = require("glob");
const { existsSync, unlink } = require("fs");
const { exec } = require("child_process");
const { release } = require("../src/release.json");
const { devtool, output } = require("../config/webpack.config.prod");

// source-map文件路径，用于最后删除
let sourcemapPath = [];

// webpack的输出目录
const buildPath = output.path;

// 获取存放js文件的目录
const jsFolders = output.filename.split("[")[0];

// sentry-ci可执行程序文件路径
const sentryCliPath = `${path.join(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  "sentry-cli"
)}`;

// 检测当前应用是否开启了source-map
if (devtool.indexOf("source-map") === -1) {
  throw Error(
    `source-map必须开启! 请检查当前webpack.config.prod下的devtool值是否为source-map。当前devtool值为: ${devtool}`
  );
}

// 检测当前变量里是否存在SENTRY_PROPERTIES
if (!process.env.SENTRY_PROPERTIES) {
  throw Error(`SENTRY_PROPERTIES变量不存在`);
}

// 判断js目录是否存在
if (!existsSync(`${buildPath}/${jsFolders}`)) {
  throw Error(`${buildPath}/${jsFolders} 目录不存在`);
}

//判断输出目录里是否存js.map文件
glob(`${buildPath}/${jsFolders}/*.js.map`, (err, files) => {
  if (err) {
    throw Error(`获取js.map文件时，出现错误，错误详情: ${err}`);
  }

  if (files.length === 0) {
    throw Error(`没有找到js.map文件，请检查路径`);
  }

  sourcemapPath = files;

  uploadSourcemapsFile(`${buildPath}/${jsFolders}`);
});

/**
 * 上传source-map文件的主要逻辑
 * @param sourcemapsDir {String} 存放source-map文件的文件夹
 */
function uploadSourcemapsFile(sourcemapsDir) {
  // 检测当前配置是否正确，是否能成功连接sentry服务
  exec(`${sentryCliPath} info`, (err, output) => {
    if (output.indexOf("API request failed") !== -1) {
      throw Error(
        `用户验证失败。原因由sentry配置不正确导致，其配置文件为: ${
          process.env.SENTRY_PROPERTIES
        }\n请确保此配置文件存在，并且里面存在defaults.url、defaults.org、defaults.project、auth.token字段\n并且保证其值是正确的`
      );
    }
    uploadCore();
  });

  // 调用sentry-ci命令去上传source-map的核心代码
  function uploadCore() {
    //创建releases版本号
    const createRelease = `${sentryCliPath} releases new ${release}`;

    // 上传source-map文件到sentry的release版本上
    const uploadSourcemaps = `${sentryCliPath} releases files ${release} upload-sourcemaps ${sourcemapsDir} --url-prefix '~/${jsFolders}'`;

    exec(createRelease, (err, output) => {
      if (err) {
        throw Error(
          `创建名为: "${release}"版本号时，出现错误，错误输出为:\n${output}`
        );
      }

      exec(uploadSourcemaps, (err, output) => {
        if (err) {
          throw Error(`上传source-maps错误，错误输出为:\n${output}`);
        }

        deleteSourcemapFiles();

        console.log(`上传到sentry的${release}版本成功! 输出为:\n${output}`);
      });
    });
  }
}

// 删除source-map文件
function deleteSourcemapFiles() {
  sourcemapPath.forEach(file => {
    unlink(file, err => {
      if (err) {
        console.error(`${file}删除失败，请手工删除`);
      }
    });
  });
}
