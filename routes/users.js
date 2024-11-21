var express = require('express');
var router = express.Router();
var userSchema = require('../models/user.model');
var multer = require('multer');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var tokenMiddleware = require('../middleware/token.middleware');

const saltRounds = 10;

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    cb(null, new Date().getTime() + "_" + file.originalname)
  }
})

const upload = multer({ storage: storage })

// POST route for uploading a file
router.post('/upload', [tokenMiddleware, upload.single('image')], (req, res) => {
  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: req.file
  })
})

/* GET users listing. */
router.get('/', tokenMiddleware, async (req, res, next) => {
  try {
    // Only authenticated users can access this route
    const users = await userSchema.find({});
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

//GET user by id
router.get('/:id', tokenMiddleware, async (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  try {
    const user = await userSchema.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
});

router.post('/', async (req, res, next) => {
  const { username, password, firstname, lastname } = req.body;

  // Input validation
  if (!username || !firstname || !lastname || !password) {
    return res.status(400).json({ success: false, message: 'some field not proviided' });;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, parseInt(saltRounds));

  try {
    const user = new userSchema({
      username: username,
      firstname: firstname,
      lastname: lastname,
      password: hashedPassword
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
});

// PUT route for updating a user
router.put('/:id', tokenMiddleware, async (req, res) => {
  const { firstname, lastname } = req.body;
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  try {
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.firstname = firstname;
    user.lastname = lastname;
    await user.save();
    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
});

//DELETE route for deleting a user
router.delete('/:id', tokenMiddleware, async (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  try {
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await user.remove();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
});


module.exports = router;
