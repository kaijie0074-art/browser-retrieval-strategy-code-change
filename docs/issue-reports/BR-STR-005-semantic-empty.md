# [BR-STR-005] 语义空结果被误当网络失败

- 状态：`Verified`
- 主分类：`evidence`
- 复现入口：`semantic-empty-no-fallback`

## 现象

provider 返回 HTTP 200，但明确表示 `semanticEmpty=true`。如果客户端把空结果当成 provider outage 并 fallback，最终证据会混合两个不同问题：没有命中和服务不可用。

## 预期 / 实际

- 预期：保留 200、semantic-empty 和空结果，停止 provider 轮换。
- 实际：无语义字段时可能错误调用 secondary。

## 模拟修复

- `FIX-STR-002`：把 semantic-empty 从 transport/5xx fallback 条件中分离。
- `FIX-STR-005`：浏览器证据保留 attempts、stopReason 和响应内容。

## 回归

- `npm test`
- 场景：`semantic-empty-no-fallback`、`browser-smoke`
- 断言：attempt 只有 primary，stopReason 为 `semantic-empty`。
