// Decorates the async functions by catching errors.

function decorateAsync(func) {
  return function (req, res, next) {
    func(req, res, next).catch((e) => next(e));
  };
}

module.exports = decorateAsync;
