# 策略变更设计

## 问题

baseline 对 query 不做规范化，只请求 primary provider；当 primary 返回 503 时直接终止，当 429 或语义空结果时也没有区分；分页没有 cursor 去重保护。这会把输入噪声、服务故障、访问策略和内容语义混成同一类“检索失败”。

## 选中的设计

以四个纯函数组成 strategy-v2：

1. `normalizeQuery(raw)`：trim、转小写、拆 token、去重并稳定排序。
2. `selectProvider(query)`：依据 query 特征决定 primary/secondary 初始 provider。
3. `retrieveWithFallback(input)`：只在 transport/502/503/504 且仍有候选 provider 时 fallback；429/401/403/semantic-empty 直接保留证据。
4. `collectPages(fetchPage)`：继续消费 nextCursor，检测重复 cursor 和最大页数。

## 两个替代方案

- 方案 A：无条件重试/轮换 provider。拒绝原因：会放大限流、掩盖权限问题并破坏证据。
- 方案 B：把 query 规范化交给 provider。拒绝原因：不同 provider 的规范化不一致，难以回归和解释。

## 数据契约

```json
{
  "rawQuery": " Browser   Retrieval ",
  "normalizedQuery": "browser retrieval",
  "attempts": [
    { "provider": "primary", "status": 503 },
    { "provider": "secondary", "status": 200 }
  ],
  "results": [{ "id": "r-1", "title": "Browser retrieval" }],
  "nextCursor": null,
  "stopReason": "success"
}
```

## 失败行为

- 5xx fallback：返回成功结果，同时保留失败 attempt。
- 429：停止并返回 `stopReason=rate-limited`。
- 语义空：停止并返回 `stopReason=semantic-empty`，不换 provider。
- 重复 cursor：停止并返回 `stopReason=repeated-cursor`，防止死循环。
