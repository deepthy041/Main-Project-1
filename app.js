var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs=require('express-handlebars')
// var fileUpload=require('express-fileUpload')
var db=require('./config/connection')
var productHelper=require('./helpers/product-helpers')
var session=require('express-session')

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();
app.use((req,res,next)=>{
  res.header('cache-control','private,no-cache,no-store,must revalidate')
  res.header('Expires','-1')
  res.header('Pragma','no-cache')*
next();
})

// view engine setup
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))

const HBS = hbs.create({});
HBS.handlebars.registerHelper("ifCompare", function (v1, v2, options) {
  if (v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())
app.use(session({secret:"Key",cookie:{maxAge:6000000}}))
db.connect((err)=>{
if(err){
  console.log("Error"+err);
}else{
  console.log("Database connected")
}
})

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');  
});

module.exports = app;
