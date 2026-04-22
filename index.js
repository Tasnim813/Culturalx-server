require('dotenv').config()
const express = require('express')
const cors=require('cors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const app = express()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT|| 3000


// middleware
app.use(express.json());
// app.use(cors());

app.use(
  cors({
    origin: [
     process.env.CLIENT_DOMAIN
    ],
    credentials: true,
    optionSuccessStatus: 200,
  })
)


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
const userCollection=db.collection('user')
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
// customer own booking api
app.get('/bookings/:email', async (req, res) => {
  const email = req.params.email

  const query = { userEmail: email }

  const result = await bookingCollection.find(query).toArray()

  res.send(result)
})

app.get('/bookings',async (req, res) => {
  try {
    const result = await bookingCollection.find().toArray()
    res.send(result)
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch bookings' })
  }
})

// post user data
        app.post('/user',async(req,res)=>{
  const userData=req.body;
  userData.created_at= new Date().toISOString()
  userData.last_loggedIn= new Date().toISOString()
  userData.role='customer'
  userData.status='active'
   
  const query={
    email: userData.email

  }
  const alreadyExist=await userCollection.findOne(query)
  console.log('User Already Exist ---->',!!alreadyExist)
  if(alreadyExist){
    console.log("update user Info")
    const   result= await userCollection.updateOne(query,{
      $set:{
        last_loggedIn: new Date().toISOString(),
      },
    })
    return res.send(result)
  }
  console.log('Saving new user')
  const result=await userCollection.insertOne(userData)
  
  res.send(result)
})

// payment
app.post('/create-checkout-session', async (req, res) => {
  try {
    const paymentInfo = req.body

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: paymentInfo?.eventName,
            },
            unit_amount: paymentInfo?.price * 100,
          },
          quantity: paymentInfo?.quantity,
        },
      ],
      mode: 'payment',

      // customer email
      customer_email: paymentInfo.customer.email,

      metadata: {
        orderId: paymentInfo.orderId,
        customerEmail: paymentInfo.customer.email,
      },

      success_url: `${process.env.CLIENT_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_DOMAIN}/dashboard/my-orders`,
    })

    res.send({ url: session.url })
  } catch (error) {
    console.error(error)
    res.status(500).send({ error: 'Stripe session failed' })
  }
})

app.post('/payment-success', async (req, res) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).send({ error: 'sessionId missing' })
    }

    // Stripe session fetch
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const orderId = session?.metadata?.orderId

    if (!orderId) {
      return res.status(400).send({ error: 'Order ID not found' })
    }

    // update order payment status
    const result = await bookingCollection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          paymentTime: new Date(),
        },
      }
    )

    res.send({
      success: true,
      message: 'Payment updated successfully',
      result,
    })
  } catch (error) {
    console.error('Payment Success Error:', error)
    res.status(500).send({ error: 'Payment update failed' })
  }
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