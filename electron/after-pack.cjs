const fs = require('fs')
const path = require('path')

function copyDirectoryContents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return
  }

  fs.mkdirSync(targetDir, { recursive: true })

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)
    fs.cpSync(sourcePath, targetPath, { recursive: true })
  }
}

exports.default = async function afterPack(context) {
  const projectDir = context.packager.projectDir
  const appOutDir = context.appOutDir
  const resourcesDir = path.join(appOutDir, 'resources')
  const appDir = path.join(resourcesDir, 'app')
  const standaloneSource = path.join(projectDir, '.next', 'standalone')
  const staticSource = path.join(projectDir, '.next', 'static')
  const publicSource = path.join(projectDir, 'public')
  const standaloneTarget = path.join(appDir, '.next', 'standalone')
  const standaloneStaticTarget = path.join(standaloneTarget, '.next', 'static')
  const standalonePublicTarget = path.join(standaloneTarget, 'public')

  fs.rmSync(standaloneTarget, { recursive: true, force: true })
  fs.mkdirSync(standaloneTarget, { recursive: true })
  fs.cpSync(standaloneSource, standaloneTarget, { recursive: true })
  copyDirectoryContents(staticSource, standaloneStaticTarget)
  copyDirectoryContents(publicSource, standalonePublicTarget)
}
