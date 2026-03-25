# Electron Notes

## 开发模式

- `npm run electron:dev`
- 该命令会并行启动 `next dev` 和 `electron`

## 打包模式

- `npm run electron:build`
- 该命令先执行 `next build`，再用 `electron-builder` 输出 Windows 安装包

## 说明

- 当前采用 `Electron + Next.js + Prisma + SQLite`
- 生产模式下 Electron 会拉起 `Next standalone server`
- `.next/static` 与 `public` 资源需要复制到 `resources/app/.next/standalone` 下，桌面端样式与脚本才会正常加载
- 默认数据库仍使用项目内的 `prisma/dev.db`
