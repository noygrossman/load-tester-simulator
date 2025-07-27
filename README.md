# Generic Load  Tester Simulator

This project is a **generic HTTP & RTP load simulator** designed to test system robustness, latency, and correctness by sending repeated and structured requests to external services and validating their responses.

---

##  Features

###  HTTP Request Simulator
- Supports `GET` and `POST` methods
- Allows dynamic key-value payload entry
- Sends requests repeatedly with defined frequency
- Compares responses to expected values (headers, status, body)
- Logs history: response time, status, repetition count, timestamp
- Editable/deletable history entries

###  RTP Transmission Simulator
- Inputs: source/destination IPs & ports, payload type
- Sends RTP-like structured packets
- Logs response data similarly to HTTP requests

---

##  Getting Started

### 1.  Client – React Application

```
cd client
npm install
npm start
```

Runs at: `http://localhost:3000`

---

### 2.  Server – Flask Backend

**Dependencies**:
- Python 
- Flask
- Flask-CORS
- PyMongo

Install dependencies:

```
pip install flask flask-cors pymongo
```

Then run:

```
cd server
python main.py       # main REST API
python receiver.py   # optional: RTP handling script
```

Runs at: `http://localhost:5000`

---

### 3. Dummy Server (Optional)

This optional Flask server mimics an external API endpoint, allowing realistic testing:

```
cd dummy_server
python main.py
```

Runs at: `http://localhost:8000`

---

##  MongoDB Setup

To log request data, the backend uses MongoDB.

Edit the connection string in `server/main.py`:

```
client = MongoClient("mongodb://<your-host>:<port>")  # or use MongoDB Atlas
```

---

---


##  Author

Developed by **Noy Grossman**, 2023  
Feel free to reach out or open an issue for questions or suggestions.

---
