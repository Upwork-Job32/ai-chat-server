import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.mjs'
import { requireAuth } from '../middleware/auth.mjs'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Register request received:', req.body)
    const { email, password } = req.body

    if (!email || !password) {
      console.log('Missing email or password')
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('User already exists:', email)
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      credits: 10, // Give new users 10 free messages
      isPremium: false
    })

    console.log('Attempting to save user:', { email, credits: user.credits })
    
    try {
      await user.save()
      console.log('User saved successfully:', user._id)
    } catch (saveError) {
      console.error('Error saving user:', saveError)
      if (saveError.code === 11000) {
        return res.status(400).json({ message: 'Email already exists' })
      }
      throw saveError
    }

    // Set session
    req.session.userId = user._id
    console.log('Session set for user:', user._id)

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        credits: user.credits,
        isPremium: user.isPremium
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Set session
    req.session.userId = user._id

    res.json({
      user: {
        id: user._id,
        email: user.email,
        credits: user.credits,
        isPremium: user.isPremium
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        credits: user.credits,
        isPremium: user.isPremium
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err)
      return res.status(500).json({ message: 'Could not log out' })
    }
    res.json({ message: 'Logged out successfully' })
  })
})

export default router 