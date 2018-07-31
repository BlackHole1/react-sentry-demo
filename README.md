# React-Sentry-Demo

> 在React上集成Sentry的demo

## 文件说明:

### `scripts/transform-release.js`

因为上传`source-map`到`Sentry`，需要`release`字段信息才可以。这个字段可以把它理解成`package.json`里的`version`字段。意思差不多

这个文件就是把`package.json`里的`release`字段保存成json文件，文件在`src`目录下。

`src`下有代码需要`release`字段，但是因为限制，而不能使用`import`或者`require`去引入不在`src`目录下的文件。所以需要把文件放在`src`目录下，方便去调用。打包时会把这个文件的内容打包到最终的js文件里。其实`src`下的代码是可以去引入根目录的`package.json`的文件的，但是这样一来会把整个`package.json`打包到最终js文件里。这样会导致项目上线时，对外暴露了整个`package.json`的内容。所以写了需要这个文件把`package.json`里的`release`字段保存成一个json文件，相当于一个中间件的作用。避免之前所说的问题。同时也减少了最终打包的大小。

这个文件会被`package.json`里的`scripts`里的`build:sentry`去调用。调用命令为: `npm run build:sentry`

生成的json文件分别被`scripts/post-sym.js`和`src/index.js`文件去引用。

### `scripts/post-sym.js`

此文件用于上传`source-map`文件到`sentry`服务器上。

上传之后，会把`source-map`文件删除，防止在项目上线后，`source-map`文件泄露。

这个文件会对当前的环境进行检查，看是否有什么意外情况导致无法上传。

### `sentry.properties`

此文件为`sentry`的配置文件，用于上传的验证和最终上传到`sentry`的哪个项目下。

```
defaults.url  # 为sentry的服务器，如果不写，默认就是https://sentry.io/。如果公司内网有搭建此项目，这里把地址更换下就好。
defaults.org  # 如果项目属于某一个team下，那就填写此team的名称
defaults.project  # 项目的名称
auth.token # 验证的token，需要保证此token具有以下权限: project:read、project:write、project:releases
```

### `src/SentryBoundary.js`

此组件用于捕获错误，并把错误发送到`sentry`服务器。这个和之前的`scripts/post-sym.js`做的两件事情，不要搞混。

此组件，是把捕获到的错误，发送到`sentry`服务器，但是发送到服务器的时候，js已经被混淆加密过了。所以需要`scripts/post-sym.js`文件去上传`source-map`，这样在`sentry`看的时候，就能准确的定位到错误的位置。下面是不上传`source-map`文件和上传`source-map`后的截图对比：

![image](https://user-images.githubusercontent.com/8198408/43457174-9945b152-94f8-11e8-9aca-e8ab4069444f.png)

![image](https://user-images.githubusercontent.com/8198408/43457143-823175d2-94f8-11e8-8140-f4e04708ad7e.png)

此组件需要放在`React`的组件最外面，代码如下:

```javascript
ReactDOM.render(
  <div>
    <SentryBoundary>
      <App />
    </SentryBoundary>
  </div>,
  document.getElementById("root")
);
```