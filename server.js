const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();//allow env variable use

const venueController = require('./controllers/venueController')//controller for venue page route
const eventController = require('./controllers/eventController')

const uri = process.env.MONGO_URI;//use .env variable
if (!uri) {
  console.error("MONGO_URI is not defined in .env file");
  process.exit(1);
}
const app = express();
app.use(express.json());
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', './Views');

const port = process.env.PORT;
if (!port) {
  console.error("PORT is not defined in .env file");
  process.exit(1);
}

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`); // logs every request
  next();
});

//------------------------------routes-------------------------------
app.use('/api/users',require('./routes/userRoutes'));
app.use('/api/events',require('./routes/eventRoutes'));
app.use('/api/venues',require('./routes/venueRoutes'));
app.use('/api/times',require('./routes/timesRoutes'));
app.use('/api/bookings',require('./routes/bookingRoutes'));
app.use('/api/enqueries',require('./routes/enqueryRoutes'));

//------------------------------view routes-------------------------------
const Event = require('./models/event');
const Times = require('./models/times');

// Home – event listing with search / filter
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
app.get('/booking', (req, res) => res.render('booking'));

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
// Admin – venue management
app.get('/venues', venueController.getVenuesPage);

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
});