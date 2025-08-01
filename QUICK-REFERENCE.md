# Quick Reference - Local YMSP Setup

## 🔄 Daily Workflow

### After Making Code Changes:
```bash
bun run build
ymsp focus-down-window  # Test the change
```

### Check if Local Version is Active:
```bash
which ymsp
# Should show: /Users/yourname/.nvm/versions/node/v20.x.x/bin/ymsp
```

## 🛠️ Common Commands

### Development
```bash
bun run build          # Rebuild after changes
bun install            # Install new dependencies
npm link               # Create global link (if needed)
```

### Testing
```bash
ymsp focus-down-window # Test window focus
ymsp focus-up-window   # Test window focus
node test-yabai.js     # Test yabai connectivity
```

### Troubleshooting
```bash
tail -f ~/.ymsp-log    # View debug logs
cat ~/.config/ymsp/ymsp.config.json  # Check config
brew services list | grep yabai       # Check yabai service
```

## 📋 All Available Commands

```bash
# Window Focus
ymsp focus-down-window
ymsp focus-up-window
ymsp focus-master-window

# Window Management
ymsp move-window-to-master
ymsp close-focused-window

# Master Window Count
ymsp increase-master-window-count
ymsp decrease-master-window-count

# Display Management
ymsp focus-next-display
ymsp focus-previous-display
ymsp move-window-to-next-display
ymsp move-window-to-previous-display

# System Events
ymsp on-yabai-start
ymsp window-created
ymsp window-moved
```

## ⚙️ Configuration

Location: `~/.config/ymsp/ymsp.config.json`

```json
{
  "masterPosition": "right",
  "moveNewWindowsToMaster": false,
  "debug": true,
  "yabaiPath": "/opt/homebrew/bin/yabai"
}
```

## 🚨 Reset Everything (If Needed)

```bash
npm unlink
rm -rf .build
bun install
bun run build
npm link
ymsp focus-down-window  # Test
```

## ✅ Success Indicators

- No "JSON Parse error" messages
- Debug logs show successful operations
- Window focus changes work correctly
- `which ymsp` shows your local version path 