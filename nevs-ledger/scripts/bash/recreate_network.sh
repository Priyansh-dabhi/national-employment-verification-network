#!/usr/bin/env bash

source setup-env.sh

cd ../../network/docker
echo "🧹 Wiping old orderer and peer ledgers..."
docker-compose -f docker-compose-orderer.yaml down -v
docker-compose -f docker-compose-peer.yaml down -v

cd ..
export FABRIC_CFG_PATH="$PWD/configtx"

echo "🧱 Regenerating Genesis Block with fixes TLS cert..."
configtxgen -profile NEVSOrdererGenesis -channelID system-channel -outputBlock system-genesis-block/genesis.block

echo "📜 Regenerating Channel Transaction..."
configtxgen -profile NEVSChannel -outputCreateChannelTx channel-artifacts/nevs-channel.tx -channelID nevs-channel

cd docker
echo "🚀 Starting Orderer and Peer nodes..."
docker-compose -f docker-compose-orderer.yaml up -d
docker-compose -f docker-compose-peer.yaml up -d

echo "⏳ Waiting for nodes to start..."
sleep 5
