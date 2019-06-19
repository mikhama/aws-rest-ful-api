module.exports = (statusCode, body, callback) => {
  const message = {
    statusCode,
    body,
  };

  message.headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  };

  if (statusCode !== 200) {
    message.headers['Content-Type'] = 'text/plain';
  }

  callback(message);
};
