#!/bin/bash
# Quick install script for local development

set -e

echo "🚀 Installing EMBuilder..."
echo ""

# Build
echo "📦 Building..."
npm install
npm run build

# Install skills
echo ""
echo "✨ Installing skills to Claude Code..."
node dist/cli.js install

echo ""
echo "✅ Done! You can now use:"
echo ""
echo "  Event Model Skills:"
echo "   /automation-slice"
echo "   /state-change-slice"
echo "   /state-view-slice"
echo ""
echo "  Configuration:"
echo "   /fetch-config"
echo ""
echo "  Yeoman Generator Skills:"
echo "   /gen-skeleton"
echo "   /gen-state-change"
echo "   /gen-state-view"
echo "   /gen-automation"
echo "   /gen-ui"
echo ""
echo "Run 'node dist/cli.js status' to verify installation"
