# Local Yabai Master Stack Plugin Setup

This guide explains how to maintain and update your local version of the yabai-master-stack-plugin.

## 🎯 Overview

You have a **local fixed version** of the yabai-master-stack-plugin that resolves JSON parsing errors and includes enhanced error handling. This version is linked globally, so you can use `ymsp` commands from anywhere.

## 📁 Project Structure

```
yabai-master-stack-plugin/
├── .build/                    # Built files (auto-generated)
├── bin/                       # Source files
├── tasks/                     # Task implementations
├── utils/                     # Utility functions
├── types/                     # TypeScript type definitions
├── package.json              # Dependencies and scripts
├── bun.lockb                 # Lock file
└── README-LOCAL-SETUP.md     # This file
```

## 🔧 Configuration

Your configuration is stored in `~/.config/ymsp/ymsp.config.json`:

```json
{
  "masterPosition": "right",
  "moveNewWindowsToMaster": false,
  "debug": true,
  "yabaiPath": "/opt/homebrew/bin/yabai"
}
```

### Configuration Options

- **`masterPosition`**: `"left"` or `"right"` - Where master windows are positioned
- **`moveNewWindowsToMaster`**: `true` or `false` - Auto-move new windows to master area
- **`debug`**: `true` or `false` - Enable detailed logging
- **`yabaiPath`**: Path to your yabai binary

## 🚀 Making Updates

When you make changes to the code, follow these steps:

### 1. Make Your Changes
Edit the source files in the project directory.

### 2. Rebuild the Project
```bash
cd /path/to/yabai-master-stack-plugin
bun run build
```

### 3. Test Your Changes
```bash
# Test a command to make sure it works
ymsp focus-down-window
```

The global link automatically uses the rebuilt version - no additional steps needed!

## 🔄 Complete Reset/Reinstall

If you need to completely reset your setup:

### 1. Uninstall Current Version
```bash
# Remove global link
npm unlink

# Remove global package (if installed)
bun uninstall -g yabai-master-stack-plugin
```

### 2. Clean and Reinstall
```bash
cd /path/to/yabai-master-stack-plugin

# Clean build files
rm -rf .build

# Reinstall dependencies
bun install

# Rebuild
bun run build

# Create global link
npm link
```

### 3. Verify Installation
```bash
# Check which version is being used
which ymsp

# Test a command
ymsp focus-down-window
```

## 🛠️ Development Workflow

### Making Code Changes

1. **Edit source files** in the project directory
2. **Rebuild**: `bun run build`
3. **Test**: `ymsp <command>`
4. **Repeat** as needed

### Adding New Dependencies

```bash
# Add new dependency
bun add <package-name>

# Rebuild
bun run build
```

### Updating Dependencies

```bash
# Update dependencies
bun update

# Rebuild
bun run build
```

## 📋 Available Commands

Your local version supports all these commands:

```bash
# Window Management
ymsp focus-down-window
ymsp focus-up-window
ymsp focus-master-window
ymsp move-window-to-master

# Master Window Count
ymsp increase-master-window-count
ymsp decrease-master-window-count

# Display Management
ymsp focus-next-display
ymsp focus-previous-display
ymsp move-window-to-next-display
ymsp move-window-to-previous-display

# Window Operations
ymsp close-focused-window

# System Events
ymsp on-yabai-start
ymsp window-created
ymsp window-moved
```

## 🐛 Troubleshooting

### Check if Local Version is Active
```bash
which ymsp
# Should show: /Users/yourname/.nvm/versions/node/v20.x.x/bin/ymsp
```

### View Debug Logs
```bash
tail -f ~/.ymsp-log
```

### Test Yabai Connectivity
```bash
node test-yabai.js
```

### Check Configuration
```bash
cat ~/.config/ymsp/ymsp.config.json
```

### Verify Yabai Service
```bash
brew services list | grep yabai
```

## 🔍 Debug Mode

With `"debug": true` in your config, detailed logs are written to `~/.ymsp-log`. This helps troubleshoot issues and understand what the plugin is doing.

## 📝 Key Differences from GitHub Version

Your local version includes these improvements:

- ✅ **Fixed JSON parsing errors**
- ✅ **Enhanced error handling**
- ✅ **Process completion waiting**
- ✅ **Detailed debug logging**
- ✅ **Graceful error recovery**
- ✅ **Better state file management**

## 🚨 Important Notes

1. **Always rebuild** after making code changes
2. **Keep the global link active** - don't unlink unless you're resetting
3. **Check debug logs** if something isn't working
4. **Test commands** after any changes

## 🔗 Useful Commands Reference

```bash
# Development
bun run build          # Build the project
bun install            # Install dependencies
npm link               # Create global link
npm unlink             # Remove global link

# Testing
ymsp --help            # Show available commands
ymsp focus-down-window # Test a command
node test-yabai.js     # Test yabai connectivity

# Troubleshooting
tail -f ~/.ymsp-log    # View debug logs
which ymsp             # Check which version is active
```

## 🎉 Success Indicators

Your setup is working correctly when:

- ✅ `ymsp focus-down-window` moves focus between windows
- ✅ Debug logs show successful JSON parsing
- ✅ No "JSON Parse error" messages
- ✅ Window layouts are managed correctly

---

**Remember**: Your local version is now the global default. Any changes you make to the code need to be rebuilt with `bun run build` to take effect! 