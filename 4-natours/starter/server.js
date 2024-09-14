const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); // Corrected typo
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABSE_PASSWORD,
);

const connectDB = async () => {
  try {
    mongoose.connect(DB);
    console.log('Database Connected');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
};

connectDB();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
});
