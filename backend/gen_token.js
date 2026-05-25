const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const userId = '69b2880bff79b08cf45888c4'; // Bruce Wayne ID
const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log(token);
