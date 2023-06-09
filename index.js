const express = require('express')
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000 ;

const app = express()
app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const e = require('express');
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

    // CLasses Route 
    app.get('/classes',async(req,res)=>{
      const result = await classes.find().toArray();
      res.send(result)
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

    // User send to db
    app.get('/users',async(req,res)=>{
      const result = await users.find().toArray()
      res.send(result)
    })
    app.post('/users',async(req,res)=>{
      const user = req.body;
      const query = {email : user.email}
      const existingUser = await users.findOne(query)
      console.log(existingUser)
      if(existingUser){
        return res.send({message: 'User Already Exist'})
      }
      const result = await users.insertOne(user)
      res.send(result)
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