---
title: "设计模式之策略模式"
date: 2018-11-09T16:16:25+08:00
weight: 70
keywords: ["设计模式", "策略模式", "JavaScript插件机制", "Strategy pattern", "design patterns"]
tags: ["Design Patterns", "Architecture"]
categories: ["技术分享"]
author: "Meowu"
isCJKLanguage: true
thumbnail : "images/architecture.jpeg"
---

几个月前按要求去改一个开源项目，刚接手时觉得代码很混乱，一个文件上千行很难维护，但是也在其中学到了一些东西，例如发布订阅模式，后来看了一些大大小小的开源项目源码（例如 `vue` , `react-redux` 等）都大量使用了这种设计模式。随着工作中要写的代码越来越多，越发觉得掌握一些常用的设计模式很有必要，和同事聊天时也聊到过这个问题，既可以提高自己的代码水平和架构意识，降低代码耦合度也有利于后续的维护，遂萌生了系统学习一下设计模式的想法。恰好在 `Medium` 看到一篇介绍介绍策略模式（ strategy pattern ）的文章，觉得挺有用的，就从学习这个开始吧。

## 介绍

策略模式又叫政策（policy）模式，是对象行为型模式的一种，[《设计模式》](Design Patterns: Elements of Reusable Object-Oriented Software) 对它的介绍是：定义一系列的算法，对它们进行封装，使之可以相互替换。策略模式使得算法可以独立于使用它的客户端而变化。也就是说我们不是在代码里硬编码多种算法，然后使用 `if` 或者 `case` 语句来执行它们，而是在运行时基于不同的条件决定要使用哪种算法或者传入新的算法，大大提高了扩展性。

策略模式有一个环境 `context` ，我们不会在 `context` 里面直接实现算法，通常会在内部储存一个对算法的引用，然后再用一个方法来调用它们。

## 实现

在看策略模式的介绍的时候，让我感觉很熟悉，瞬间想到以前中学的时候做的数学题，假设班级要组团出去旅游，有多个旅行社提供不同的价格方案，我们要取哪个方案最划算呢。这里的话我们就可以以一个 `Travel` 类作为 `context` ，每个旅行社的方案作为一个算法来实现策略模式：

```javascript
// 假设旅行社的原价都一样 1000 元。
// 旅行社一： 全部人 75 折
// 旅行社二： 前 5 人原价，后面的人全部都 5 折, 不超过 5 人不打折
// 旅行社三： 每满 4 个人减免一人的费用，不满超过 4 人不打折
// 接下来我们可以实现先实现三种不同的算法

const AGENCY_ONE = function () {
  this.price = 1000
}
AGENCY_ONE.prototype.calcPrice = function(members) {
  return this.price * members * 0.75
}

const AGENCY_TWO = function () {
  this.price = 1000
}
AGENCY_TWO.prototype.calcPrice = function(members) {
  if (members > 5) {
    return 5 * this.price + (members - 5) * this.price * 0.5
  } else {
    return members * 5 * this.price
  }
}

const AGENCY_THREE = function () {
  this.price = 1000
}
AGENCY_THREE.prototype.calcPrice = function(members) {
  const freeMembers = parseInt(members / 4)
  return (members - freeMembers) * this.price
}

// context
const Travel = function() {
  this.agency = null
  this.members = 30
}
Travel.prototype.setAgency = function(agency) {
  this.agency = agency
}
Travel.prototype.getPrice = function() {
  if (this.agency) {
    return this.agency.calcPrice(this.members)
  } else {
    throw new Error("No Agency.")
  }
}

// 调用
const travel = new Travel()

const agency1 = new AGENCY_ONE()
const agency2 = new AGENCY_TWO()
const agency3 = new AGENCY_THREE()

travel.setAgency(agency1)
console.log("price of agency1", travel.getPrice())
travel.setAgency(agency2)
console.log("price of agency2", travel.getPrice())
travel.setAgency(agency3)
console.log("price of agency3", travel.getPrice())

```

这样子我们就可以计算出不同旅行社的价格，从而基于人数来决定一个最划算的方案。因为我们没有把算法封装在 `Travel` 里面，当我们需要添加更多的旅行社方案的时候，以跟前面三种方案同样的方式再定义就可以。

我们可以调用任意多的算法来计算价格，而不需要更改 `Travel` 内部的代码，`Travel` 也不关心 `AGENCY_*` 算法的实现细节，它们是相互独立的，从而降低了代码的耦合度。很明显，策略模式契合面向对象编程 `SOLID` 原则中的开闭原则（ Open/closed principle ）：对扩展开放，对修改关闭。我们可以扩展算法而不需要修改 `Travel` 的源码。

在 `JavaScript` 中策略模式经常被用来作为一个插入机制来实现插件系统，像 `vue` 的 `Vue.use()` 就在 `install` 方法中把 `Vue` 实例暴露出去，让我们可以在实例上定义我们的全局组件、`mixins` `directives` 等等，`Vue` 组件本身并不知道也不关心我们给它增加了什么，只会在运行时调用相应的插件，我们唯一要注意的就是不跟内部 `api` 冲突。



##### Reference

1. [Strategy pattern](https://en.wikipedia.org/wiki/Strategy_pattern)

2. [《设计模式》](Design Patterns: Elements of Reusable Object-Oriented Software)

   ​