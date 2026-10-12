# 浏览器检索策略/代码修改：Wayfinder Map

> 状态：已验证，待远程仓库创建与最终一致性核对
> 建立日期：2026-10-12
> 项目中文名：浏览器检索策略或代码的具体修改
> 仓库目标：`browser-retrieval-strategy-code-change`

## Destination

交付一个可独立运行的策略变更模拟项目：用本地检索 API 和 Chromium fixture 对比 baseline 与 strategy-v2，验证查询规范化、策略路由、fallback、分页游标和证据字段没有被静默改变。

## Notes

- 变更主题：浏览器检索客户端从“原样请求 + 失败即结束”升级为“规范化 query + 明确 provider 路由 + 受控 fallback + 游标分页”。
- 证据优先：请求 URL、provider、attempt、HTTP 状态、结果、nextCursor 和最终策略必须可读。
- 参考基线：Playwright network/HAR/trace、Crawlee retry/session、Fuse.js 模糊检索、TanStack Query 的 query key/cache 语义。

## Decisions so far

- 采用本地 provider fixture，不连接真实搜索引擎；使用 Chromium 触发页面检索。
- 将策略变更拆成纯函数 `normalizeQuery`、`selectProvider`、`retrieveWithFallback`、`paginate`，页面只负责调用和展示。
- fallback 只允许在可重试的 transport/5xx 条件触发；429、401/403 和语义空结果不盲目 fallback。

## Acceptance gates

- [x] `npm test` 覆盖 baseline 与 v2 的成功、query 规范化、provider fallback、限流保护、分页重复保护。
- [x] `npm run check` 检查报告、FIX 引用、文档链接和敏感信息。
- [x] 五份问题报告均有复现入口、修复引用和回归结果。
- [x] 真实上游项目只作机制引用，不声称其修复本项目代码。
- [ ] Public GitHub 仓库内容与本地 commit 一致。

## Evidence

- `npm test`：PASS，9 个 retrieval strategy checks。
- `npm run check`：PASS，5 个问题报告、27 个文件扫描。
- `npm run reproduce -- --scenario fallback-503`：PASS，观测到 primary 503 → secondary 200。
- `docs/regression-records/浏览器检索策略-回归记录-20261012.md` 已回填 Chromium 156.0.8078.4 和结果矩阵。

## Not yet specified

- 跨浏览器策略差异：本轮只固定 Chromium，作为后续矩阵。
- Provider 成本/延迟真实基准：本轮只验证状态和调用顺序，不做生产性能结论。

## Out of scope

- 真实搜索引擎压测、验证码绕过、代理轮换和账号登录。
- 把 fuzzy match（模糊匹配）当成事实检索正确性的证明。
- 未授权复制第三方项目代码或数据。
