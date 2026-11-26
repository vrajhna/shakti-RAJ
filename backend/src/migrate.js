'use strict';
require('dotenv').config();
const { migrate } = require('./db');
migrate().then(() => { console.log('migrations done'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
