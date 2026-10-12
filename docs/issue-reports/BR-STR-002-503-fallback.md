# [BR-STR-002] primary 503 时没有受控 fallback

- 状态：`Verified`
- 主分类：`fallback`
- 复现入口：`fallback-503`

## 现象

primary 返回 503，baseline 直接结束；strategy-v2 如果把 5xx 归类为可重试 provider 故障，应只调用一次 secondary 并保留 primary attempt。

## 预期 / 实际

- 预期：`primary 503 → secondary 200`，结果成功，证据包含两次调用。
- 实际：baseline 只有一次 503；未分类时无法继续检索。

## 根因假设与排除项

不是 query 或权限问题：fixture 对固定 query 返回确定的 503，secondary 固定可用。

## 模拟修复

- `FIX-STR-003`：`retrieveWithFallback` 仅在 502/503/504 或 transport error 时使用下一个 provider，并限制候选列表。

## 回归

- `npm test`
- 场景：`fallback-503`
- 断言：attempts 严格为 `[primary:503, secondary:200]`。
