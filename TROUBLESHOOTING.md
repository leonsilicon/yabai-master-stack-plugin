# Troubleshooting Guide

## JSON Parse Error

If you encounter a `SyntaxError: JSON Parse error: Unable to parse JSON string`, follow these steps:

### 1. Test Yabai Connectivity

Run the test script to check if yabai is working properly:

```bash
node test-yabai.js
```

This will test all the yabai commands used by the plugin and show you exactly what's happening.

### 2. Check Yabai Installation and Service

#### Verify yabai is installed:
```bash
which yabai
```

#### Check if yabai service is running:
```bash
brew services list | grep yabai
```

#### Start yabai if it's not running:
```bash
brew services start yabai
```

### 3. Check System Permissions

Yabai requires accessibility permissions to work properly:

1. Go to **System Settings > Privacy & Security > Accessibility**
2. Make sure `yabai` is listed and enabled
3. If not, click the `+` button and add the yabai binary

### 4. Verify Configuration

Create the configuration directory and file:

```bash
mkdir -p ~/.config/ymsp
cp config-template.json ~/.config/ymsp/ymsp.config.json
```

Edit the configuration file to match your setup:

```json
{
  "masterPosition": "right",
  "moveNewWindowsToMaster": false,
  "debug": true,
  "yabaiPath": "/opt/homebrew/bin/yabai"
}
```

**Note**: The `yabaiPath` should match the output of `which yabai`.

### 5. Test Individual Commands

Test the specific commands that are failing:

```bash
# Test displays query
yabai -m query --displays

# Test focused display query
yabai -m query --displays --display

# Test spaces query
yabai -m query --spaces

# Test focused space query
yabai -m query --spaces --space

# Test windows query
yabai -m query --windows
```

Each command should return valid JSON. If any command fails, that's the source of your issue.

### 6. Enable Debug Mode

Set `"debug": true` in your configuration file to get detailed logging:

```bash
tail -f ~/.ymsp-log
```

This will show you exactly what commands are being executed and what output is being received.

### 7. Common Issues and Solutions

#### Issue: "could not access socket"
**Solution**: Yabai service is not running. Start it with `brew services start yabai`.

#### Issue: "permission denied"
**Solution**: Yabai needs accessibility permissions. Add it in System Settings.

#### Issue: Empty output
**Solution**: Check if you have any windows open. Yabai won't return data if there are no windows.

#### Issue: Invalid JSON
**Solution**: This usually means yabai is returning an error message instead of JSON. Check the stderr output.

### 8. Manual Yabai Test

If the test script doesn't work, try this manual test:

```bash
# Start yabai service
yabai --start-service

# Wait a moment, then test
yabai -m query --displays
```

### 9. Reset Yabai

If all else fails, try resetting yabai:

```bash
# Stop yabai
brew services stop yabai

# Kill any remaining processes
pkill yabai

# Start yabai
brew services start yabai

# Test again
yabai -m query --displays
```

### 10. Check Logs

The plugin now includes comprehensive error handling and logging. Check the debug log:

```bash
cat ~/.ymsp-log
```

This will show you exactly what commands were executed and what errors occurred.

## Still Having Issues?

If you're still experiencing problems after following these steps:

1. Run `node test-yabai.js` and share the output
2. Check `~/.ymsp-log` for error details
3. Verify your macOS version and yabai compatibility
4. Consider reinstalling yabai: `brew reinstall yabai` 