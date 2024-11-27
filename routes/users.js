var express = require('express');
var router = express.Router();
var userSchema = require('../models/user.model');
var multer = require('multer');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var tokenMiddleware = require('../middleware/token.middleware');
var adminMiddleware = require('../middleware/admin.middleware');
var dotenv = require('dotenv');

dotenv.config();

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

//GET my user
router.get('/me', tokenMiddleware, async (req, res, next) => {
  try {
    const user = await userSchema.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    //exept password
    user.password = undefined;
    res.status(200).json({ success: true, data: user });
  }
  catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
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
    user.password = undefined;
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
});

router.post('/', async (req, res, next) => {
  const { username, password, email } = req.body;

  // Input validation
  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, parseInt(saltRounds));

  const existingUser = await userSchema.findOne({ username: username });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Username already taken' });
  }

  try {
    const user = new userSchema({
      username: username,
      email: email,
      password: hashedPassword,
    });

    // Save user and generate user_id automatically via mongoose-sequence
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user_id: user.user_id,  // Include user_id in the response
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        age: user.age,
        gender: user.gender
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
});

//PUT Update User
router.put('/:id', tokenMiddleware, async (req, res, next) => {
  const { firstname, lastname, age, gender, image, phone, address } = req.body;
  const userId = req.params.id;
  const user = await userSchema.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  try {
    user.firstname = firstname;
    user.lastname = lastname;
    user.age = age;
    user.gender = gender;
    user.image = image;
    user.phone = phone;
    user.address = address;
    await user.save();
    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  }
  catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
});

// POST route for creating a new admin user
router.post('/create-admin', async (req, res, next) => {
  const { secret, username, password } = req.body;

  // Check if secret matches
  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid secret key' });
  }

  // Input validation
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, parseInt(saltRounds));

  // Check if the admin user already exists
  const existingUser = await userSchema.findOne({ username: username });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Username already taken' });
  }

  try {
    // Create admin user with role "admin"
    const adminUser = new userSchema({
      username: username,
      password: hashedPassword,
      role: 'admin',  // Set the role to admin
    });

    // Save admin user and generate user_id automatically via mongoose-sequence
    await adminUser.save();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user_id: adminUser.user_id,
        username: adminUser.username,
        role: adminUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create admin user', error: error.message });
  }
});


//DELETE route for deleting a user
router.delete('/:id', [tokenMiddleware, adminMiddleware], async (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  try {
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userDelete = await userSchema.findByIdAndDelete(userId);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
});


module.exports = router;
