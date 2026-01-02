# 项目开发问题记录

## 一、环境配置

### 1.1.安装tailwindcss

之前npm默认安装了最新版本v4，语法有点问题，我卸了。改成了目前主流的tailwindcss@3.4.1

### 1.2.安装zustand

这个版本为@4.5.7。

`useStore(selector, shallow)` 这种传两个参数的写法被**废弃**了，改成了使用 `useShallow` 钩子包裹。

```tsx
//旧版：useStore含2个参数
import {shallow} from 'zustand/shallow';//旧版导入方法

useStore(
    (state) => ({
      ...
    }),
    shallow
  );
//新版：useStore一个参数用useShallow包裹
import {useShallow} from 'zustand/react/shallow';//新版导入方法

useStore(
    useShallow((state) => ({
      ...
    }))
  );
```

之前还默认给我主分支安了个5.0.9的版本，reactflow自己又用一个4.5.7的版本（头大）赶紧退回4.5.7版本了

## 二、Bug记录

### 2.1.节点被选中时闪烁

在我加节点被选中时显示边框时，节点被选中时有时候会闪一下。这是由于`transition-all` 会监听所有 CSS 属性的变化。点击节点时，`ring` 的出现可能会引起极其微小的布局计算（Layout Shift），导致浏览器在绘制时“抖”了一下。

```tsx
// 把 transition-all 改成 transition-shadow
className={`... transition-shadow duration-200 ...`}
```



## 三、代码重构

### 3.1.将代码分到不同文件便于维护

随着功能增加，单文件已经 Hold 不住了。为了长线作战，我把`store.ts`和 `components\NodeInspector.tsx` 逻辑拆分到了  `services`和`components\inspector`里 。（嗯对，就是把那些if-else啥的分出去了）
