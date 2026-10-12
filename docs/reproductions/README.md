# 复现材料

## 命令

```bash
npm install
npx playwright install chromium
npm run reproduce
```

单场景：

```bash
node scripts/reproduce.mjs --scenario query-normalization
node scripts/reproduce.mjs --scenario fallback-503
```

## 场景矩阵

| 场景 | 输入 | 预期 | 关键证据 |
| --- | --- | --- | --- |
| `baseline-raw-query` | ` Browser   Retrieval ` + baseline | 空结果/未规范化 | rawQuery 与 normalizedQuery 不同 |
| `query-normalization` | 同上 + strategy-v2 | 2 条结果 | normalizedQuery=`browser retrieval` |
| `fallback-503` | `fallback` + strategy-v2 | secondary 成功 | attempts=[primary 503, secondary 200] |
| `rate-limit-no-fallback` | `rate limit` | 停止 | 429、只调用 primary |
| `semantic-empty-no-fallback` | `empty` | 停止 | semantic-empty、无 secondary |
| `repeated-cursor` | `paged-loop` | 安全终止 | stopReason=repeated-cursor |

## 证据

`evidence/latest-run.json` 只保存本地路径和结构化策略证据；trace 需要显式传 `--trace`，生成物默认忽略。
