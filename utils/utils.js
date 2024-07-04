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

function formatjobTime(created_at) {
  const postDate = new Date(created_at);
  const now = new Date();
  const timeDifference = Math.abs(now - postDate);

  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return postDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } else if (hours > 0) {
    return hours === 1 ? `${hours}hr ago` : `${hours}hrs ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? `${minutes}min ago` : `${minutes}min ago`;
  } else {
    return `${seconds}sec ago`;
  }
}

module.exports = { decorateAsync, encryptPassword, formatjobTime };
