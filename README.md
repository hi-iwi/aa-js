# aa.js  基础库

这里要依赖于抽象，而不具体实现。实现尽量通过外部注入。

## 入口方法
* aa = new Aa()
  * .uri: typeof _aaUri
  * .math: typeof _aaMath
  * .env: _aaEnv
  * .url(): _aaUrl
  * .fetch(): _aaFetch
  * .apollo(): _aaApollo

## 全局变量

下划线开头的变量表示private私有变量，禁止外部使用！

* nif
* aa

## 通用参数规则
* (vv, vk)   ====>  vk ? vv[vk] : vv
* .clone()  ===> 深度复制该类
