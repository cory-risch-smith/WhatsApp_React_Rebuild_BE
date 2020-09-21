// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1076995",
  key: "d7944df6053d5690909f",
  secret: "3713719305094e81b1f9",
  cluster: "us3",
  encrypted: true,
});

//middleware

app.use(express.json());
app.use(cors());

//DB config
const connection_url =
  "mongodb+srv://admin:ligvenSOeasXOylU@cluster0.9rnrl.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB Connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A change occured", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error Triggering Pusher");
    }
  });
});

// API Routes
app.get("/", (req, res) => res.status(200).send("hello programmer!"));

app.get("/messages/sync", (req, res) => {
  const dbMessage = req.body;

  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// Listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
