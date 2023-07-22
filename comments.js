// Create web server
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')

// Create web server
const app = express()

// Register middleware
app.use(bodyParser.json())
app.use(cors())

// Create comments object
const commentsByPostId = {}

// Create endpoint for GET request
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || [])
})

// Create endpoint for POST request
app.post('/posts/:id/comments', async (req, res) => {
  const { content } = req.body

  // Create new comment
  const commentId = randomBytes(4).toString('hex')
  const comments = commentsByPostId[req.params.id] || []
  comments.push({ id: commentId, content, status: 'pending' })

  // Save comment
  commentsByPostId[req.params.id] = comments

  // Emit event
  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending'
    }
  })

  // Send response
  res.status(201).send(comments)
})

// Create endpoint for POST request
app.post('/events', async (req, res) => {
  console.log('Event received:', req.body.type)

  const { type, data } = req.body

  if (type === 'CommentModerated') {
    const { id, postId, status, content } = data
    const comments = commentsByPostId[postId]

    // Find comment
    const comment = comments.find(comment => {
      return comment.id === id
    })

    // Update comment status
    comment.status = status

    // Emit event
    await axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,
        postId,
        status,
        content
      }
    })
  }

  // Send response
  res.send({})
})

// Listen for requests
app.listen(4001, () => {
  console.log('Listening on port 4001')
})