const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.or5hopv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const phoneCollection = client.db('phoneResale').collection('phones');
        const brandCollection = client.db('phoneResale').collection('brands');
        const bookingsCollection = client.db('phoneResale').collection('bookings');
        const usersCollection = client.db('phoneResale').collection('users');
        const savePhonesCollection = client.db('phoneResale').collection('savePhones');

        app.get('/brands', async (req, res) => {
            const query = {};
            const brands = await brandCollection.find(query).toArray();
            res.send(brands);
        });
        app.get('/brands/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: (id) };
            const phone = await phoneCollection.find(query).toArray();
            res.send(phone);
        });
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '2d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        });
        app.get('/sellers', async (req, res) => {
            const query = { type: "Seller" };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.type === 'admin' });
        });
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.type === 'Seller' });
        });


        app.put('/sellers/verify/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);


            if (user?.type !== 'admin') {
                return res.status(403).send({ message: 'Forbidden accesss.' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verified: true
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        app.get('/buyers', async (req, res) => {
            const query = { type: "Buyer" };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        // app.get('/savephones', async (req, res) => {
        //     const query = {};
        //     const phones = await savePhonesCollection.find(query).toArray();
        //     res.send(phones);
        // });
        app.post('/postphone', async (req, res) => {
            const phone = req.body;
            const result = await phoneCollection.insertOne(phone);
            res.send(result);
        })
        app.get('/savephones/:email', async (req, res) => {
            const email = req.params.email;
            const query = { seller: email };
            const phones = await savePhonesCollection.find(query).toArray();
            res.send(phones);
        })
        app.post('/savephones', async (req, res) => {
            const savephones = req.body;
            const result = await savePhonesCollection.insertOne(savephones);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('phone resale server is running');
})

app.listen(port, () => console.log(`phone resale running on ${port}`))