# 贡献指南

## 新增策略行为

1. 在 `src/strategy.mjs` 先定义纯函数和输入输出契约。
2. 在 `fixtures/provider-server.mjs` 增加可重复 provider mode，不访问外网。
3. 在 `scripts/scenario-catalog.mjs` 增加场景、预期分类和证据字段。
4. 编写复现说明、`BR-*` 问题报告和 `FIX-*` 模拟修复引用。
5. 运行 `npm test`、`npm run check`，把结果写入 `docs/regression-records/`。

## 保护条件

- 429、401、403 和语义空结果不得被普通 5xx fallback 规则吞掉。
- fallback 必须有次数上限；分页必须检测重复 cursor。
- 证据字段记录观察值，根因假设单独写在报告中。
- 不提交真实凭据、用户数据、provider 录制或生成 trace。
