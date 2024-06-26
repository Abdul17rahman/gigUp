// Decorates the async functions by catching errors.
const bcrypt = require("bcrypt");

function decorateAsync(func) {
  return function (req, res, next) {
    func(req, res, next).catch((e) => next(e));
  };
}

async function encryptPassword(data) {
  const password = data.password;
  const hashed = await bcrypt.hash(password, 10);
  data.password = hashed;
  return data;
}

module.exports = { decorateAsync, encryptPassword };
