# 模拟修复引用

`FIX-*` 是本项目内部引用，不是任何上游项目真实 commit。

| 修复 ID | 报告 | 代码位置 | 修复动作 | 回归 |
| --- | --- | --- | --- | --- |
| FIX-STR-001 | BR-STR-001 | `src/strategy.mjs:normalizeQuery` | 稳定规范化 query，保留 raw/normalized 两份证据 | `query-normalization` |
| FIX-STR-002 | BR-STR-002 | `src/strategy.mjs:isFallbackAllowed` | 仅允许 transport/502/503/504 fallback，拒绝 429 和权限错误 | `rate-limit-no-fallback` |
| FIX-STR-003 | BR-STR-003 | `src/strategy.mjs:retrieveWithFallback` | 记录 primary 失败并只调用一次 secondary | `fallback-503` |
| FIX-STR-004 | BR-STR-004 | `src/strategy.mjs:collectPages` | 检测重复 cursor 和最大页数 | `repeated-cursor` |
| FIX-STR-005 | BR-STR-005 | `scripts/reproduce.mjs` | 采集浏览器 response、provider attempts 和 stopReason | 全部场景 |

## 规则

- 报告先引用 `BR-*`，修复引用再引用 `FIX-*`，回归记录引用场景 ID。
- 只有代码和回归都通过，报告才标记 `Verified`。
