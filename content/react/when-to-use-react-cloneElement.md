---
title: "React.cloneElement 的使用"
date: 2020-06-30T23:33:29+08:00
keywords: ["react", "React.cloneElement", "react cloneElement 的使用", "react beginner", "React.cloneElement usage", "react tricks"]
tags: [reactjs", "JavaScript", "TypeScript"]
categories: ["技术分享", "源码阅读"]
author: "Meowu"
---

因为要接手维护一些项目，团队的技术栈最近从 vue 转向 react ，作为一个 react 新手，加上一向喜欢通过源码来学习新的东西，就选择了通过阅读 `antd` 这个大名鼎鼎的项目源码来学习一些 `react` 的用法。

在阅读源码的过程中，发现好些组件都使用了 `React.cloneElement` 这个 api ，虽然通过名字可以猜测它做了什么，但是并不知道具体的作用；然后去看官方文档，文档很清晰地描述了它的作用，却没有告诉我们什么场景下需要使用它。于是我根据文档的描述，结合源码的使用，面向 `google` 和 `stackoverflow`，总结出来一些使用场景。

## cloneElement 的作用

```ts
React.cloneElement(
  element,
  [props],
  [...children]
)

```

首先看一下官方文档对这个 API 的描述：

> Clone and return a new React element using element as the starting point. The resulting element will have the original element’s props with the new props merged in shallowly. New children will replace existing children. key and ref from the original element will be preserved.

总结下来就是：

1. 克隆原来的元素，返回一个新的 React 元素；
2. 保留原始元素的 props，同时可以添加新的 props，两者进行浅合并；
3. key 和 ref 会被保留，因为它们本身也是 props ，所以也可以修改；
4. 根据 react 的源码，我们可以从第三个参数开始定义任意多的子元素，如果定义了新的 children ，会替换原来的 children ；

## 使用场景
根据上面的定义分解，我们可以在不同的场景下根据需要来使用这个 api 。

#### 添加新的 props

当我们创建一个通用组件时，根据内部的逻辑，想要给每个子元素添加不同的类名，这个时候我们可以修改它的 `className` ：

假设我们有一个 `Timeline` 组件，允许我们根据需要定义多个 `TimelineItem` ，在内部我们想要给最后一个`TimelineItem` 添加一个 `timeline-item-last` 类来渲染特殊的效果，这个时候我们可以这样做：

```ts
const MyTimeline = () => {
  return (
    <Timeline>
      <TimelineItem>2020-06-01</TimelineItem>
      <TimelineItem>2020-06-08</TimelineItem>
      <TimelineItem>2020-07-05</TimelineItem>
    </Timeline>
  )
}

// 在 Timeline 内部，逻辑可能是这样的
import class from 'classnames';
const Timeline = props => {
  // ...
  // ...
  const itemCount = React.children.count(props.children);
  const items = React.children.map(props.children, (item, index) => {
    return React.cloneElement(item, {
      className: class([
        item.props.className,
        'timeline-item',
        index === count - 1 ? 'timeline-item-last' : ''
      ])
    })
  }
  return <div className={'timeline'}>{ items }</div>
}
```

除了添加 `className` ，还可以动态给子组件添加更多的 props 信息，`react-router` 的 `Switch` 会给匹配的子组件添加 `location` 和 `computedMatch` 信息：

```ts
class Switch extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Switch> outside a <Router>");

          const location = this.props.location || context.location;

          let element, match;

          // We use React.Children.forEach instead of React.Children.toArray().find()
          // here because toArray adds keys to all child elements and we do not want
          // to trigger an unmount/remount for two <Route>s that render the same
          // component at different URLs.
          React.Children.forEach(this.props.children, child => {
            if (match == null && React.isValidElement(child)) {
              element = child;

              const path = child.props.path || child.props.from;

              match = path
                ? matchPath(location.pathname, { ...child.props, path })
                : context.match;
            }
          });

          return match
            ? React.cloneElement(element, { location, computedMatch: match })
            : null;
        }}
      </RouterContext.Consumer>
    );
  }
}

```

#### 修改 props 的事件

假设我们有一个 `Tab` 组件，它下面包含多个 `TabPane` 子组件，我们想要点击每个 `TabPane` 子组件的同时触发 `Tab` 的 `onClick` 事件，用户自己本身可能给每个 `TabPane` 定义了独立的 `onClick` 事件，这时候我们就要修改子组件 `onClick` 事件：

```ts
const Tab = props => {
  const { onClick } = props;
  const tabPanes = React.children.map(props.children, (tabPane, index) => {
    const paneClick = () => {
      onClick && onClick(index);
      tabPane.props?.onClick();
    }
    return React.cloneElement(tabPane, {
       onClick: paneClick,
    })
  })
  return <div>{ tabPanes }</div>
}
```

#### 定制样式

创建一个叫 `FollowMouse` 组件时，我们允许用户定义内容组件 `Content` ，当鼠标移动时，根据内容的大小，自动计算 `Content` 的位置避免溢出屏幕，这个时候我们就可以使用 `cloneElement` 来动态修改它的样式。

```ts
// 简单起见，这里省略鼠标事件。
const FollowMouse = props => {
  const { Content } = props;
  const customContent = React.isValidElement ? Content : <span>{ Content }</span>
  const getOffset = () => {
    return {
      position: 'absolute',
      top: ...,
      left: ...,
    }
  }
  const renderContent = React.cloneElement(custonContent, {
    style: {
      ...getOffset()
    }
  })
  return <div>{ renderContent() }</div>
}
```

#### 添加 key 

当我们创建一个元素列表时，可以通过 `cloneElement` 给每个节点添加一个 `key` 。
```ts
const ComponentButton = props => {
  const { addonAfter, children } = props;
  const button = <button key='button'>{ children }</button>
  const list = [button, addonAfter ? React.cloneElement(addonAfter, { key: 'button-addon' } : null)
  return <div>{ list } <div>
}
```

## 总结
在开发复杂组件中，经常会根据需要给子组件添加不同的功能或者显示效果，react 元素本身是不可变的 (immutable) 对象， `props.children` 事实上并不是 `children` 本身，它只是 `children` 的描述符 (descriptor) ，我们不能修改任何它的任何属性，只能读到其中的内容，因此 `React.cloneElement` 允许我们拷贝它的元素，并且修改或者添加新的 `props` 从而达到我们的目的。

当然，得益于 react 强大的组合模式，这并不仅仅局限于 `props.children` ，不管是 `props.left` 还是 `props.right` 或者任何其它的 `props` 传进来的内容，只要是合法的 react 元素，我们都可以使用这个 `React.cloneElement` 对其进行操作。

