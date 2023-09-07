const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
const PORT = 5000;

const db = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.CLUSTER}.mongodb.net/${process.env.DB}?retryWrites=true&w=majority`
mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>{
    console.log("Connected to db");
})
.catch((e) =>{
    console.log(e);
});

app.use(cors({
    origin: 'https://mern-frontend-user.vercel.app', 
    methods: 'GET,POST,DELETE',
    credentials: true,
  }));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
