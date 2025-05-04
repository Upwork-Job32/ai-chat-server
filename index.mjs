import express from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.mjs'
import chatRoutes from './routes/chat.mjs'
import paymentRoutes from './routes/payment.mjs'

dotenv.config()

const app = express()

// Middleware
app.use(express.json())
app.use(cors({
  origin: ['https://ai-chat-lake-beta.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/payment', paymentRoutes)

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-chat')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

const startServer = async () => {
  const PORT = process.env.PORT || 3001
  const HOST = '0.0.0.0'  // Listen on all network interfaces
  
  try {
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`)
      console.log('Allowed CORS origins:', ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:3000', 'http://127.0.0.1:3000', "https://ai-chat-lake-beta.vercel.app"])
    })
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please try a different port.`)
      process.exit(1)
    } else {
      console.error('Error starting server:', error)
      process.exit(1)
    }
  }
}

startServer() 