const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
const corsOptions = {
  origin: ['https://swissfunded-demo.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Add security headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ['https://swissfunded-demo.vercel.app', 'http://localhost:3000'].includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());

// Cache implementation
let newsCache = {
  data: null,
  timestamp: null,
  expiry: 5 * 60 * 1000 // 5 minutes
};

// Mock data for fallback
const mockEvents = [
  {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString(),
    currency: 'EUR/USD',
    impact: 'High',
    event: 'ECB Interest Rate Decision',
    forecast: '4.50%',
    previous: '4.50%'
  },
  {
    date: new Date().toISOString().split('T')[0],
    time: new Date(Date.now() + 3600000).toLocaleTimeString(),
    currency: 'USD/JPY',
    impact: 'Medium',
    event: 'US Non-Farm Payrolls',
    forecast: '200K',
    previous: '175K'
  },
  {
    date: new Date().toISOString().split('T')[0],
    time: new Date(Date.now() + 7200000).toLocaleTimeString(),
    currency: 'GBP/USD',
    impact: 'Low',
    event: 'UK GDP',
    forecast: '0.2%',
    previous: '0.1%'
  }
];

// Helper function to generate random events
function generateRandomEvents(count = 10) {
  const currencies = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'AUD/USD', 'USD/CAD'];
  const impacts = ['High', 'Medium', 'Low'];
  const events = [
    'Interest Rate Decision',
    'Non-Farm Payrolls',
    'GDP',
    'CPI',
    'Retail Sales',
    'PMI',
    'Trade Balance',
    'Unemployment Rate'
  ];

  const result = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() + (i * 3600000)); // Add i hours
    result.push({
      date: date.toISOString().split('T')[0],
      time: date.toLocaleTimeString(),
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      impact: impacts[Math.floor(Math.random() * impacts.length)],
      event: events[Math.floor(Math.random() * events.length)],
      forecast: (Math.random() * 5).toFixed(2) + '%',
      previous: (Math.random() * 5).toFixed(2) + '%'
    });
  }
  
  return result;
}

app.get('/api/forex-news', async (req, res) => {
  try {
    // Check cache first
    if (newsCache.data && newsCache.timestamp && 
        (Date.now() - newsCache.timestamp) < newsCache.expiry) {
      console.log('Returning cached news data');
      return res.json(newsCache.data);
    }

    console.log('Generating new forex news data...');
    
    // Generate new events
    const events = generateRandomEvents(20);

    // Update cache
    newsCache.data = events;
    newsCache.timestamp = Date.now();

    console.log(`Successfully generated ${events.length} news items`);
    res.json(events);
  } catch (error) {
    console.error('Error generating forex news:', error.message);
    
    // If we have cached data, return it even if it's expired
    if (newsCache.data) {
      console.log('Returning expired cached data due to error');
      return res.json(newsCache.data);
    }
    
    console.log('Error occurred, falling back to mock data');
    res.json(mockEvents);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Using generated forex news data');
}); 