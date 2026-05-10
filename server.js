const { time } = require('console');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');//for session management
const { setUserLocals } = require('./middleware/auth');
require('dotenv').config();//allow env variable use

const uri = process.env.MONGO_URI;//use .env variable
if (!uri) {
  console.error("MONGO_URI is not defined in .env file");
  process.exit(1);
}
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));//for parsing form data
app.use(express.static('public'));

// Session middleware (for login)
app.use(session({
  secret: process.env.SESSION_SECRET || 'ticketstream-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Middleware to make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


app.set('view engine', 'ejs');
app.set('views', './Views');

const port = process.env.PORT;

if (!port) {
  console.error("PORT is not defined in .env file");
  process.exit(1);
}
//------------------------------routes-------------------------------
app.use('/auth', require('./routes/authRoutes'));
app.use('/api/users',    require('./routes/userRoutes'))
app.use('/api/events',   require('./routes/eventRoutes'))
app.use('/api/venues',   require('./routes/venueRoutes'))
app.use('/api/times',    require('./routes/timesRoutes'))
app.use('/api/bookings', require('./routes/bookingRoutes'))
app.use('/api/enqueries', require('./routes/enqueryRoutes'))

//------------------------------view routes-------------------------------
const Event = require('./models/event');
const Times = require('./models/times');

app.get('/', async (req, res) => {
    try {
        let matchStage = {};
        
        if (req.query.search) {
            matchStage.name = { $regex: req.query.search, $options: 'i' };
        }
        
        if (req.query.category) {
            matchStage.category = req.query.category;
        }

        const events = await Event.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'times',
                    localField: '_id',
                    foreignField: 'eventID',
                    as: 'timeSlots'
                }
            },
            {
                $addFields: {
                    totalAvailable: { $sum: '$timeSlots.seatsAvailable' },
                    earliestDate: { $min: '$timeSlots.eventTime' }
                }
            },
            {
                $match: {
                    ...(req.query.date ? { 
                        earliestDate: { 
                            $gte: new Date(req.query.date), 
                            $lt: new Date(new Date(req.query.date).setDate(new Date(req.query.date).getDate() + 1)) 
                        } 
                    } : {}),
                    ...(req.query.availability === 'available' ? { totalAvailable: { $gt: 0 } } : {}),
                    ...(req.query.availability === 'soldout' ? { totalAvailable: { $eq: 0 } } : {})
                }
            },
            {
                $lookup: {
                    from: 'venues',
                    localField: 'venueID',
                    foreignField: '_id',
                    as: 'venue'
                }
            },
            { $unwind: { path: '$venue', preserveNullAndEmptyArrays: true } }
        ]);

        res.render('index', { events, query: req.query });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading events');
    }
});

// Auth pages
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', { title: 'Login' });
});

app.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('register', { title: 'Register' });
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/auth/login');
    
    // Get user's bookings
    const Booking = require('./models/booking');
    const bookings = await Booking.find({ userId: req.session.user.id })
        .populate('eventId')
        .sort({ createdAt: -1 });
    
    res.render('dashboard', { 
        title: 'Dashboard', 
        user: req.session.user,
        bookings: bookings
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});


app.get('/contact', (req, res) => res.render('contact'));
app.get('/event', (req, res) => res.render('event'));
app.get('/booking', (req, res) => res.render('booking'));

mongoose.connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error("Could not connect to MongoDB", err);
    process.exit(1);
  });

//start server node.js
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});