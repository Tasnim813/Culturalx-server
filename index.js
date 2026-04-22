const express = require('express')
const cors=require('cors')
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT|| 3000


// middleware
app.use(express.json());
app.use(cors());

// app.use(
//   cors({
//     origin: [
//       'http://localhost:5173',
//       'http://localhost:5174',
//       'https://localchefbazar-client.vercel.app',
//     ],
//     credentials: true,
//     optionSuccessStatus: 200,
//   })
// )


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6t2ckxo.mongodb.net/?appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
   
    const db=client.db('eventDB')
    const eventCollection=db.collection('events')
const bookingCollection = db.collection('bookings')
    // save events data
    app.post('/events',async(req,res)=>{
       const eventData=req.body;
       console.log(eventData)
       const result=await eventCollection.insertOne(eventData)
       res.send(result)
    })

    // get all event for db
    app.get('/events',async(req,res)=>{
        const result=await eventCollection.find().toArray()
        res.send(result)
    })

// 3. Get Single Event by ID (GET)
    app.get('/events/:id', async (req, res) => {
      const id = req.params.id;
      // ObjectId valid kina check kora bhalo practice
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID format" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await eventCollection.findOne(query);
      res.send(result);
    });
// booking data post
   app.post('/bookings', async (req, res) => {
  try {
    const booking = req.body;

    console.log("Booking received:", booking);

    // validation
    if (!booking?.eventId || !booking?.userEmail) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    // safe conversion
    booking.price = Number(booking.price);
    booking.quantity = Number(booking.quantity);

    const result = await bookingCollection.insertOne(booking);

    res.send({
      success: true,
      insertedId: result.insertedId
    });

  } catch (error) {
    console.error("Booking Error:", error);

    res.status(500).send({
      success: false,
      message: "Internal Server Error"
    });
  }
});

app.get('/bookings/:email', async (req, res) => {
  const email = req.params.email

  const query = { userEmail: email }

  const result = await bookingCollection.find(query).toArray()

  res.send(result)
})

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('culture x ise connecting')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})