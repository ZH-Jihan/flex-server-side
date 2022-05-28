const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mongo DB conect

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u9caj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Verify JWT Token
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}


async function run(){
    try{
        await client.connect();
        const productCollection = client.db('Flex-Tols').collection('product');
        const orderCollection = client.db('Flex-Tols').collection('order');
        const userCollection = client.db('Flex-Tols').collection('user');
        const reviewCollection = client.db('Flex-Tols').collection('review');
        const profileCollection = client.db('Flex-Tols').collection('profile');

        // Varify Admin
        const verifyAdmin = async (req, ser, next) => {
          const requester = req.decoded.email;
          const requesterAccount = await userCollection.findOne({ email: requester });
          if (requesterAccount.role === "admin") {
            next();
          } else res.status(403).send({ message: "forbidden" });
        };
        // Get All Product
        

        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        // Get Single Product by id
        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const product = await productCollection.findOne(query);
            res.send(product);
        });
        // Delete product
        app.delete("/product/:id", async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const result = await productCollection.deleteOne(query);
          res.send(result);
        });
        // get review
        app.get("/review", async (req, res) => {
          const query = {};
          const cursor = reviewCollection.find(query);
          const review = await cursor.toArray();
          res.send(review);
        });

        app.post('/review' , async(req,res)=>{
          const review = req.body;
          const result = await reviewCollection.insertOne(review);
          res.send(result);
      });
        // Book Order

        

        app.get('/order/:email' , async(req , res)=>{
            const email = req.params.email;
            if(email){
                const query = {customarmail : email};
            const orders = await orderCollection.find(query).toArray();
            return res.send(orders);
            }else{
                return res.status(403).send({ message: 'forbidden access' });
            }
        });
        // get order
        app.get("/order", async (req, res) => {
          const query = {};
          const cursor = orderCollection.find(query);
          const result = await cursor.toArray();
          res.send(result);
        });
        app.get('/order/:id',async(req, res) =>{
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const orders = await orderCollection.findOne(query);
          res.send(orders);
        })
        // Order Post server
        app.post('/order' , async(req,res)=>{
            const order = req.body;
            const query = {productName : order.productName}
            const exists = await orderCollection.findOne(query);
            if (exists) {
              return res.send({ success: false, booking: exists })
            }
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });
        app.post('/product' , async(req,res)=>{
            const order = req.body;
            const result = await productCollection.insertOne(order);
            res.send(result);
        });
        // Delete order
        app.delete("/order/:id", async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const result = await orderCollection.deleteOne(query);
          res.send(result);
        });
        // Delete User
        // app.delete("/user/:email", async (req, res) => {
        //   const email = req.params.email;
        //   const result = await userCollection.deleteOne({ email: email });
        //   res.send(result);
        // });
        // Get User & Admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
          })

        app.get('/user',  async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
          });

          // Put user & Admin
          app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
          });

          app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: { role: "admin" },
            };
            const result = await userCollection.updateOne(filter, updateDoc,options);
            res.send(result);
          });
      
    }finally{

    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Running Flex-Tols server");
  });
  app.listen(port, () => {
      
  });