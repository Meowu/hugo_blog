---
title: "Import Assertions"
date: 2022-01-31T22:49:58+08:00
draft: true
keywords: ["import assertions", "ESNext Stage3", "TypeScript 4.5"]
tags: ["JavaScript"]
categories: ["技术分享"]
author: "Meowu"
---


在现代开发模式中， 我们经常会想直接在 _JavaScript_  代码中导入其它类型的文件，比如 `.css` `.json` 等，代码打包工具可以通过配置之类的方法帮我们把这些非 JS 的资源转换成 JS 能够理解的内容，例如 webpack 可以在 import 的时候指定相关的 _loader_ ：

```javascript
import Styles from 'style-loader!css-loader?modules!./styles.css';
```

然而有的时候我们可能会从网络上导入一些第三方的文件，例如：

```javascript
import data from 'https://third-party.com/data.json'
```

这个时候我们假设返回的就是一份 JSON 数据直接拿去用的话可能就会出现安全隐患，因为[基于文件名去决定文件内容的类型](https://github.com/tc39/proposal-import-assertions/blob/master/content-type-vs-file-extension.md)是不靠谱的。

浏览器会基于返回文件的 `Content-Type` 对内容进行解析，如果第三方服务器出错或者恶意返回错误的 MIME type ，例如我们导入一个 JSON 文件却返回一个 `application/javascript` 类型并且包含的也是可执行的 JS 内容，那么可能就会导致代码被意外执行。所以[导入非 JS 模块需要一个更加可靠的方法](https://github.com/WICG/webcomponents/issues/839)。

JS 的最新特性 [Import Assertions](https://github.com/tc39/proposal-import-assertions) 提供一个新的方式，让我们可以在导入一个模块时指定额外的模块信息。

```javascript

// foo.json
{ "name": "Meowu" }

// index.js
import foo from './foo.json' assert { type: 'json' };
console.log(foo.name);

```

跟在 `assert` 后面的是一个对象，这样便于后面语言的扩展，支持更多的属性。目前只有 `type` 属性是有效的。

现在我们可以这样 `import` 一个第三方文件：

```javascript
import data from 'https://third-party.com/data.json' assert { type: 'json' }
```

如果返回的文件 MIME type 不符合要求就会导入失败。

类似导入，我们从另外一个模块导出时也可以进行断言：

```javascript

// foo.js
export const name = 'foo';

// index.js
export { name } from './foo.js' assert { type: 'javascript' } 
```

## 动态 import

我们还可以在动态的 `import` 函数里通过第二个参数来进行类型断言，同样考虑到向前兼容，第二个参数也是一个对象字面量，它目前只有 `assert` 一个字段。

```javascript
import('foo.json', { assert: { type: 'json' } })
```

除了以上方式，未来也许还可以通过以下方式在 wasm 或者 html 中导入模块。

```javascript
// web worker
new Worker("foo.wasm", { type: "module", assert: { type: "webassembly" } });

// html
<script src="foo.wasm" type="module" asserttype="webassembly"></script>
```


## 总结
目前只支持断言文件的类型，但在语言设计上使用了便于前向兼容的对象字面量，也许在未来我们还可以断言更多的属性。

目前通过 **import assertions** 来导入 JSON 模块已经默认在 _Chromium 91_ 上可用。

从 [TypeScript 4.5](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#import-assertions) 起也已经支持该特性。