var express = require('express');
var router = express.Router();
var userSchema = require('../models/user.model');

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
  const { name, age } = req.body;

  // Input validation
  if (!name || !age) {
    return res.status(400).json({ success: false, message: 'Name and age are required' });
  }

  try {
    const user = new userSchema({ name, age });
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


module.exports = router;
