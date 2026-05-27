const bcrypt = require('bcryptjs');

const password = 'sadmin';

bcrypt.hash(password, 10).then(hash => {
  console.log('Hashed password:', hash);
});