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



run().catch(console.dir);
app.get('/',(req,res)=>{
  res.send('abcd');
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});