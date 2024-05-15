const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 4000;

// middlewares
app.use(
  cors({
    origin: [
      "https://unityserve-ee43d.web.app",

      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  console.log("value of token in middle ware", token);
  if (!token) {
    return res.status(401).send({ message: "token nai" });
  }
  jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    req.user = decoded;

    next();
  });
};

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

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const loggedUser = req.user;

      const token = jwt.sign(
        {
          user,
        },
        process.env.JWT_TOKEN_SECRET,
        { expiresIn: "365d" }
      );
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.get("/posts", async (req, res) => {
      const search = req.body;

      let query = {};

      //   if (req.query?.email) {
      //     query = { "organizer.email": req.query?.email };
      //   }
      if (req.query?.title) {
        const searchTitle = new RegExp(req.query?.title, "i");
        query = { title: { $regex: searchTitle } };
      }
      const options = {
        sort: { deadline: 1 },
      };
      const cursor = postCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/myPosts", verifyToken, async (req, res) => {
      console.log("from my posts", req.user);
      console.log("from my posts 2", req.query.email);
      //   if (req.user.email !== req.query.email) {
      //     return res.status(403).send({ message: "forbidden" });
      //   }
      const query = { "organizer.email": req.query?.email };
      const options = {
        sort: { deadline: 1 },
      };
      const cursor = postCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/posts", verifyToken, async (req, res) => {
      const data = req.body;
      console.log(data);

      const result = await postCollection.insertOne(data);
      res.send(result);
    });

    app.put("/posts/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const post = req.body;
      console.log(post);
      const {
        organizer: { name, email },
        title,
        thumbnail,
        description,
        category,
        volunteersNeeded,
        location,
        deadline,
      } = post;
      const filter = { _id: new ObjectId(id) };
      const updatedPost = {
        $set: {
          organizer: { name, email },
          title,
          thumbnail,
          description,
          category,
          volunteersNeeded,
          location,
          deadline,
        },
      };
      const result = await postCollection.updateOne(filter, updatedPost);
      res.send(result);
    });

    app.delete("/posts/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await postCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/postDetails/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };

      const result = await postCollection.findOne(query);
      res.send(result);
    });

    app.get("/volunteerRequests", verifyToken, async (req, res) => {
      console.log("requested user", req.user);
      console.log("query", req.query.email);
      //   if (req.query.email !== req.user.email) {
      //     return res.status(403).send({ message: "access forbidden" });
      //   }
      const query = { volunteerEmail: req.query?.email };
      const cursor = requestCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/beAVolunteer", verifyToken, async (req, res) => {
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

    app.delete("/beAVolunteer/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };

      const result = await requestCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
