---
title: "HTML Standard 中关于浏览器的 WebSocket 实现细节"
date: 2018-06-26T17:57:37+08:00
# draft: true
weight: 70
keywords: ["WebSocket", "HTML Standard", "Browser", "internals"]
tags: ["HTML Standard", "BOM"]
categories: ["技术分享"]
author: "Meowu"
# CJKLanguage: Chinese, Japanese, Korean 这样中文摘要才会生效
isCJKLanguage: true
thumbnail : "images/sea.png"
---

# WebSockets

最近要在项目中集成一个 `terminal` 用来调试 `k8s` 集群中的 `container` ，参考了一下现成的项目之后决定使用 `websocket` 来进行客户端与 `container` 的数据交换。之前并没有使用过 `websocket` 的经验，只是大概知道可以使用它来进行与服务其的双向沟通，以及 `webpack-dev-server` 也在本地使用了 `websocket` 。于是打算了解一下该协议，先是看了一下维基百科的概念定义，并不是太详细，便去详细阅读了 `whatwg` 的 `HTML Standard` 中的 `Websocket` 部分，基本上对浏览器端的 `websocket` 实现有了较为全面的了解，记录以下以便日后回顾。



> WebSocket 是一种基于 `ws` 协议的技术，它能够让我们的 Web 应用与服务器之间保持双向沟通。该协议是独立于平台的，浏览器是一个典型的 websocket 客户端，截至目前为止 `IE11` 、 `Chrome49`、 `Safari 11.1` 、`Edge 16` 之后的版本都支持原生 websocket。



## 建立连接

`Websocket` 是一个构造函数，必须通过 `new` 关键字调用它建立起连接。

```JavaScript
socket = new WebSocket(url [, protocols ] )
```

它接受两个参数，然后返回一个包含 `url`  的  `Websocket` 对象：

* 第一个是建立连接的 `url` 字符串，只支持 `ws` 和 `wss` 两种协议，否则会抛出 `SyntaxError` 错误。
* 第二个是一个协议字符串或者数组，用来指定子协议，这样的话服务器就可以根据指定的协议来执行对应的服务。如果提供了第二个参数，只有当服务器选择了其中一个子协议才能建立连接，一旦连接成功会返回选择的协议，可以通过 `socket.protocol` 获取到。默认是空字符串。



当一个 `websocket` 对象被创建的时候，它的 `readyState` 一定是 `CONNECTING` 的，同时 `extensions` 和 `protocol` 属性都是空字符串，当连接建立后可能会发生改变。此外， `websocket` 对象还有一个属性 `binaryType` 此时它必须被设置被 `blob` ，可以获取或者改变它的值。<u>浏览器可以使用该属性作为指示来处理获取到的二进制数据，如果属性设为 `blob` ，可以安全地将其存到磁盘中；如果属性设为 `arraybuffer` 可能储存在内存中更加高效。</u>



`websocket` 能够接收 `string` `Blob` 和 `arraybuffer` 这三种数据。 到了 `Gecko 11.0`，实现了接受 `ArrayBuffer`的参数的方法，但接收 [`Blob`](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob)数据类型的方法没有被实现。



当一个 `websocket` 连接建立之后，浏览器会按照队列的形式依次执行以下任务：

1. `readyState` 改变为 `OPEN` ；
2. 如果服务器返回 `extensions` 非 `null` ，则将设置该属性的值；
3. 如果浏览器使用了发送的子协议，则设置 `protocol` 属性；
4. 最后，触发 `onopen` 事件。

## 连接状态

`readyState` 代表了建立的 `Websocket` 的状态，可能会存在一下四种情况：

1. `CONNECTING = 0` 此时连接尚未被建立。
2. `OPEN = 1` 连接已经建立，可以进行沟通。
3. `CLOSING = 2` 连接已经通过了关闭握手，或者调用的 `websocket` 对象的 `close()` 方法。
4. `CLOSED = 3` 连接已经被关闭或者无法建立连接。

## 方法

### close(code, reason)

当我们不需要连接了，可以手动调用 `close` 方法关闭连接，它接收两个参数，第一个参数必须为 `1000` 或者 `3000~49999` 之间的整数。如果指定了 `code` ，`onclose` 事件对象 `event ` 中的 `code` 将为指定的值。当调用 `close` 方法的时候，将会依据当前状态不同执行以下步骤：

1. 当 `readyState` 正在关闭或者已经关闭，什么也不做；
2. 当连接尚未建立，将会使连接失败的算法，该算法会调用关闭连接算法，将 `readyState` 设为 `CLOSING` ，然后确保连接已经关闭，触发 `close` 事件。
3. 当关闭握手尚未开始，开始执行关闭握手操作，然后同样会调用关闭连接算法，将 `readyState` 设为 `CLOSING` ，然后确保连接已经关闭，触发 `close` 事件。
4. 否则将 `readyState` 设为 `CLOSING` 。同样会调用关闭连接算法。

整个流程图如下：

![websocket_close](http://oyaycf3zq.bkt.clouddn.com/websocket_close.png)

**PS:** `websocket` 对象还有一个 `bufferedAmount` 属性，它表示调用了 `send` 方法发送数据，但是尚未完全被传输到网络，停留在任务队列中的数据的字节数。如果浏览器正在发送数据，`close()` 方法不会丢弃之前已发送的但是尚未传输完毕的数据，直到其结束才会开始关闭握手操作。所以在执行 `close` 方法前最好检查一下该属性。

```JavaScript
var socket = new WebSocket('ws://game.example.com:12010/updates');
socket.onopen = function () {
  setInterval(function() {
    if (socket.bufferedAmount == 0)
      socket.send(getUpdateData());
  }, 50);
};
```

 `bufferedAmount` 通常用来确保数据传输速度不会超过网络能够处理的上限。如果网络能够达到指定速率进行数据传输的话，这段代码每 `15` 毫秒更新一次数据，否则，以网络能够处理的速度进行传输。

### send(data)

使用 `send(data)` 方法来进行数据传输，因为 `websocket` 是基于事件的 `API` ，所以需要在 `onopen` 事件的回调中执行数据传输，以确保连接已经建立，如果 `readyState` 是 `CONNECTING` ，会抛出 `InvalidStateError` 错误。可以发送的数据类型有： `sting` `Blob` `ArrayBuffer` 和`ArrayBufferView` 。

## 事件

`websocket` 总共有四个事件接口，以及每个事件对象中的事件类型（event.type） 如下：

| Event handler | Event handler event type |
| ------------- | ------------------------ |
| onopen        | open                     |
| onmessage     | message                  |
| onerror       | error                    |
| onclose       | close                    |

当 `websocket` 接受到数据的时候，会触发 `onmessage` 事件，事件对象中的 `origin` 属性表示初始化连接时提供的 `url` ，` data` 属性包含了接收到的序列化的数据。

```JavaScript
mysocket.onmessage = function (event) {
  if (event.data == 'on') {
    turnLampOn();
  } else if (event.data == 'off') {
    turnLampOff();
  }
};

```

在上面这个简单的代码中，服务器只是发送了 `on` 或者 `off` 消息。

## 总结

* `new WebSocket(url)` 建立起一个连接。
* `send(data)` 方法发送数据。
* `close(code, reason)` 关闭连接。
* ` CONNECTING` `OPEN` `CLOSING` `CLOSED`  表示四种不同的连接状态。
* 在连接的不同阶段分别触发 `onopen` `onclose` `onerror` `onmessage`  四个事件。



