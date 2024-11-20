var express = require('express');
var router = express.Router();
var userSchema = require('../models/user.model');

/* GET users listing. */
router.get('/', async function (req, res, next) {
  let users = await userSchema.find({});
  res.send(users);
});

router.post('/', async function (req, res, next) {
  let { name, age } = req.body;
  let user = new userSchema({
    name: name,
    age: age
  });
  await user.save();
  res.send("insert succcess");;
});

router.put('/:id', async function (req, res, next) {
  let { name, age } = req.body;
  let { id } = req.params;
  let user = await userSchema.findByIdAndUpdate(id, { name: name, age: age }, { new: true });
  res.send(user);
});


module.exports = router;
