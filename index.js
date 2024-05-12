const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Unity server is running");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.0kf8y7n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    // Send a ping to confirm a successful connection

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const requestCollection = client.db("unityServe").collection("allRequests");
    const postCollection = client.db("unityServe").collection("allNeedPosts");
    app.get("/posts", async (req, res) => {
      let query = {};
      console.log(req.query.email);
      if (req.query?.email) {
        query = { "organizer.email": req.query?.email };
      }
      const options = {
        sort: { deadline: 1 },
      };
      const cursor = postCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/posts", async (req, res) => {
      const data = req.body;
      console.log(data);

      const result = await postCollection.insertOne(data);
      res.send(result);
    });

    // app.get("/posts", (req, res) => {
    //   const query = req.query;
    //   console.log(query);
    // });

    app.delete("/posts/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await postCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/postDetails/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };

      const result = await postCollection.findOne(query);
      res.send(result);
    });

    app.post("/beAVolunteer", async (req, res) => {
      const data = req.body;
      console.log(data);

      const result = await requestCollection.insertOne(data);
      res.send(result);
    });
    app.patch("/beAVolunteer/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };

      const updateData = {
        $inc: { volunteersNeeded: -1 },
      };

      const result = await postCollection.updateOne(filter, updateData);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
