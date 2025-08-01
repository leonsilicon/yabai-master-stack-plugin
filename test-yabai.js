#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Test configuration
const configPath = path.join(os.homedir(), '.config/ymsp/ymsp.config.json');
let yabaiPath = '/usr/local/bin/yabai';

// Try to read config file
try {
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        yabaiPath = config.yabaiPath || yabaiPath;
        console.log(`Using yabai path from config: ${yabaiPath}`);
    } else {
        console.log(`Config file not found at ${configPath}, using default yabai path: ${yabaiPath}`);
    }
} catch (error) {
    console.log(`Error reading config: ${error.message}`);
}

// Test if yabai binary exists
if (!fs.existsSync(yabaiPath)) {
    console.error(`❌ Yabai binary not found at: ${yabaiPath}`);
    console.log('Try running: which yabai');
    process.exit(1);
}

console.log(`✅ Yabai binary found at: ${yabaiPath}`);

// Test yabai commands
const commands = [
    ['-m', 'query', '--displays'],
    ['-m', 'query', '--displays', '--display'],
    ['-m', 'query', '--spaces'],
    ['-m', 'query', '--spaces', '--space'],
    ['-m', 'query', '--windows']
];

async function testCommand(args) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔍 Testing: ${yabaiPath} ${args.join(' ')}`);
        
        const process = spawn(yabaiPath, args, {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ Command failed with exit code ${code}`);
                if (stderr) {
                    console.error(`Stderr: ${stderr}`);
                }
                resolve({ success: false, error: stderr, code });
            } else {
                console.log(`✅ Command succeeded`);
                if (stdout.trim()) {
                    try {
                        const parsed = JSON.parse(stdout);
                        console.log(`✅ JSON parsed successfully`);
                        if (Array.isArray(parsed)) {
                            console.log(`   Array with ${parsed.length} items`);
                        } else {
                            console.log(`   Object with keys: ${Object.keys(parsed).join(', ')}`);
                        }
                    } catch (parseError) {
                        console.error(`❌ JSON parse error: ${parseError.message}`);
                        console.log(`Raw output: ${stdout.substring(0, 200)}...`);
                    }
                } else {
                    console.log(`⚠️  No output`);
                }
                resolve({ success: true, output: stdout });
            }
        });
        
        process.on('error', (error) => {
            console.error(`❌ Process error: ${error.message}`);
            resolve({ success: false, error: error.message });
        });
    });
}

async function runTests() {
    console.log('\n🚀 Starting yabai tests...\n');
    
    for (const command of commands) {
        await testCommand(command);
    }
    
    console.log('\n📋 Test summary:');
    console.log('If you see JSON parse errors, check:');
    console.log('1. Is yabai running? Try: brew services list | grep yabai');
    console.log('2. Does yabai have permissions? Check System Settings > Privacy & Security > Accessibility');
    console.log('3. Is the yabai socket accessible? Try: yabai --start-service');
}

runTests().catch(console.error); 