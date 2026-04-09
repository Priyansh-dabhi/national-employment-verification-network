# Use a lightweight base image to build the Go chaincode
FROM golang:1.19-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy the go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the Go app (disable CGO for a statically linked binary)
RUN CGO_ENABLED=0 GOOS=linux go build -o chaincode_server

# Start a new stage from scratch for a tiny final image
FROM alpine:3.18

# Copy the binary from the builder stage
COPY --from=builder /app/chaincode_server /usr/local/bin/chaincode_server

# The port our CCaaS server will listen on
EXPOSE 9999

# Run the binary
CMD ["chaincode_server"]
