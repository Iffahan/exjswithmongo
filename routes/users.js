var express = require('express');
var router = express.Router();
var userSchema = require('../models/user.model');
var multer = require('multer');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

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
router.post('/upload', upload.single('image'), (req, res) => {
  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: req.file
  })
})

/* GET users listing. */
router.get('/', async (req, res, next) => {
  try {
    const users = await userSchema.find({});
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

router.post('/', async (req, res, next) => {
  const { name, age, password } = req.body;

  // Input validation
  if (!name || !age || !password) {
    return res.status(400).json({ success: false, message: 'Name, age, and password are required' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, parseInt(saltRounds));

  let token = jwt.sign({ name: name }, process.env.JWT_SECRET_KEY);

  try {
    const user = new userSchema({
      name: name,
      age: age,
      password: hashedPassword
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
});

router.put('/:id', async function (req, res, next) {
  let { name, age } = req.body;
  let { id } = req.params;
  if (!name || !age) {
    return res.status(400).send({ error: 'Name and age are required' });
  }

  try {
    let user = await userSchema.findByIdAndUpdate(id, { name, age }, { new: true });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(user);
  } catch (err) {
    res.status(500).send({ error: 'Something went wrong' });
  }
});

router.delete('/:id', async function (req, res, next) {
  let { id } = req.params;
  try {
    let user = await userSchema.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).send({ error: 'Something went wrong' });
  }
});


module.exports = router;
