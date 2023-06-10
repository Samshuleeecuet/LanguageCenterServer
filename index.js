const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000 ;
const app = express()
const stripe = require('stripe')(process.env.PAYMENT_KEY)

// middleware
app.use(cors())
app.use(express.json())

const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'});
  }
  // bearer token
  const token = authorization.split(' ')[1]

  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, function(err,decoded){
    if(err){
      return res.status(403).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const e = require('express');
const req = require('express/lib/request');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.df1ioxo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Database connection
    const database = client.db("LanguageCenter");
    const classes = database.collection("classes");
    const users = database.collection("users");
    const carts = database.collection("carts");
    const payments = database.collection("payments");
    app.post('/jwt',(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.send({token}) 
    })


    // CLasses Route 
    app.get('/classes',verifyJWT,async(req,res)=>{
      const result = await classes.find().toArray();
      res.send(result)
    })
    app.get('/allclasses',verifyJWT,async(req,res)=>{
      const query = {status: 'Approved'}
      const result = await classes.find(query).toArray();
      res.send(result)
    })
    app.get('/instructorclasses/:email',async(req,res)=>{
      const email = req.params.email;
      if(email){
        const query = {instructoremail: email}
        const result = await classes.find(query).toArray();
        res.send(result)
      }
    })
    app.post('/classes',async(req,res)=>{
      const myclass = req.body;
      const result = await classes.insertOne(myclass)
      res.send(result)
    })
    app.put('/classes',async(req,res)=>{
      const id = req.query.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: body?.status,
          feedback: body?.feedback
        }
      }
      const result = await classes.updateOne(filter,updatedDoc)
      res.send(result)
    })
    app.get('/updateclass/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await classes.find(query).toArray();
      res.send(result)
    })
    app.patch('/updateclass/:id',async(req,res)=>{
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set:{
          enrollstudent: body?.enrollstudent,
          availableseat: body?.availableseat
        }
      }
      const result = await classes.updateOne(filter,updateDoc)
      res.send(result)
    })

    // User send to db
    app.get('/users',verifyJWT,async(req,res)=>{
      const email = req.query.email;
      if(!email){
       return res.send([])
      }
      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error: true, message: 'Forbidden access'})
      }
      const result = await users.find().toArray()
      res.send(result)
    })
    app.post('/users',async(req,res)=>{
      const user = req.body;
      const query = {email : user.email}
      const existingUser = await users.findOne(query)
      if(existingUser){
        return res.send({message: 'User Already Exist'})
      }else{
        const result = await users.insertOne(user)
        res.send(result)

      }
    })

    app.patch('/users/admin',async(req,res)=>{
      const id = req.query.id;
      const role = req.query.role;
      console.log(id,role)
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          role : role
        },
      };
      const result = await users.updateOne(filter,updatedDoc)
      res.send(result)
    })
    // check user as a admin or instructor or student
    app.get('/users/admin/:email',verifyJWT,async(req,res)=>{
      const email = req.params.email;
      if(req.decoded.email !== email){
        return res.send({Admin: false , Instructor: false, Student: false })
      }
      const query ={email: email}
      const user = await users.findOne(query);
      if(user.role === 'Admin'){
        return res.send({Admin: true , Instructor: false ,Student: false})
      }
      if(user.role === 'Instructor'){
        return res.send({Admin: false , Instructor: true ,Student: false})
      }
      if(user.role === 'Student'){
        return res.send({Admin: false , Instructor: false ,Student: true})
      }

    })

    app.get('/carts',async(req,res)=>{
      const email = req.query.email;
      const purchase = req.query.purchase;
      console.log(email,purchase)
      const query = {
        purchasedBy:email,
        purchase: purchase
      }
      const result = await carts.find(query).toArray()
      res.json(result)
    })
    app.post('/addtocart',async(req,res)=>{
      const data = req.body;
      const purchasedEmail = data.purchasedBy;
      const className = data.classname;
      const query = {purchasedBy: purchasedEmail, classname : className}
      const found = await carts.findOne(query)
      if(found){
        return res.send({message: 'Class Already Added'})
      }
      const result = await carts.insertOne(data)
      res.send(result)
    })
    app.patch('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const body = req.body;
      console.log(body)
      const query = {classId: id}
      const updateDoc = {
        $set:{
          purchase: body.purchase
        }
      }
      const result = await carts.updateOne(query,updateDoc)
      console.log(result)
      res.send(result)
    })

    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const result = await carts.deleteOne({_id: new ObjectId(id)})
      res.send(result)
    })

    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    app.get('/cartspay/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {classId:id}
      const found = await carts.findOne(query)
      res.send(found)
    })

    app.post('/payments', verifyJWT, async (req, res) => {
      const payment = req.body;
      const result = await payments.insertOne(payment);
      res.send(result);
    })
  } finally {
    //await client.close();
  }
}

run()
app.get('/',(req,res)=>{
    res.send('Language Center Server Running')
})
app.listen(port)