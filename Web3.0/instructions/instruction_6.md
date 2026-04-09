Context:
I am building a Hyperledger Fabric blockchain network called "NEVS" (National Employment Verification System). 
Currently, my network is configured for Fabric v2.4. My smart contract is written in Go and located in the `./chaincode/employment` directory. The basic network infrastructure (crypto materials, channel creation, anchor peers) is successfully set up and functioning.

The Problem:
I am developing on Windows using Docker Desktop and WSL2. When I attempt to run `peer lifecycle chaincode install` using the standard v2.4 "Docker-in-Docker" lifecycle, the Windows Docker proxy socket crashes with a "write: broken pipe" error due to system resource spikes and WSL2 bridging issues. 

The Goal:
I want to abandon the standard v2.4 chaincode build process and migrate this project to Hyperledger Fabric v2.5 to explicitly use the Chaincode-as-a-Service (CCaaS) deployment model. This will completely bypass the Docker socket issue by running the chaincode as an external, standalone Docker container that the peer connects to over the network.

Your Task:
Please guide me through migrating the project to the Fabric v2.5 CCaaS model by performing the following steps. Provide the exact code updates and terminal commands needed for each:

1. Update Network Configuration:
- Review my docker-compose files and provide the updates needed to bump the Hyperledger Fabric image tags from 2.4 to 2.5.
- Provide the exact environment variables I need to add to my Peer container's docker-compose definition to configure the `externalBuilders` required for CCaaS.

2. Containerize the Chaincode:
- Create a `Dockerfile` inside the `./chaincode/employment` directory to build my Go chaincode into a standalone Docker image.
- Create a `docker-compose.chaincode.yaml` (or append to my existing compose file) to spin up this new chaincode container so it runs on the same Docker network as my peers.

3. Update the Go Chaincode Code:
- Modify my Go chaincode's `main.go` file if necessary so that it starts as a server listening on a specific port (e.g., 9999) using the CCaaS pattern, rather than expecting the peer to launch it.

4. Create the Dummy Package:
- Generate the `connection.json` and `metadata.json` files required for the CCaaS package.
- Provide the exact bash commands to compress these files into a new `employment.tar.gz` package.

5. Final Deployment Commands:
- Provide the updated `peer lifecycle chaincode` bash commands to install this lightweight dummy package, approve it, and commit it to the channel.