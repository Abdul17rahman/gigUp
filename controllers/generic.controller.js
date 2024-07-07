class GenericControllers {
  // Home route
  static home(req, res) {
    res.render("index");
  }

  // Logout
  static logout(req, res) {
    req.session.destroy();
    res.redirect("/home");
  }
}

module.exports = GenericControllers;
