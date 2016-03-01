//Express
var express = require('express');
var app = express();
var PORT = process.env.PORT || 8000;
var bcrypt = require('bcryptjs');

//Sequelize
var Sequelize = require('sequelize');

//postgres
var pg = require('pg');

//Yelp
var Yelp = require('yelp');
var myKeys = require("./keys.js");
var yelp = new Yelp(myKeys.yelpKeys);

//'postgres://postgres:password@localhost/rutgersflyer'
require('dotenv').config({silent:true});


var sequelize = new Sequelize(process.env.DATABASE_URL);


//Handlebars
var expressHandlebars = require('express-handlebars');
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');


//Body Parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));


//Express session
app.use(require('express-session')({
  secret: 'crackalackin',
  resave: true,
  saveUninitialized: true,
  cookie : { secure : false, maxAge : (4 * 60 * 60 * 1000) } // 4 hours
}));


//Passport
var passport = require('passport');
var passportLocal = require('passport-local');
app.use(passport.initialize());
app.use(passport.session());


passport.use(new passportLocal.Strategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
    session: false
  },
  function(req, username, password, done){

    if((username === undefined || username === "") || (password === undefined || password === "" )){
      done(null,false, {message: "Invalid email or password."});
    }

    //check password in db
    User.findOne({
      where: {
        email: username
      }
    }).then(function(user) {
      //check password against hash
      if(user){

        bcrypt.compare(password, user.dataValues.password, function(err, success) {
          if (success) {
            //if password is correct authenticate the user with cookie
            done(null, { username: username, firstname: user.dataValues.firstname });
          } else{
            done(null, false, {message: "Invalid email or password."});
          }
        });
      } else {
        done(null, false, {message: "Invalid email or password."});
      }
    }).catch(function(err){
      done(err);
    });
  }
));



passport.serializeUser(function(user, done) {
  done(null, {email: user.username, firstname: user.firstname});
});


passport.deserializeUser(function(username, done) {
  done(null, {email: username, firstname: username.firstname});
});


//Static Css / JS
app.use('/css', express.static("public/css"));
app.use('/js', express.static("public/js"));


//Sequelize Define models
var User = sequelize.define('User', {
  firstname: {
    type: Sequelize.STRING
  },
  lastname: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
	password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [8, 150],
        msg: "Your password must be between 8-32 characters"
      }
    }
  }
}, {
  //Bcrypt
  hooks: {
    beforeCreate: function(input){
      input.password = bcrypt.hashSync(input.password, 8);
    }
  }
});


var Review = sequelize.define('Reviews', {
  message: {
    type: Sequelize.STRING
  },
  rating: {
    type: Sequelize.INTEGER
  }
});


var Business = sequelize.define('Businesses', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  category: {
    type: Sequelize.STRING
  },
  address: {
    type: Sequelize.STRING
  },
  phone_number: {
    type: Sequelize.DOUBLE
  },
  web_site: {
    type: Sequelize.STRING
  }
});


User.belongsToMany(Business, {through: Review});
Business.belongsToMany(User, {through: Review});


//page rendering
app.get('/', function(req, res){
  if(req.isAuthenticated()){
    console.log(res.user);
    res.render('firstpage', {firstDisplay: false, msg: req.query.msg, email: req.user.email, isAuthenticated: req.isAuthenticated(), firstname: req.user.firstname});
  }else{
    res.render('firstpage', {firstDisplay: false, msg: req.query.msg, isAuthenticated: req.isAuthenticated()});
  }
});

//app.get('/find/:category', function(req, res){
//
//  Business.findAll({
//    where: {
//      category: req.params.category
//    }
//  }).then(function(business){
//    Review.findAll({
//      where: {
//        BusinessId: business[0].dataValues.id
//      }
//    }).then(function(reviews){
//      res.render('firstpage', {
//        category: req.params.category,
//        rating: reviews[0].dataValues.rating,
//        reviews: reviews[0].dataValues.message,
//        name: business[0].dataValues.name,
//        firstDisplay: true
//      });
//    }).catch(function(err) {
//      console.log(err);
//      res.redirect('/');
//    });
//  }).catch(function(err) {
//    console.log(err);
//    res.redirect('/');
//  });
//
//});


app.get('/places-things/:category', function(req, res){

  Business.findAll({
    where: {
      category: req.params.category
    }
  }).then(function(business){
    console.log(business);
    res.render('places-things', {category: req.params.category, businesses: business});
  }).catch(function(err){
    console.log(err);
    res.redirect('/?msg=Error');
  });
});


app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

app.post('/postreview', function(req,res){
  
})
app.post('/register', function(req,res){

  User.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: req.body.password
  }).then(function(user) {
    console.log(user);
    res.redirect('/login');
  }).catch(function(err) {
    console.log(err);
    res.redirect('/login?msg=Credentials do not work');
  });
});

app.get('/info/:name', function(req, res){

  Business.findOne({
    where: {
      name: req.params.name
    }
  }).then(function(business){
    console.log(business);
    res.render('displayInfo', {businesses: business});
  }).catch(function(err){
    console.log(err);
    res.redirect('/?msg=Error');
  });
});


app.post('/addingLocation', function(req, res){

  console.log(req.body);

  Business.create({
    name: req.body.name,
    category: req.body.category,
    address: req.body.address,
    phone_number: req.body.phone_number,
    web_site: req.body.web_site
  }).then(function(business){
    res.render('firstpage');
  }).catch(function(err){
    console.log(err);
    res.redirect('/?msg=Error');
  });
});


//Testing the database
sequelize.sync().then(function() {
  app.listen(PORT, function () {
    console.log("Listening on:" + PORT)
  });
}).catch(function(err){
  if(err){throw err;}
});