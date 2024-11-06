import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to the database')
    } catch (error) {
        console.error('Database connection error', error)
    }
}

export default connectToDatabase