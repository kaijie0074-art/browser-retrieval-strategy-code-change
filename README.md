# 浏览器检索策略或代码的具体修改

模拟一次浏览器检索客户端策略升级：从 baseline 的“原样 query、单 provider、失败即结束”，变更为 strategy-v2 的“query 规范化、明确 provider 路由、受控 fallback、游标分页保护”。

这是本地确定性工程演练，不连接真实搜索引擎、不使用真实账号，也不声称任何上游项目已经修复本项目缺陷。

## 快速开始

要求：Node.js 20+、npm、Playwright Chromium。

```bash
npm install
npx playwright install chromium
npm run reproduce
npm test
npm run check
```

- `npm run reproduce`：在 Chromium 中运行默认策略变更场景，生成 `evidence/latest-run.json`。
- `npm test`：运行纯函数、provider fallback、分页和浏览器回归。
- `npm run check`：检查文档、FIX 引用、场景和敏感信息。

单场景：

```bash
node scripts/reproduce.mjs --scenario fallback-503
```

## 修改内容

| 维度 | baseline | strategy-v2 |
| --- | --- | --- |
| query | 原样发送 | trim、大小写统一、去重 token、稳定排序 |
| provider | 只调用 primary | 按 query 路由，5xx/transport 才允许有限 fallback |
| 429/401/403 | 统一结束 | 记录策略/会话信号，不盲目切 provider |
| 空结果 | 直接当成功 | 保留 semantic-empty，不把它当网络错误 |
| 分页 | 可能重复 cursor | 记录 cursor，重复 cursor 立即停止 |
| 证据 | 只返回结果 | 暴露 provider、attempt、status、query、nextCursor 和 stopReason |

## 文档路径

- [`docs/strategy-change.md`](docs/strategy-change.md)：变更设计、接口和拒绝的替代方案。
- [`docs/open-source-references.md`](docs/open-source-references.md)：Playwright、Crawlee、Fuse.js、TanStack Query 一手资料。
- [`docs/reproductions/README.md`](docs/reproductions/README.md)：fixture 场景和复现命令。
- [`docs/issue-reports/`](docs/issue-reports/)：问题报告。
- [`docs/repair-references.md`](docs/repair-references.md)：模拟修复引用。
- [`docs/regression-records/`](docs/regression-records/)：回归证据。
- [`work/wayfinder-map.md`](work/wayfinder-map.md)：任务地图和验收闸门。

## 安全与许可证

本项目采用 MIT License。不会提交 Cookie、Authorization、代理凭据、验证码、真实检索数据或 trace 生成物。外部项目仅作机制引用，许可证以各自官方来源为准。
