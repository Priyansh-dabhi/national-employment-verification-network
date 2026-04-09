FROM golang:1.19-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o chaincode -mod=vendor .

FROM alpine:3.17
COPY --from=builder /app/chaincode /app/chaincode
EXPOSE 9998
CMD ["/app/chaincode"]
