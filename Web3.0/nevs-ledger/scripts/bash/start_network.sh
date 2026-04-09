#!/usr/bin/env bash

# start_network.sh
# Brings up all the necessary containers after a system reboot

# Set the script's directory as the working baseline
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR/../../network/docker"

echo "🐳 Starting Orderer CA..."
docker-compose -f docker-compose-ca-orderer.yaml up -d

echo "🐳 Starting Central Govt CA..."
docker-compose -f docker-compose-ca.yaml up -d

echo "🐳 Starting Company Org CA..."
docker-compose -f docker-compose-ca-company.yaml up -d

echo "🚀 Starting Orderer Node..."
docker-compose -f docker-compose-orderer.yaml up -d

echo "🚀 Starting Central Govt Peer0..."
docker-compose -f docker-compose-peer.yaml up -d

echo "🚀 Starting Central Govt Peer1..."
docker-compose -f docker-compose-peer1.yaml up -d

echo "🚀 Starting Company Org Peer0..."
docker-compose -f docker-compose-peer-company.yaml up -d

echo "🛠️ Starting CLI Sandbox..."
docker-compose -f docker-compose-cli.yaml up -d

echo "📦 Starting CCaaS Smart Contract Server..."
docker-compose -f docker-compose.chaincode.yaml up -d

echo "🌐 Starting NEVS Gateway..."
cd ../../../nevs-gateway
docker-compose up -d
cd ../nevs-ledger/network/docker

echo ""
echo "✅ Network containers are starting up in the background."
echo "🔄 Checking running containers:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

cd ../..
echo ""
echo "================================================================="
echo "🔔 Reminder: To populate your terminal environment variables,"
echo "you must run the following command in your terminal:"
echo "source setup-env.sh"
echo "================================================================="
