const { Pool, types } = require('pg');

// DATE 타입을 JS Date 객체로 변환하지 않고 'YYYY-MM-DD' 문자열 그대로 반환
types.setTypeParser(types.builtins.DATE, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

module.exports = pool;
