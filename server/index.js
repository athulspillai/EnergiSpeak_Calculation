import express from 'express';
import cors from 'cors';
import connectToDatabase from './config/db.js';
import ESCalcroutes from './routers/ESCalcroutes.js';
import session from 'express-session';


const server = express();
const port = process.env.PORT || 8000;

server.use(cors({ origin: "*" }));
server.use(express.json({ limit: '50mb' }));
server.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))


connectToDatabase();

server.use('/ESCalc', ESCalcroutes);


server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});