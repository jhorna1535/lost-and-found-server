require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const port = process.env.PORT || 5000;
const app = express();

app.use(cors({
  origin:['http://localhost:5173','https://whereisit-88cd2.web.app','https://whereisit-88cd2.firebaseapp.com'],
  credentials: true ,

}));
app.use(express.json());
app.use(cookieParser());

const verifyToken =(req,res,next)=>{
  const token= req.cookies?.token;
  console.log('inside the verify token'.token);

  if(!token){
    return res.status(401).send({message: "unauthorized access"})
  }
jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
  if(err){
    return res.status(401).send({message: "unauthorized access"});
  }
  req.user=decoded;
  next();
})
 
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ygrer.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
   
    console.log("Connected to MongoDB!");

    const database = client.db("LostAndFoundDB");
    const lostAndFoundCollection = database.collection("lostItems");
    const recoveredItemsCollection = database.collection("recoveredItems");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",

        })
        .send({ success: true });
    });
    app.post('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .status(200)
        .send({ success: true, message: "Logged out successfully" });
    });
    

    
    app.get("/public-lost-items", async (req, res) => {
      try {
        const result = await lostAndFoundCollection
          .find(
            {},
            { projection: { title: 1, description: 1, category: 1, location: 1, dateLost: 1, thumbnail: 1, createdAt: 1 } }
          )
          .sort({ createdAt: -1 }) 
          .limit(6) 
          .toArray();
    
        res.send(result);
      } catch (error) {
        console.error("Error fetching public lost items:", error);
        res.status(500).send({ message: "An error occurred while fetching items." });
      }
    });
    
    app.get("/lost-items",verifyToken, async (req, res) => {
      try {
        const { email } = req.query;

        let result;
        if (email) {
          result = await lostAndFoundCollection.find({ email }).toArray();
        } else {
          result = await lostAndFoundCollection.find().toArray();
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching lost items:", error);
        res
          .status(500)
          .send({ message: "An error occurred while fetching items." });
      }
    });

    app.post("/lost-items", async (req, res) => {
      const newItem = req.body;
      newItem.createdAt = new Date();
      const result = await lostAndFoundCollection.insertOne(newItem);
      res.send(result);
    });
    app.put("/lost-items/:id", async (req, res) => {
      const { id } = req.params;
      const updatedItem = req.body;
      const result = await lostAndFoundCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedItem }
      );
      if (result.modifiedCount > 0) {
        res.send({ acknowledged: true });
      } else {
        res.send({ acknowledged: false });
      }
    });

    app.get("/lost-items/:id", async (req, res) => {
      const { id } = req.params;
      const item = await lostAndFoundCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(item);
    });
    app.delete("/lost-items/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await lostAndFoundCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount > 0) {
          res.send({
            acknowledged: true,
            message: "Item deleted successfully",
          });
        } else {
          res
            .status(404)
            .send({ acknowledged: false, message: "Item not found" });
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        res
          .status(500)
          .send({ acknowledged: false, message: "Failed to delete item" });
      }
    });

    app.post("/recover-item/:id", async (req, res) => {
      const { id } = req.params;
      const recoveryData = req.body;

      const item = await lostAndFoundCollection.findOne({
        _id: new ObjectId(id),
      });
      if (item.status === "recovered") {
        return res.status(400).send({ error: "Item already recovered" });
      }

      const recoveredItem = {
        ...recoveryData,
        originalItemId: id,
        status: "recovered",
        recoveredAt: new Date(),
      };
      await recoveredItemsCollection.insertOne(recoveredItem);

      await lostAndFoundCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "recovered" } }
      );

      res.send({ success: true });
    });

    
    
      }
   
   finally {
  }
}

run().catch(console.dir);
app.get('/',(req,res)=>{
  res.send('abcd');
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});