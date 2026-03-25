# 知识图谱笔记

一个以实体为中心的知识图谱化笔记原型，当前已开始按 Windows 桌面 `exe` 方向收口。

## 当前能力

- 实体 CRUD
- 实体 JSON 属性编辑
- 关系 CRUD
- 关系筛选与删除
- 关系 JSON 属性编辑
- 指定实体出发的 1~3 跳局部图谱
- 实体名称 / 摘要检索
- 实体模板与关系模板管理页
- 模板接入实体与关系创建流程
- Electron 桌面壳与 Windows 打包脚本骨架

## 技术栈

- `Next.js 15`
- `React 19`
- `Prisma`
- `SQLite`
- `Zod`
- `Electron`
- `electron-builder`

## Web 启动

1. `npm install`
2. `npm run prisma:generate`
3. `npm run prisma:migrate -- --name init`
4. `npm run dev`

## 桌面启动

- 开发模式：`npm run electron:dev`
- 打包目录：`npm run electron:pack`
- 打包 `exe`：`npm run electron:build`

## 当前目录

- `app/`：页面和 API
- `components/`：前端组件
- `electron/`：桌面壳入口和 preload
- `lib/`：校验和 Prisma 封装
- `prisma/`：数据库模型和迁移

## 当前阶段说明

- 现阶段已经完成 Web 项目的安装、迁移、构建验证
- 下一阶段目标是把 Electron 开发启动跑通，再把 Windows `exe` 打包链路跑通

## 下一步建议

- 安装 Electron 相关依赖并验证 `npm run electron:dev`
- 解决生产模式下 Next standalone 与 Electron 的资源路径问题
- 固化桌面版数据库路径到用户数据目录
- 增加应用图标、安装包元数据和版本信息
