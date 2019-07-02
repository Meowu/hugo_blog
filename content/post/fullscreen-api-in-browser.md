---
title: "浏览器全屏 API 的使用"
date: 2019-07-03T01:14:57+08:00
keywords: ["fullscreen api", "BOM", "browser fullscreen"]
tags: ["JavaScript", "BOM"]
categories: ["技术分享"]
author: "Meowu"
---

全屏 API (Fullscreen API) 给文档或者元素提供切换全屏模式的方法。全屏模式只有在以下情况才可用：

	1. 不存在窗口化插件(windowed plug-in)的文档 (Document / ShadowRoot)
	2. 根文档中的元素
	3. 设置了 `allowfullscreen` 属性的 `iframe` 元素

这意味着在frame内部的元素，以及object的内部元素不能进入全屏模式。
我们可以通过 `Document` 中的 `fullscreenEnabled` 属性来检测全屏模式是否可用：
```javascript
const fullScreenAvailable = document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled;
```
## 激活全屏模式
进入全屏模式只有一个 `API` ，通过调用 `const promise = element.requestFullscreen(options)`  来实现。如果成功进入全屏状态，它会返回一个值为 `undefined`  的 `resolved` 的 `promise` ，并且触发 `fullscreenchange`  事件；否则返回一个 `rejected`  的 `promise` ，同时触发 `fullscreenerror`  事件。
该方法还有一个可选的 `options`  对象参数，目前只有一个 `navigationUI`  可用，用来控制浏览器的导航栏，默认值是 `auto` ，交给浏览器来控制。我们可以封装一下，写出一个兼容性的请求全屏的方法：
```javascript
	const requestFullscreen = element => {
      const el = element instanceof HTMLElement ? element : document.documentElement
	  const requestFull = el.requestFullscreen ||
 						  el.webkitRequestFullscreen ||
						  el.mozRequestFullScreen ||
						  msRequestFullscreen
	  return requestFull.call(el)
}
```
## 退出全屏模式
退出全屏模式调用的是 `const promise = document.exitFullscreen()`  方法。在执行该方法之前，我们应该先判断当前是否处于全屏状态。`fullscreenchange`  事件不会告诉我们当前进行的是退出还是进入全屏模式，所以要知道当前是在什么模式下，有三个方法：

	1. 执行 `requestFullscreen`  返回 `resolved` 的 `promise`  时使用一个变量记录该状态。
	2. `document.fullscreen`  属性，但是该属性即将被废弃了。
	3. `document.fullscreenElement`  属性，如果它不为 `null` ，说明当前处于全屏模式，这是最常用的方法。
 
```javascript
const getFullElement = () => {
    return document.fullscreenElement ||
	       document.webkitFullscreenElement || 
           document.mozFullScreenElement ||
           document.msFullscreenElement
}

const exitFullscreen = () => {
  const exitFull = document.exitFullscreen || 
                   document.webkitFullscreen || 
                   document.msExitFullscreen ||
                   document.mozCancelFullScreen
  return exitFull.call(document)
}

if (getFullElement()) {
  return exitFullscreen()
}
```
综合以上的两个 `API` ，我们可以写一个简单的全屏切换功能：
```javascript
const toggleFullscreen = () => {
  if (!getFullElement()) {
    return requestFullscreen()
  } else {
    return exitFullscreen()
  }
}
```
除了编程方式外，不同的场景下用户的操作也能退出全屏，如按下 `ESC`  `F11`  或者 `Alt-Tab`  等键。
## 检测状态的变化
有时候我们可能想要在切换全屏模式后做一些操作。在切换全屏成功时我们可以监听 `fullscreenchange` 事件。但是该事件不会告诉我们是进入全屏还是退出全屏，还要结合 `document.fullscreenElement`  属性来判断；在切换全屏失败的时候可以监听 `fullscreenerror`  事件。
## 注意事项
需要注意的是，全屏 `API`  必须在对用户操作或者屏幕方向改变做出响应的时候调用，也就是说要在一个事件回调中使用，否则会失败。在 firefox 的控制台直接调用方法会报错：
![firefox-fullscreen-api-error](/images/firefox-fullscreen-api-error.png)
既然这样我尝试使用自定义事件来模拟触发一个事件：
```javascript
const activateFull = () => {
  document.onclick = () => {
    document.documentElement.requestFullscreen()
  }
  const ev = new Event('click')
  document.dispatchEvent(ev)
}
```
测试之后发现在 chrome 中可以使用，在 firefox 还是会报同样的错误。
所以最安全的使用方法还是用户点击按钮或者按下键盘然后切换全屏。
