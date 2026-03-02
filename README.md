# 🚀 Scalable Real-Time Chat Application

A production-grade, horizontally scalable real-time messaging system built using WebSockets, Redis Pub/Sub, Kafka, Docker, and Kubernetes.

This project demonstrates distributed system design principles used in large-scale applications.

---

## 📌 Project Overview

This chat application is designed to support high concurrency with low latency message delivery.

The system is built to:
- Handle thousands of concurrent WebSocket connections
- Scale horizontally using Kubernetes
- Ensure message durability using Kafka
- Synchronize events across instances using Redis
- Maintain secure authentication with JWT

---

## 🏗️ Architecture Overview

Client (React)
    ↓
Load Balancer
    ↓
Multiple Backend Instances (Node.js + Socket.io)
    ↓
Redis (Pub/Sub + Caching)
    ↓
Kafka (Distributed Message Queue)
    ↓
MongoDB (Persistent Storage)

### Key Design Decisions

- Stateless backend services
- Redis adapter for multi-instance WebSocket sync
- Kafka for decoupled message durability
- Containerized services using Docker
- Kubernetes-based horizontal scaling

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- Socket.io
- MongoDB (Mongoose)
- Redis
- Apache Kafka
- JWT Authentication
- Bcrypt

### Frontend
- React.js
- Socket.io Client
- Axios

### DevOps
- Docker
- Docker Compose
- Kubernetes
- Horizontal Pod Autoscaling

---

## ✨ Features

### Real-Time Communication
- Instant messaging using WebSockets
- Typing indicators
- Seen status
- Online user tracking

### Scalability
- Load-balanced backend replicas
- Redis Pub/Sub for distributed socket sync
- Kafka-based message processing
- Horizontal scaling via Kubernetes

### Security
- JWT-based authentication
- Password hashing with bcrypt
- WebSocket handshake validation
- CORS configuration
- Rate limiting (Redis-based)

### Reliability
- Kafka ensures message durability
- MongoDB persistent storage
- Service isolation via containers

---

## 📂 Project Structure


chat-app/
│
├── client/ # React frontend
├── server/ # Node.js backend
├── k8s/ # Kubernetes manifests
├── docker-compose.yml
└── README.md


---

## ⚙️ Running the Project

### 🐳 Run with Docker (Recommended)


docker-compose up --build


Services included:
- Backend
- MongoDB
- Redis
- Kafka
- Zookeeper

Backend runs at:

http://localhost:5000


---

## ☸️ Kubernetes Deployment

Build and push backend image:


docker build -t <your-dockerhub-username>/backend ./server
docker push <your-dockerhub-username>/backend


Deploy to cluster:


kubectl apply -f k8s/


Scale backend:


kubectl scale deployment backend --replicas=5


---

## 📈 Scalability Design

Each backend instance supports ~10,000 concurrent WebSocket connections.

To scale:
- Increase Kubernetes replicas
- Use Redis cluster mode
- Partition Kafka topics
- Add database sharding

Designed to scale from:
10K → 100K → 1M concurrent users.

---

## 🔐 Security Architecture

- JWT-based authentication
- Secure password hashing
- Distributed rate limiting via Redis
- Service-level isolation
- Prepared for HTTPS / WSS deployment

---

## 🧠 System Design Highlights

- Distributed WebSocket synchronization
- Event-driven architecture
- Fault-tolerant message handling
- Horizontally scalable microservices
- Production-ready containerization

---

## 🚀 Future Improvements

- End-to-end encryption
- Media attachments
- Push notifications
- Prometheus & Grafana monitoring
- CI/CD pipeline (GitHub Actions)
- Cloud deployment (Azure AKS / AWS EKS)

---

## 📊 Resume Impact Statement

Architected and deployed a distributed real-time chat system using WebSockets, Redis Pub/Sub, Kafka, Docker, and Kubernetes, enabling horizontal scalability and high concurrency handling.

---

## 📜 License

MIT License

---

## 👨‍💻 Author

Rupesh Kumar Sah  
Aspiring Software Engineer | Distributed Systems Enthusiast
