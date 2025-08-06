const notFoundHandler = (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  };
  
  const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong!' 
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  };
  
  module.exports = {
    notFoundHandler,
    errorHandler
  };