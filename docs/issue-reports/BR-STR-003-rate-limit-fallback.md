# [BR-STR-003] 429 被误当成 provider 故障并继续轮换

- 状态：`Verified`
- 主分类：`fallback`
- 复现入口：`rate-limit-no-fallback`

## 现象

primary 返回 429。无条件 fallback 会把一次访问策略/限流信号放大成多 provider 请求，既不能保证成功，也会污染后续证据。

## 预期 / 实际

- 预期：只记录 primary 429，`stopReason=rate-limited`，不调用 secondary。
- 实际：无分类实现可能继续 provider 轮换。

## 根因假设与排除项

fixture 已固定 `retryAfter` 语义；这不是网络超时，也不是 5xx。

## 模拟修复

- `FIX-STR-002`：fallback 白名单只接受 transport/502/503/504，显式拒绝 429、401、403。

## 回归

- `npm test`
- 场景：`rate-limit-no-fallback`
- 断言：attempt 数为 1，stopReason 为 `rate-limited`。
