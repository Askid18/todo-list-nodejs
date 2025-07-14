// a Todo List application using Express and EJS
// This code sets up a simple server with two routes: home and about.
// It uses EJS as the templating engine and body-parser for form handling.

import express from 'express';
import ejs from 'ejs';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 3000;

// Function to get the formatted date
function getFormattedDate() {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const date = new Date();
  return {
    day: `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}.`,
    year: date.getFullYear()
  };
}


// Initialize arrays to hold tasks for today and work
let todayTasks = [];
let workTasks = [];

// Set up EJS as the templating engine and static files directory
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Home route
app.get('/', (req, res) => {
  // get the formatted date
  const { day, year } = getFormattedDate();  
  res.render('index.ejs', {
    title: 'Today\'s Tasks List', 
    thisDay: day,
    thisYear: year,
    tasks: todayTasks 
  });
});
// handle form submission for home route

//work route
app.get('/work', (req, res) => {
  // get the formatted date
  const { day, year } = getFormattedDate();
  // render the work page with tasks
  res.render('work.ejs', { 
    title: 'Work Tasks List',
    thisDay: day,
    thisYear: year,
    tasks: workTasks 
  });
});

// handle task submission for today and work route 
app.post('/add-task', (req, res) => {
  const task = req.body.newTask;
  const list = req.body.list;

  if (list === 'Work') {
    workTasks.push(task);
    res.redirect('/work');
  } else {
    todayTasks.push(task);
    res.redirect('/');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});