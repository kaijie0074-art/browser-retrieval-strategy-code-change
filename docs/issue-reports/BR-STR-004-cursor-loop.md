# [BR-STR-004] 重复 cursor 导致分页循环

- 状态：`Verified`
- 主分类：`pagination`
- 复现入口：`repeated-cursor`

## 现象

fixture 对 `paged-loop` 持续返回同一个 `loop-cursor`。没有 seen-cursor 集合时，客户端会持续请求相同页面，无法给出终止证据。

## 预期 / 实际

- 预期：第一次收到 cursor 后发现下一页仍返回相同 cursor，安全停止并标记 `repeated-cursor`。
- 实际：无保护实现会进入无界循环。

## 模拟修复

- `FIX-STR-004`：`collectPages` 记录已见 cursor，并设置最大页数上限。

## 回归

- `npm test`
- 场景：`repeated-cursor`
- 断言：消费到重复 cursor 前的两页，stopReason 为 `repeated-cursor`，不会继续第三次请求。
