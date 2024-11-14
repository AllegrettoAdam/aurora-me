// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO: - Include API routes here
app.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

app.get('/', (req, res) => {
    res.redirect('/register');
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.get('/finder', (req, res) => {
    res.render('pages/finder');
});

app.get('/profile', (req, res) => {
    res.render('pages/profile');
});


app.post('/register', async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid input" })
    }

    try {

        const hash = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)';
        const values = [username, email, hash];

        await db.none(query, values);
        //return res.redirect(/register');
        return res.status(200).json({ message: 'Success' })
    }
    catch (error) {
        console.error('Database error: ', error);
        return res.redirect('/register');
    }

    //.then(() => res.redirect('/login')) 
    // .catch(error => {
    //     res.redirect('/register'); 
    // });
});



// WORKING ON THESE ROUTES ->
// app.get('/login', (req, res) => {
//     res.render('pages/login');
// });

// app.post('/login', (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;
//     const query = 'SELECT * FROM users WHERE username = $1 LIMIT 1';
//     const values = [username];

//     db.one(query, values)
//       .then(data => {
//         bcrypt.compare(password, data.password).then(match => {
//           if (!match) {
//             return res.render('pages/login', { message: 'Incorrect username or password.' });
//           }

//           const user = {
//             user_id: data.user_id,
//             username: data.username,
//           };

//           req.session.user = user;
//           req.session.save();

//           res.redirect('/discover');
//         });
//       })
//       .catch(err => {
//         console.log(err);
//         res.redirect('/register');
//       });
// });




// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000); // for testing: module.exports = app.listen(3000); regularly: app.listen(3000)
console.log('Server is listening on port 3000');