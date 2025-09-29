#!/bin/bash

# Install Sui CLI for deployment environments
# This script is designed to work on various deployment platforms

set -e

echo "🔧 Installing Sui CLI..."

# Detect the platform
PLATFORM=$(uname -s)
ARCH=$(uname -m)

echo "Platform: $PLATFORM"
echo "Architecture: $ARCH"

# Download and install Sui CLI
if [[ "$PLATFORM" == "Linux" ]]; then
    if [[ "$ARCH" == "x86_64" ]]; then
        echo "Installing Sui CLI for Linux x86_64..."
        curl -fLJO https://github.com/MystenLabs/sui/releases/latest/download/sui-ubuntu-x86_64.tgz
        tar -xzf sui-ubuntu-x86_64.tgz -C /usr/local/bin/
        chmod +x /usr/local/bin/sui
    else
        echo "Unsupported architecture: $ARCH"
        exit 1
    fi
elif [[ "$PLATFORM" == "Darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        echo "Installing Sui CLI for macOS ARM64..."
        curl -fLJO https://github.com/MystenLabs/sui/releases/latest/download/sui-macos-arm64.tgz
        tar -xzf sui-macos-arm64.tgz -C /usr/local/bin/
        chmod +x /usr/local/bin/sui
    elif [[ "$ARCH" == "x86_64" ]]; then
        echo "Installing Sui CLI for macOS x86_64..."
        curl -fLJO https://github.com/MystenLabs/sui/releases/latest/download/sui-macos-x86_64.tgz
        tar -xzf sui-macos-x86_64.tgz -C /usr/local/bin/
        chmod +x /usr/local/bin/sui
    else
        echo "Unsupported architecture: $ARCH"
        exit 1
    fi
else
    echo "Unsupported platform: $PLATFORM"
    exit 1
fi

# Verify installation
if command -v sui &> /dev/null; then
    echo "✅ Sui CLI installed successfully!"
    sui --version
else
    echo "❌ Sui CLI installation failed!"
    exit 1
fi

echo "🎉 Sui CLI installation completed!"
