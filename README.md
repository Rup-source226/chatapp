# Scalable Real-Time Chat Application

A production-ready real-time chat application with WebSocket support, Redis caching, Kafka message queue, and Kubernetes deployment.

## 🚀 Features

- ✅ Real-time messaging with WebSocket (Socket.io)
- ✅ Redis caching for performance optimization
- ✅ Kafka message queue for scalable message processing
- ✅ Typing indicator
- ✅ Seen status (read receipts)
- ✅ Horizontal scaling with multiple server instances
- ✅ Dockerized services
- ✅ Kubernetes deployment ready

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-------------|
| Frontend | React |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Database | MongoDB |
| Cache | Redis |
| Queue | Apache Kafka |
| Container | Docker |
| Orchestration | Kubernetes |

## 📁 Project Structure

```
chat-app/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.js
│   └── Dockerfile
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── sockets/
│   │   └── index.js
│   └── Dockerfile
│
├── k8s/
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── redis-deployment.yaml
│   ├── kafka-deployment.yaml
│   └── services.yaml
│
├── docker-compose.yml
└── README.md
```

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB (local or Atlas)
- Redis
- Kafka

### Local Development with Docker Compose

```
bash
# Clone the repository
git clone <repository-url>
cd chat-app

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Manual Setup

#### Backend

```
bash
cd server
npm install
# Configure environment variables
cp .env.example .env
npm start
```

#### Frontend

```
bash
cd client
npm install
npm start
```

## 🔧 Environment Variables

### Server (.env)

```
env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKER=localhost:9092
JWT_SECRET=your-secret-key
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Messages
- `GET /api/messages/:conversationId` - Get messages for a conversation
- `POST /api/messages` - Send a message

## 🔌 WebSocket Events

### Client → Server
- `join` - Join a conversation room
- `leave` - Leave a conversation room
- `message` - Send a new message
- `typing` - Typing indicator
- `seen` - Mark messages as seen

### Server → Client
- `message` - Receive new message
- `typing` - Typing indicator update
- `seen` - Read receipt update
- `userOnline` - User online status

## ☸️ Kubernetes Deployment

```
bash
# Apply Kubernetes configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

## 📈 Architecture

```
                    ┌─────────────┐
                    │   Client    │
                    │  (React)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Load       │
                    │  Balancer   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │ Server  │      │ Server  │      │ Server  │
    │  Node   │      │  Node   │      │  Node   │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐ ┌─────▼────┐ ┌────▼────┐
         │ MongoDB │ │  Redis   │ │  Kafka  │
         └─────────┘ └──────────┘ └─────────┘
```

## 📝 License

MIT License - feel free to use this project for learning or production.
