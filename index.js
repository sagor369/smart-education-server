const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
require('dotenv').config()
const cors = require('cors');
const { default: Stripe } = require('stripe');
const stripe = require('stripe')(process.env.PAYMENT_KEY)
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())

const verifyjwt = (req, res, next)=>{
  const authorization = req.headers.authorization
  if(!authorization){
    return res.status(401).send({error:true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.SECRET_TOKEN,(error, decoded)=>{
    if(error){
      return res.status(401).send({error:true, message: 'unauthorized access'})
    }
    req.decoded = decoded
    next()
  })
}



const uri = `mongodb+srv://${process.env.MD_User}:${process.env.MD_Pass}@cluster0.nsogw9w.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const classCalection = client.db("smartDb").collection("populer");
    const userCallection = client.db("smartDb").collection("user");
    const addClassCallection = client.db("smartDb").collection("addClass");
    const paymentCallection = client.db("smartDb").collection("payment");


    await client.connect();

    // const isAdmin = async(req, res, next)=>{
    //   const email = req.decoded.email
    //   const query = {
    //     email: email
    //   }
    //   const result = 

    // }


    app.post('/jwt', (req,res)=>{
      const user = req.body 
      const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '3h' })
    res.send({token})
    })
// user dashboard start 
    app.post('/add-class', verifyjwt , async(req, res)=>{
      const decodedemail = req.decoded.email
      const data = req.body
      const {className, description,email ,image, instructorName,price, seats}= data
      if(decodedemail !== email){
        res.status(401).send({message:'unauthoraiz access '})
      }
      const items={
        className : className, 
        description: description ,
        image: image, 
        instructorName: instructorName,
        price: price ,
        seats: seats,
        email: email,
        classPosition :'select'

      }
      const result = await addClassCallection.insertOne(items)
      res.send(result)
    })

    app.get('/my-class', verifyjwt , async(req, res)=>{
      const email = req.decoded.email
      const query = {
        email: email,
        classPosition :'select'
      }
      const result = await addClassCallection.find(query).toArray()
      res.send(result)

    })
    app.patch('/enroll-class/:id', verifyjwt , async(req, res)=>{
      const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const query = {$set:{
        classPosition :'enroll'
      }
      }
      const result = await addClassCallection.updateOne(filter, query)
      res.send(result)

    })
    app.get('/enroll/:email', verifyjwt, async(req, res)=>{
      const email = req.params.email
      const decodedEmail = req.decoded.email 
      console.log(email)
      const query = {
        email: email,
        classPosition :'enroll'
      }
      if(decodedEmail===email){
        const result = await addClassCallection.find(query).toArray()
      res.send(result)
      }
    })

    app.delete('/delete-class/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await addClassCallection.deleteOne(query)
      res.send(result)
    })

    // user dashboard end 

    // all classes start 

    app.get('/populer', async(req, res)=>{

      const result = await classCalection.find().toArray()
      res.send(result)
    })

    app.get('/instructor-class/:email',verifyjwt,  async(req, res) =>{
      const  email= req.params.email
      const findClass = {email: email}
      const result = await classCalection.find(findClass).toArray()
      res.send(result)

    })

    app.patch('/update-class/:name', async(req,res)=>{
      const name = req.params.name
      const findClass = {className: name}
      const updateClass = await classCalection.findOne(findClass)
      if(updateClass){
        const query = {
          $set:{
            seats: updateClass.seats -1
          } 
        }
        const result  = await classCalection.updateOne(findClass, query)
        res.send (result)
      }

    })

    app.delete('/delete-class/:id' , verifyjwt, async(req, res)=>{
      const id = req.params.id 
      const findClass = {_id: new ObjectId(id)}
      const result = await classCalection.deleteOne(findClass)
      res.send(result)
    })

    // all classes end 

    // user section start 

    app.get('/users',  async(req, res)=>{
      const instructor = req.query.instructor
      const query = {role: instructor}
      const result = await userCallection.find(query).toArray()
      res.send(result)
    })

    app.get('/user-data/:email', verifyjwt,  async(req, res)=>{

      const email = req.params.email 
      const decodedEmail = req.decoded.email 
      if(decodedEmail !== email ){
        res.send({user: false})
      }

      const query = { email: email }
      const user = await userCallection.findOne(query);
      if(user?.role === 'admin'){
        res.send({admin: true,instructor:false, user:false})
      }
      else if(user?.role === 'isntructor'){
        res.send({admin: false,instructor:true, user:false})
      }
      else{
        res.send({admin: false,instructor:false,user: true})

      }

    })


    app.post('/add-users', async(req, res)=>{
      const data = req.body 
      const {email, name, photo} = data
      const query =  {
        email, name, photo, role: 'student'

      }
      const queryEmail = {
        email: email
      }
      const mutchUser = await userCallection.findOne(queryEmail)

      if(mutchUser){
        res.send({message: 'user already added'})
      }

      const result = await userCallection.insertOne(query)
      res.send (result)
    })

    // user section end 

    // payment section start 

    app.post('/payment-intent', async (req, res)=>{
      const {price} = req.body 
      const amount = parseInt(price*100);
      const intent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: intent.client_secret,
      })
    })

    app.post('/payments', verifyjwt, async(req, res)=>{
      const data = req.body 
      const result = await paymentCallection.insertOne(data)
      res.send(result)

    })
    app.get('/payments/:email', verifyjwt, async(req, res)=>{
      const email = req.params.email
      const decodedEmail = req.decoded.email
      const query = {
        email: email
      }
      if(email === decodedEmail){
        const result = await paymentCallection.find(query).toArray()
        res.send(result)
      }

    })

    // payment section end 


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir); 






app.get('/', (req, res) =>{
    res.send('assignment 12 projects running')
})

app.listen(port, ()=>{
    console.log(`server is running port ${port}`)
})