const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { CORS_OPTIONS } = require('./constants');

const configureServer = () => {
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors(CORS_OPTIONS));
  app.use(morgan('combined'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  return app;
};

module.exports = configureServer;