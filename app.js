// a Todo List application using Express and EJS
// This code sets up a simple server with two routes: home and about.
// It uses EJS as the templating engine and body-parser for form handling.

import express from 'express';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import _ from 'lodash';
import dotenv from 'dotenv';

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

// Connect to database using mongoose
await mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Define a schema for tasks
const taskSchema = new mongoose.Schema({
  name: String
});

// Create a model for tasks
const Task = mongoose.model('Task', taskSchema);

// Define a schema for routes tasks
const routeSchema = new mongoose.Schema({
  name: String,
  tasks: [taskSchema]
});
// Create a model for routes
const Route = mongoose.model('Route', routeSchema);

// Set up EJS as the templating engine and static files directory
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Home route
app.get('/', async (req, res) => {
  // get the formatted date
  const { day, year } = getFormattedDate();
  // Fetch tasks for today from the database
  const task = await Task.find({});
  res.render('index', {
    title: 'Today\'s Tasks List', 
    thisDay: day,
    thisYear: year,
    tasks: task,
    listName: 'Today'
  });
});
// handle form submission for home route

app.get('/:customListName', async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  const { day, year } = getFormattedDate();

  // Check if the list exists
  let foundList = await Route.findOne({ name: customListName });

  // If not, create a new one
  if (!foundList) {
    foundList = new Route({
      name: customListName,
      tasks: []
    });
    await foundList.save();
  }

  // Render with tasks from the found or newly created list
  res.render('index', {
    title: `${customListName} Task's List`,
    thisDay: day,
    thisYear: year,
    tasks: foundList.tasks,
    listName: customListName
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Dynamic route to handle adding tasks
app.post('/add-task', async (req, res) => {
  const taskName = req.body.newTask;
  const listName = _.capitalize(req.body.list); // Get the list name from the form

  console.log("Submitted Task:", taskName);
  console.log("List name:", listName);  // <--- log this!
  // Create a new task instance
  const task = new Task({ name: taskName });
  console.log(taskName, listName);


  if (listName === "Today") {
    await task.save();
    res.redirect('/');
  } else {
    const foundList = await Route.findOne({ name: listName });
    if (foundList) {
      foundList.tasks.push(task); // Embed task (not ref)
      await foundList.save();
      res.redirect('/' + listName);
    } else {
      console.error("List not found:", list);
      res.redirect('/');
    }
  }
});

app.post('/delete-task', async (req, res) => {
  const checkedTaskId = req.body.check;
  const listName = req.body.list; // you must send this from the form

  if (listName === "Today") {
    // Task is in default Task collection
    await Task.findByIdAndDelete(checkedTaskId)
      .then(() => {
        console.log("Task deleted from default list");
        res.redirect('/');
      })
      .catch(err => {
        console.error("Error deleting task:", err);
        res.redirect('/');
      });
  } else {
    // Task is inside a custom list
    await Route.findOneAndUpdate(
      { name: listName },
      { $pull: { tasks: { _id: checkedTaskId } } }
    )
      .then(() => {
        console.log(`Task deleted from ${listName} list`);
        res.redirect('/' + listName);
      })
      .catch(err => {
        console.error("Error deleting task from custom list:", err);
        res.redirect('/');
      });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});