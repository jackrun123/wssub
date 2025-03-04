# 部署说明

1. 在 `存储和数据库 > KV` 创建一个KV命名空间，名称可以随意，例如 `CDNIP`。
2. 在 `Workers 和 Pages` 创建一个 `Worker`，创建后编辑代码，把_worker.js的代码复制进去部署。
3. 绑定KV命名空间，在 `Workers 和 Pages` 里，进入你的worker，在 `设置 > 绑定` 里，添加一个KV命名空间，变量名称必须填写 `CDNIP`，KV 命名空间选择你刚才创建的。

# 支持客户端
- v2rayN
- clash