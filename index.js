var path = require('path'),
    http = require('http'),
    config = require('config'),
    express = require('express'),
    bodyParser = require('body-parser'),
    uuid = require('uuid'),
    cookieParser = require('cookie-parser'),
    methodOverride = require('method-override'),
    multipart = require('connect-multiparty'),
    multipartMiddleware = multipart(),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    multiparty = require('multiparty'),
    expressValidator = require('express-validator'),
    session = require('express-session'),
    flash = require('connect-flash'),
    passport = require('passport'),
    routes = require('./app/routes/routes');

var app = module.exports = express();

if(!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

var env = process.env.NODE_ENV || 'development';


// connect mongDB
mongoose.connect(config.get('mongoDBURI'));

require('./config/passport')(passport);

app.locals.ENV = env;

// --
// ExpressJS Configuration

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/app/views');
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(expressValidator());
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(methodOverride());
app.use(session({
    genid: function(req) {
        return uuid.v1() // use UUIDs for session IDs
    },
    secret: 'oielkweudfoiksxahjckakdxsdncnm'
}))
app.use(flash());
app.use(function(req, res, next) {
    if(req.session && req.session.user) {
        req.user = req.session.user;
        req.session.user = req.user;
    }
    next();
});


app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// Start Engine!
http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
