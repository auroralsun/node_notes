const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('desktopApp', {
  platform: process.platform,
  isDesktop: true,
  isPackaged: process.env.NODE_ENV === 'production'
})
