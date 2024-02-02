---
title: "JS 对象展开语法 ..."
date: 2024-01-31T22:44:05+08:00
keywords: ["ECMAScript 262", "HTML Standard Specification", "JS 的对象展开语法","JavaScript Deep Dive", "JavaScript arguments", "JS internals"]
tags: ["ECMAScript 262", "Specification", "HTML Standard", "JavaScript", "internals"]
categories: ["技术分享"]
---

ES6 新增的对象展开语法可以让我们很方便地将数组的元素迭代为函数的参数。在此前，我们一般使用函数的 `apply` 方法将参数批量传给函数进行调用：

```js
  function foo(x, y, z) {}
  const coor = [1, 2, 3]
  foo.apply(null, coor)
```

现在通过对象展开语法，可以这样写：

```js
  function foo(x, y, z) {}
  const coor = [1, 2, 3]
  foo(...coor)
```

然而，之前实现一个对 `buffer` 数据进行 `base64` 编码方法，在使用 `...` 传参的时候遇到了堆栈溢出的问题，代码如下：
	    
```js

  function base64encode(input) {
      return btoa(String.fromCharCode(...new Uint8Array(input)))
  }
  
  // use apply also produce `RangeError: Maximum call stack size exceeded`
  function base64encode(input) {
      return btoa(String.fromCharCode.apply(null, new Uint8Array(input)))
  }

```

不管是使用展开语法还是 `apply` 都导致堆栈溢出，查了一下 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/apply) 上的文档，有一句这样的提示：*通过使用 `apply()`（或展开语法）来处理任意长的参数列表，你可能会超过 JavaScript 引擎的参数长度限制。* 

根本原因是函数的参数是存储在堆栈中的，所以当我们有一个超大的参数列表时，不管使用 `...` 展开语法，还是 `apply` 方法都会引发栈溢出，包括 `arr.push(...arr2)` 也一样。最好的办法就是逐个或者分批传入参数来调用函数。我把代码改成下面这样就正常了：
	    
```js
  function base64encode(input) {
      const s = []
      new Uint8Array(input).forEach(i => s.push(String.fromCharCode(i)))
      return btoa(s.join(''))
  }
```

具体这个参数列表多大才会导致溢出，不同的浏览器实现不一样，这里有一个比较详细的参考：[browser-javascript-stack-size-limit](https://stackoverflow.com/questions/7826992/browser-javascript-stack-size-limit) 。最好是只有当我们确定这个参数列表不会太大时，才使用展开语法或者 `apply` 方法，不然安全的做法是逐个调用。

### 性能

在此之前，合并两个数组我们一般用 `concat` 方法，现在我们可以使用对象展开语法来优雅地合并两个数组：

```js
  const arr1 = [0, 1, 2];
  const arr2 = [3, 4, 5];
  const arr3 = [...arr1, ...arr2];
```

然而数组中对象展开语法的性能跟 `concat` 相比差别比较大，因为 `concat`  方法只会考虑它要合并的对象是不是一个数组，如果是就把数组的元素逐个添加进来，否则就把对象作为一个整体添加进来。而 `...` 展开语法需要考虑迭代器协议，会大大降低其性能。具体对比可以参考这个回答：[spread-operator-vs-array-concat](https://stackoverflow.com/questions/48865710/spread-operator-vs-array-concat) ，还有这篇更详细的性能分析：[How slow is the Spread operator in JavaScript?](https://jonlinnell.co.uk/articles/spread-operator-performance) 。

### 总结

chromium 论坛上有个 [issue](https://bugs.chromium.org/p/chromium/issues/detail?id=704966) 对这个问题进行了比较深入的讨论，有一段描述非常详细地解释了为什么会导致栈溢出，以及为什么对象展开语法和 `apply` 方法的性能都比较差，这里贴出来作为记录：
	    
> Apply and spread are slower basically because we push the array onto the stack. Spread actually used to be much, much slower because the spec says that it must use the full iteration protocol, which has a lot of JS-observable side-effects.  
In simple cases (like in this benchmark) we can prove that actually performing the iteration won't be observable, so we just push the array onto the stack and call into Math.min, as if we literally called it with 1000 arguments.  
Given that the operation we are performing here (min) is so simple, the time taken to prove that the iteration isn't needed and push the array onto the stack is pretty large, and clearly noticeable.  
There isn't a lot we can do about the time taken to push the array. We did briefly consider keeping the array on the heap and passing a pointer to it in a special parameter-passing mode - we don't actually need to duplicate the entire array in this case. However, while Math.min doesn't modify the input array, we would need to prove that this is true for each function we wanted to use a  spread parameter with.  
Basically, this is exactly what the handwritten for/while implementations are doing - we know that we aren't modifying the array, so we don't make a copy.  
Another issue with the spread/apply approach is that you will run into a stack overflow at various different array sizes depending on the implementation - again a consequence of pushing the arguments to the stack. This stems from the fact that Math.min takes varargs parameters and then iterates over the arguments object. This makes sense for a small number of handwritten parameters, but when combined with spreads, produces the problems above.  
To summarize: It could be possible for us to avoid pushing the array to the stack in the spread/apply case. This would give a nice speedup, and remove the stack overflow problem. It might be a fair bit of work, though. Other JS engines (I think) implement spread/apply in a similar way to V8 currently, so you wouldn't be able to rely on not running into a stack overflow, or hitting a performance cliff.  
