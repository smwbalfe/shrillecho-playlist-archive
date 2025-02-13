FROM golang:1.23-alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
COPY . ./
RUN go mod tidy
RUN go mod download
RUN go install github.com/pressly/goose/v3/cmd/goose@latest
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go

FROM alpine:latest



WORKDIR /app
COPY --from=builder /app/main .
COPY --from=builder /go/bin/goose .
COPY --from=builder /app/migrations ./migrations
EXPOSE 8080
CMD ["./main"]