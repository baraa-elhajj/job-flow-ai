# JobFlow AI
An AI-powered job application engine that automates the tedious parts of the job hunt.

## Setup

### Developement

**1. Client Setup**
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`

**2. Server Setup**
```bash
cd server
npm install
npm run dev
```
Runs on `http://localhost:4000`

Create a `.env` file in the `server/` directory:
```
PORT=4000
FRONTEND_URL="http://localhost:5173"
MONGO_URI=your_mongodb_connection_string
```

### Build for Production
```bash
# Client
cd client && npm run build

# Server
cd server && npm run build && npm start
```


