// Disposable native windows for the opt-in Vitest integration suite.
import AppKit
let app = NSApplication.shared
app.setActivationPolicy(.regular)
var windows: [NSWindow] = []
func createWindow() {
    let window = NSWindow(contentRect: NSRect(x: 100, y: 100, width: 480, height: 300),
        styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
    window.title = "YMSP Vitest \(windows.count + 1)"
    window.isReleasedWhenClosed = false
    window.makeKeyAndOrderFront(nil)
    windows.append(window)
}
for _ in 1...6 { createWindow() }
DispatchQueue.global().async {
    while let command = readLine() {
        DispatchQueue.main.async {
            switch command {
            case "new": createWindow()
            case "restore": for window in windows where window.isMiniaturized { window.deminiaturize(nil) }
            case "hide": app.hide(nil)
            case "unhide": app.unhide(nil)
            default: break
            }
        }
    }
}
app.activate(ignoringOtherApps: true)
app.run()
