# React-Sentry-Demo

> 在React上集成Sentry的demo

## 文件说明:

### `scripts/transform-release.js`

因为上传`source-map`到`Sentry`，需要`release`字段信息才可以。这个字段可以把它理解成`package.json`里的`version`字段。意思差不多

这个文件就是把`package.json`里的`release`字段保存成json文件，文件在`src`目录下。

src目录下有代码需要`release`字段，但是因为限制，而不能使用`import`或者`require`去引入不在src目录下的文件。所以需要把文件放在src目录下，方便去调用。打包时会把这个文件的内容打包到最终的js文件里。其实src下的代码是可以去引入根目录的package.json的文件的，但是这样一来会把整个package.json打包到最终js文件里。这样会导致项目上线时，对外暴露了整个package.json的内容。所以写了需要这个文件把package.json里的`release`字段保存成一个json文件，相当于一个中间件的作用。避免之前所说的问题。同时也减少了最终打包的大小。

这个文件会被`package.json`里的`scripts`里的`build:sentry`去调用。调用命令为: `npm run build:sentry`

生成的json文件分别被`scripts/post-sym.js`和`src/index.js`文件去引用。

### `scripts/post-sym.js`

此文件用于上传source-map文件到sentry服务器上。

上传之后，会把source-map文件删除，防止在项目上线后，source-map文件泄露。

这个文件会对当前的环境进行检查，看是否有什么意外情况导致无法上传。

### `sentry.properties`

此文件为`sentry`的配置文件，用于上传的验证和最终上传到`sentry`的哪个项目下。

```ini
defaults.url  # 为sentry的服务器，如果不写，默认就是https://sentry.io/。如果公司内网有搭建此项目，这里把地址更换下就好。
defaults.org  # 如果项目属于某一个team下，那就填写此team的名称
defaults.project  # 项目的名称
auth.token # 验证的token，需要保证此token具有以下权限: project:read、project:write、project:releases
```

### `src/SentryBoundary.js`

此组件用于捕获错误，并把错误发送到sentry服务器。这个和之前的`scripts/post-sym.js`做的两件事情，不要搞混。

此组件，是把捕获到的错误，发送到sentry服务器，但是发送到服务器的时候，js已经被混淆加密过了。所以需要`scripts/post-sym.js`文件去上传source-map，这样在`sentry`看的时候，就能准确的定位到错误的位置。下面是不上传source-map文件和上传`source-map`后的截图对比：

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

## 流程说明:

### 编写sentry.properties

首先你去sentry申请一个[API keys](https://sentry.io/settings/account/api/auth-tokens/)。保证其具有以下权限: project:read、project:write、project:releases。

打开你的项目，记录下url地址。如: `https://sentry.io/black-hole-m9/react/`，这里的`black-hole-9`就是org，`react`就是project。

根据以上信息，我们编写`sentry.properties`文件内容如下：

```ini
defaults.url=https://sentry.io/
defaults.org=black-hole-m9
defaults.project=react
auth.token=ac1c75ca4f6b4c77a47c9b15dee8dfab86fce6fc4f484363a63e9d29f0bf6572
```

### 获取release

前文也说道，sentry上传source-map需要`release`字段信息。现在我们可以确定的是这个信息，会被两处地方调用。

一次是上传的时候，告知sentry当前的`release`。一次是应用初始化捕获错误的时候，告知错误发到哪个`release`。这样一来，错误和source-map就可以对应上了。

所以根据上面的需求，编写了`scripts/transform-release.js`。同时在package.json里的scripts对象上增加了一条: `"transform-release": "node scripts/transform-release.js"`

*如果不是要上传source-map，而是上传PDB、SYM、dSYM等Symbols link(Debug Information Files)，那不需要source-map，其上传命令也是不一样。*

### 编写组件

因为我们要捕获错误，在纯JavaScript里(不含框架)的Web应用中，sentry的做法是重写`window.onerror`来达到捕获错误的功能，但是在`React`中，却不一样。需要增加一个组件，其组件在最外层。

组件的代码其实很简单，通过`componentDidCatch`来监听所有子组件的catch。然后可以通过返回一个`render`，来替换掉崩溃的组件。具体的例子可以见: [Example](https://wiggly-power.glitch.me/)，[Example源码](https://glitch.com/edit/#!/wiggly-power)

### 重写window.error

这里的重写并不是指我们来重新，sentry已经帮我们做好了，我们只需要去调用他的方法就好了。

我们打开应用的入口文件，也就是`src/index.js`，在里面通过`import Raven from "raven-js"`去引入`sentry`的包，再使用：`Raven.config(/** 配置 **/).install()`就好了

如果你没有跳过上面的部分，那你应该知道，这里就要需要`release`字段了。在`config`里，增加一个`release`字段，通过引入我们之前生成的json文件去获取

### 上传source-map

这里一定要开启生成source-map的选项。不然会报错的。上传的的命令其实就是下面这样:

```sh
sentry-cli releases new {releases字段值}
sentry-cli releases files {releases字段值} upload-sourcemaps {js文件和js.map所在目录。如果没有找到，sentry会遍历其子目录} --url-prefix '~/{过滤规则}'`;
```

这里需要注意的地方是`--url-prefix`这个字段，你可以把它想象成nginx的location。

这里假设过滤规则如下: `~/static/js/` 当打开网站访问时，请求js的url地址为:`xxx.com/static/js/js文件名.js`时，就会匹配成功，当是`xxx.com/aa/js/js文件名.js`时，将不会匹配。

我把这个些操作写成一个js脚本，让其自动化。其中包含环境检测、认证检测、上传source-map、删除本地source-map。

这个脚本就是`srcipts/post-sym.js`，同时在package.json里的scripts对象上增加了一条:
 `"post-sym": "cross-env NODE_ENV=production SENTRY_PROPERTIES=./sentry.properties node scripts/post-sym.js"`

 `NODE_ENV`这个需要是因为其文件里调用了webpack配置，如果不调用则会报错，`SENTRY_PROPERTIES`则是告知我们的sentry配置。

 ### 终章

 现在我们把上面的`npm script`统一一下，成为新的`npm script`:
 `"build:sentry": "npm run transform-release && npm run build && npm run post-sym"`

 这样，以后我们写完代码，就可以通过`npm run build:sentry`来自动化了。后续的版本迭代，只需要修改`package.json`里的`releases`就好。