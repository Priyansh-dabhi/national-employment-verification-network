#!/usr/bin/env bash

# resume_network.sh
# Safely starts existing, stopped containers without recreating them.
# This ensures that dynamically injected environment variables
# (like your CHAINCODE_ID in employment.cc) are preserved perfectly!

# Set the script's directory as the working baseline
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR/../../network/docker"

echo "🐳 Resuming Certificate Authorities..."
docker-compose -f docker-compose-ca-orderer.yaml start
docker-compose -f docker-compose-ca.yaml start
docker-compose -f docker-compose-ca-company.yaml start

echo "🚀 Resuming Orderer and Peers..."
docker-compose -f docker-compose-orderer.yaml start
docker-compose -f docker-compose-peer.yaml start
docker-compose -f docker-compose-peer1.yaml start
docker-compose -f docker-compose-peer-company.yaml start

echo "🛠️ Resuming CLI Sandbox..."
docker-compose -f docker-compose-cli.yaml start

echo "📦 Resuming CCaaS Smart Contract Server..."
docker-compose -f docker-compose.chaincode.yaml start

echo "🌐 Resuming NEVS Gateway..."
cd ../../../nevs-gateway
docker-compose start
cd ../nevs-ledger/network/docker

echo ""
echo "✅ All components resumed successfully! Your network is exactly how you left it."
echo "🔄 Current Running Containers:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

cd ../..
echo ""
echo "================================================================="
echo "🔔 Reminder: To populate your terminal environment variables,"
echo "you must run the following command in your terminal:"
echo "source setup-env.sh"
echo "================================================================="
