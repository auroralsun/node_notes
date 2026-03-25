export {}

declare global {
  interface Window {
    desktopApp?: {
      platform: string
      isDesktop: boolean
      isPackaged: boolean
    }
  }
}
