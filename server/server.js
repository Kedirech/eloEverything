var express = require('express');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var bodyParser = require('body-parser');
var multer = require('multer');
var app = express();
var User = require('./models/User');
var localhost = process.env.publicIP;
var s3 = require("./controllers/s3");

module.exports = app;
// app.use(multipart({
//   uploadDir:config.tmp
// }))


var questionsController = require('./controllers/questionsController');
var usersController = require('./controllers/usersController');
var categoriesController = require("./controllers/categoriesController");
var authController = require("./controllers/authController");
var complaintsController = require("./controllers/complaintsController");
var statsController = require("./controllers/statsController");

var serverConfig = require("./config");

var mongoUri = "mongodb://0.0.0.0:27017/elo";

mongoose.connect(mongoUri);
var sessionOptions = {
  mongooseConnection: mongoose.connection
};
app.use(session({
  secret: serverConfig.sessionSecret,
  store: new MongoStore(sessionOptions)
}));
app.use(express.static(__dirname + '/../public'));
app.use(bodyParser.json());
require('./config/passport')(app, passport); //Setup passport

app.get("/auth/logout", authController.logout);
app.get("/auth/token", authController.getToken);


app.get("/api/questions", authController.ensureAuthenticated, authController.ensureAdmin, questionsController.seeQuestions);
app.get("/api/questions/edit/:id", authController.ensureAuthenticated, authController.ensureAdmin, questionsController.getSingleQuestion);
app.get("/api/questions/:category", authController.ensureAuthenticated, usersController.getScoreInCategory, usersController.getRecentQuestions, questionsController.askQuestion);
app.get("/histogram/questions", questionsController.mathHistogram);
app.post("/api/questions", authController.ensureAuthenticated, categoriesController.checkAndAddNewCategories, questionsController.addQuestion, statsController.makeAuthorStats);
app.post("/api/answerquestion/:questionId/", authController.ensureAuthenticated, usersController.addQuestionToAnsweredList, questionsController.answerQuestion);
app.put("/api/questions/:questionId", authController.ensureAuthenticated, authController.ensureAdmin, questionsController.updateQuestion);

//app.get("/api/users", usersController.getAllUsers);
//app.get("/api/users/:id", usersController.getUserById);
app.get("/api/me", authController.ensureAuthenticated, usersController.getUserBySession);
app.get("/api/users/admin", authController.ensureAuthenticated, authController.ensureAdmin, usersController.getAllUsersAdmin);

app.post("/api/users", usersController.addUser);
app.put("/api/users", authController.ensureAuthenticated, usersController.updateSelf);
app.get("/api/users/:id", usersController.getUserById);
app.get("/api/rankings/:category", usersController.getRankingsInCategory);

app.post("/api/complaints", authController.ensureAuthenticated, complaintsController.addComplaint);
app.get("/api/complaints", authController.ensureAuthenticated, authController.ensureAdmin, complaintsController.getComplaints);
app.delete("/api/complaints/:id", authController.ensureAuthenticated, complaintsController.removeComplaint);

app.get("/api/stats", statsController.getStats);
app.get("/api/stats/question/:id", statsController.getCategoryDistribution);
app.get("/api/stats/author/:id", statsController.makeAuthorStats);

app.get("/api/categories", authController.ensureAuthenticated, categoriesController.getAllCategories);
app.put("/api/categories/:id", authController.ensureAdmin, categoriesController.updateCategory);

app.post("/api/images", s3.testUpload);

mongoose.connection.once('open', function() {
  console.log('connected to mongoDb at : ', mongoUri);
});

if (process.env.envStatus === "DEVELOPMENT") {
  var port = 11746;
  mongoose.set('debug', true);
} else {
  var port = 8081;
}
app.listen(port, function() {
  console.log("Listening on port:" + port + " in " + process.env.envStatus + " mode.");
});
