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

