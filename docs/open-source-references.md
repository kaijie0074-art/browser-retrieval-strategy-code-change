# 开源项目引用与边界

## Playwright

- 官方仓库：[microsoft/playwright](https://github.com/microsoft/playwright)，Apache License 2.0。
- 一手机制：[Network](https://playwright.dev/docs/network) 可观察和修改 HTTP(S)、Fetch/XHR、request/response；[Trace Viewer](https://playwright.dev/docs/trace-viewer) 可查看动作、DOM、console、network 和 metadata。
- 借鉴：用浏览器触发 strategy-v2，保留 request/response 证据，不让测试依赖真实 provider。
- 边界：Playwright 提供观测能力，不替本项目判断业务语义是否正确。

## Crawlee

- 官方仓库：[apify/crawlee](https://github.com/apify/crawlee)，Apache License 2.0。
- 一手机制：[Session Management](https://crawlee.dev/js/docs/next/guides/session-management) 将 cookie、proxy、fingerprint 作为 session 状态，并在 blocked/non-working session 时更换；官方错误处理资料区分网络、HTTP 和解析错误。
- 借鉴：把 fallback 条件限制在可重试 transport/5xx，保留 blocked、429 和语义错误。
- 边界：本项目没有真实代理池、账号会话或规避访问策略能力。

## Fuse.js

- 官方仓库：[krisk/Fuse](https://github.com/krisk/Fuse)，Apache License 2.0。
- 一手机制：[Fuzzy Search](https://www.fusejs.io/fuzzy-search.html) 和官方 README 展示 typo tolerance、token search、weighted keys 与 extended search。
- 借鉴：把“query 规范化”和“结果相关性”作为可独立回归的策略层；本项目不把 fuzzy match 当作服务端真值。
- 边界：Fuse.js 适合小到中型数据集的近似匹配，不代表真实搜索索引质量。

## TanStack Query

- 官方仓库：[TanStack/query](https://github.com/TanStack/query)，MIT License。
- 一手机制：[Query Retries](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries.md) 支持按 failureCount/error 决定 retry，并默认使用递增 backoff。
- 借鉴：将 retry/fallback 设计成显式策略，而不是无限重试；回归中断言拒绝条件。
- 边界：本项目不使用 TanStack Query，也不声称实现了其 cache 生命周期。

## 许可证纪律

只引用公开机制和链接，不复制源代码。外部许可证不因本项目 MIT 许可证而改变；未来若复制代码，必须重新做兼容性评审。
