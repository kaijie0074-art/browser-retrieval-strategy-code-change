# [BR-STR-001] 原样 query 造成等价输入结果分裂

- 状态：`Verified`
- 主分类：`input`
- 复现入口：`query-normalization`

## 现象

输入 ` Browser   Retrieval ` 在 baseline 中原样发送，fixture 返回空结果；同一语义的规范输入能返回结果。用户看到的是“检索失败”，但证据不足以区分输入噪声和 provider 故障。

## 复现步骤

1. 启动 fixture：`npm run reproduce -- --scenario baseline-raw-query`。
2. 使用 query ` Browser   Retrieval ` 和 strategy `baseline`。
3. 改用 `strategy-v2` 重复请求。

## 预期 / 实际

- 预期：等价 query 有稳定的 normalized key，并能解释 raw/normalized 差异。
- 实际：baseline 没有 normalizedQuery，结果为空。

## 根因假设与排除项

根因是客户端没有统一 trim、大小写、空白和重复 token。fixture 固定返回，排除了网络和索引波动。

## 模拟修复

- `FIX-STR-001`：`normalizeQuery` 保留 rawQuery，同时生成稳定 normalizedQuery。

## 回归

- `npm test`
- 场景：`query-normalization`、`browser-smoke`
- 结果：strategy-v2 生成 `browser retrieval` 并返回两条结果。
