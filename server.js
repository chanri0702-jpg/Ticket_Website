const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');//for session management
const { setUserLocals } = require('./middleware/auth');
require('dotenv').config();//allow env variable use

<<<<<<< HEAD
const venueController = require('./controllers/venueController')//controller for venue page route
const eventController = require('./controllers/eventController')
=======
const venueController = require('./controllers/venueController');
const eventController = require('./controllers/eventController');
const timesController = require('./controllers/timesController');
>>>>>>> 52be766 ( Completed the authentication system with login, register, dashboard, and admin role-based access)

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

app.use((req, res, next) => {
<<<<<<< HEAD
  console.log(`${req.method} ${req.url}`); // logs every request
=======
  console.log(`${req.method} ${req.url}`);
>>>>>>> 52be766 ( Completed the authentication system with login, register, dashboard, and admin role-based access)
  next();
});

//------------------------------routes-------------------------------
<<<<<<< HEAD
app.use('/api/users',require('./routes/userRoutes'));
app.use('/api/events',require('./routes/eventRoutes'));
app.use('/api/venues',require('./routes/venueRoutes'));
app.use('/api/times',require('./routes/timesRoutes'));
app.use('/api/bookings',require('./routes/bookingRoutes'));
app.use('/api/enqueries',require('./routes/enqueryRoutes'));
=======
app.use('/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/venues', require('./routes/venueRoutes'));
app.use('/api/times', require('./routes/timesRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/enqueries', require('./routes/enqueryRoutes'));
>>>>>>> 52be766 ( Completed the authentication system with login, register, dashboard, and admin role-based access)

//------------------------------view routes-------------------------------
const Event = require('./models/event');
const Times = require('./models/times');

// Home – event listing with search / filter
app.get('/', async (req, res) => {
  try {
    let matchStage = {};

    if (req.query.search) {
      matchStage.name = { $regex: req.query.search, $options: 'i' };
<<<<<<< HEAD
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
          earliestDate:   { $min: '$timeSlots.eventTime' }
        }
      },
      {
        $match: {
          ...(req.query.date ? {
            earliestDate: {
              $gte: new Date(req.query.date),
              $lt:  new Date(new Date(req.query.date).setDate(new Date(req.query.date).getDate() + 1))
            }
          } : {}),
          ...(req.query.availability === 'available' ? { totalAvailable: { $gt: 0 } } : {}),
          ...(req.query.availability === 'soldout'   ? { totalAvailable: { $eq: 0 } } : {})
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

// Event detail page – /event?id=<eventId>
app.get('/event', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.redirect('/');
    }

    // Fetch the event and populate its venue
    const event = await Event.findById(id).populate('venueID').lean();

    if (!event) {
      return res.status(404).send('Event not found');
    }

    // Fetch all time slots for this event, sorted earliest first
    const timeSlots = await Times.find({ eventID: id })
      .sort({ eventTime: 1 })
      .lean();

    res.render('event', { event, timeSlots });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading event');
  }
});

// Auth / misc pages
app.get('/login',   (req, res) => res.render('login'));
app.get('/contact', (req, res) => res.render('contact'));
app.get('/events', eventController.getEventsPage)
=======
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

// Public event view page
app.get('/view-event', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.redirect('/');

    const event = await Event.findById(id).populate('venueID').lean();
    if (!event) return res.status(404).send('Event not found');

    const timeSlots = await Times.find({ eventID: id })
      .sort({ eventTime: 1 })
      .lean();

    res.render('view-event', { event, timeSlots });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading event');
  }
});

// Event detail page
app.get('/event', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.redirect('/');

    const event = await Event.findById(id).populate('venueID').lean();
    if (!event) return res.status(404).send('Event not found');

    const timeSlots = await Times.find({ eventID: id })
      .sort({ eventTime: 1 })
      .lean();

    res.render('event', { event, timeSlots });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading event');
  }
});

// ============================================
// AUTH PAGES (ONLY ONCE!)
// ============================================

app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', { title: 'Login' });
});

app.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('register', { title: 'Register' });
});

// ============================================
// DASHBOARD - Protected route with admin stats
// ============================================

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    
    let totalEvents = 0;
    let totalBookings = 0;
    let totalUsers = 0;
    let totalRevenue = 0;
    let recentEvents = [];
    let userBookings = [];
    
    if (req.session.user.role === 'admin') {
        const Booking = require('./models/booking');
        const User = require('./models/user');
        
        totalEvents = await Event.countDocuments();
        totalUsers = await User.countDocuments();
        totalBookings = await Booking.countDocuments();
        
        const bookings = await Booking.find();
        totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
        
        recentEvents = await Event.aggregate([
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
            { $sort: { createdAt: -1 } },
            { $limit: 5 }
        ]);
    } else {
        // Regular user - get their bookings
        const Booking = require('./models/booking');
        userBookings = await Booking.find({ userId: req.session.user.id })
            .populate('eventId')
            .sort({ createdAt: -1 });
    }
    
    res.render('dashboard', { 
        title: 'Dashboard',
        user: req.session.user,
        bookings: userBookings,
        totalEvents,
        totalBookings,
        totalUsers,
        totalRevenue,
        recentEvents
    });
});

// ============================================
// LOGOUT
// ============================================

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// ============================================
// OTHER MISC PAGES
// ============================================

app.get('/contact', (req, res) => res.render('contact'));
app.get('/events', eventController.getEventsPage);
app.get('/times-admin', timesController.getTimesPage);
>>>>>>> 52be766 ( Completed the authentication system with login, register, dashboard, and admin role-based access)
app.get('/booking', (req, res) => res.render('booking'));
app.get('/venues', venueController.getVenuesPage);

<<<<<<< HEAD
// Admin – venue management
app.get('/venues', venueController.getVenuesPage);
=======
// Times management page – fetch all events for dropdown
app.get('/times', async (req, res) => {
  try {
    const events = await Event.find().lean();
    res.render('times', { events });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading times page');
  }
});
>>>>>>> 52be766 ( Completed the authentication system with login, register, dashboard, and admin role-based access)

// ─── database start ────────────────────────────────────────────────────────
mongoose.connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error("Could not connect to MongoDB", err);
    process.exit(1);
  });

//start server node.js
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})