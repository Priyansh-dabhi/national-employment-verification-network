#!/usr/bin/env bash

echo "🔧 Setting up Fabric environment..."

# Absolute path to fabric-samples bin (Windows Git Bash format)
export FABRIC_BIN="/c/Users/narendra/Desktop/documents/web Development Programming/AA.College-final-year-project/fabric-samples/bin"
export PROJECT_ROOT="$(dirname "$(pwd)")"

# Add Fabric binaries to PATH
if [[ ":$PATH:" != *":$FABRIC_BIN:"* ]]; then
  export PATH="$FABRIC_BIN:$PATH"
fi

# Default FABRIC_CA_CLIENT_HOME (can be overridden)
if [ -z "$FABRIC_CA_CLIENT_HOME" ]; then
  export FABRIC_CA_CLIENT_HOME="$PROJECT_ROOT/../network/organizations/peerOrganizations/central.govt"
fi

echo "✅ PATH updated with Fabric binaries"
echo "✅ FABRIC_CA_CLIENT_HOME set to: $FABRIC_CA_CLIENT_HOME"

echo ""
echo "🔍 Verifying Fabric tools..."
fabric-ca-client version || {
  echo "❌ fabric-ca-client not found in PATH"
}

echo ""
echo "🎯 Environment ready."

