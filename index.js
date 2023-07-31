const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser')
const mysql = require('mysql');
const session = require('express-session');
const { redirect } = require('express/lib/response');

const PORT = 8080
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')
// app.use(cors());
// app.options('*', cors());
app.use(bodyParser.json());     
app.use(bodyParser.urlencoded({
  extended: true
})); 
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'namejeff',
    cookie: {
        sameSite: true,
        secure: false
    }
}))
app.use(function(req, res, next) {
    res.locals.id = req.session.userId;
    res.locals.name = req.session.name;
    next();
  });

const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/login');
    }
    else {
        next();
    }
}
const redirectHome = (req, res, next) => {
    if (req.session.userId) {
        res.redirect('/');
    }
    else {
        next();
    }
}

// create connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nodesql'

});

// connect
db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('mysql connected')
})

app.get('/', (req, res) => {
    const {userId} = req.session
    const {name} = req.session
    res.render('index.ejs', {'user': userId})
})

// insert data
app.post('/person/create', (req, res) => {
    let post = {
        name: req.body.name,
        surname: req.body.surname,
        age: req.body.age,
        gender: req.body.gender
    }
    let sql = 'INSERT INTO person SET ?'
    let query = db.query(sql, post, (err, result) => {
        if(err) throw err;
        console.log(result)
        res.redirect('/')
    })
});

// get persons
app.get('/persons', (req, res) => {
    let sql = 'SELECT * FROM person'
    db.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result)
        res.send(result)
    })
})

// get single persons
app.get('/person/:id', redirectLogin, (req, res) => {
    let sql = `SELECT * FROM person WHERE id = ${req.params.id}`
    db.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result)
        res.render('person/show.ejs', {'data': result})
    })
})

// login page
app.get('/login', redirectHome, (req, res) => {
    res.render('login/index.ejs')
});

//auth login
app.post('/login', redirectHome, (req, res) => {
    const user = req.body.login;
    const pass = req.body.password
    // parameterized query to prevent sql injections
    // passwords are not send in the query but checked in the code as extra security measure
    // not that it matters because passwords are unhashed anyway
    let sql = `SELECT * FROM \`user\` WHERE user=?`
    db.query(sql, [user], (err, result) => {
        if(err) throw err;
        // bad login
        if(result.length === 0 || result[0].password != req.body.password) {
            res.render('login/index.ejs', {'data': 'Wrong login information'})
        }
        else {
            req.session.userId = result[0].id;
            req.session.name = result[0].user;
            res.redirect('/')
        }
    })
});

app.get('/logout', redirectLogin, (req, res) => {
    req.session.userId = null;
    req.session.name = null;
    res.redirect('/')
})

app.listen(PORT, () => {
    console.log(`express.js running on port ${PORT}`)
})