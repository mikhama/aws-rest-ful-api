// eslint-disable-next-line import/no-extraneous-dependencies
const AWS = require('aws-sdk');
const uuidv1 = require('uuid/v1');
const message = require('./message');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { NOTES_TABLE } = process.env;

module.exports.create = async (event) => {
  const { text, isDone } = JSON.parse(event.body);
  const id = uuidv1();
  const timestamp = Date.now();

  return new Promise((resolve) => {
    if (typeof id !== 'string') {
      message(400, 'Parameter "id" must be a string!', resolve);
    } else if (typeof text !== 'string') {
      message(400, 'Parameter "text" must be a string!', resolve);
    }

    const params = {
      TableName: NOTES_TABLE,
      Item: {
        id,
        timestamp,
        text: text.slice(0, 40),
        isDone,
      },
    };

    dynamoDb.put(params, (error) => {
      if (error) {
        global.console.log(error);
        message(error.statusCode || 500, 'Could not create the note!', resolve);
      }

      message(200, JSON.stringify(params.Item), resolve);
    });
  });
};

module.exports.getOne = async (event) => {
  const { id } = event.pathParameters;

  const params = {
    TableName: NOTES_TABLE,
    Key: {
      id,
    },
  };

  return new Promise((resolve) => {
    dynamoDb.get(params, (error, result) => {
      if (error) {
        global.console.log(error);

        message(400, 'Could not get note!', resolve);
      }

      if (result.Item) {
        message(200, JSON.stringify(result.Item), resolve);
      } else {
        message(404, 'Note is not found', resolve);
      }
    });
  });
};

module.exports.getAll = async () => {
  const params = {
    TableName: NOTES_TABLE,
  };

  return new Promise((resolve) => {
    dynamoDb.scan(params, (error, result = { Items: [] }) => {
      if (error) {
        global.console.log(error);

        message(400, 'Could not get all notes!', resolve);
      }

      if (result.Items.length > 0) {
        const items = result.Items.sort((a, b) => b.timestamp - a.timestamp);
        message(200, JSON.stringify(items), resolve);
      } else {
        message(404, 'Notes are not found!', resolve);
      }
    });
  });
};

module.exports.update = async (event) => {
  const { id } = event.pathParameters;
  const { text, isDone } = JSON.parse(event.body);

  return new Promise((resolve) => {
    if (typeof id !== 'string') {
      message(400, 'Parameter "id" must be a string!', resolve);
    } else if (typeof text !== 'string') {
      message(400, 'Parameter "text" must be a string!', resolve);
    }

    const params = {
      TableName: NOTES_TABLE,
      Key: {
        id,
      },
      UpdateExpression: 'set #text = :t, isDone = :i',
      ExpressionAttributeValues: {
        ':t': text.slice(0, 40),
        ':i': isDone,
      },
      ExpressionAttributeNames: {
        '#text': 'text',
      },
      ReturnValues: 'UPDATED_NEW',
    };

    dynamoDb.update(params, (error, result) => {
      if (error) {
        global.console.log(error);

        message(400, 'Could not update note!', resolve);
      }

      message(200, JSON.stringify(result.Attributes), resolve);
    });
  });
};

module.exports.delete = async (event) => {
  const { id } = event.pathParameters;

  const params = {
    TableName: NOTES_TABLE,
    Key: {
      id,
    },
  };

  return new Promise((resolve) => {
    dynamoDb.delete(params, (error) => {
      if (error) {
        global.console.log(error);

        message(400, 'Could not delete note!', resolve);
      }

      message(200, JSON.stringify({ ok: true }), resolve);
    });
  });
};
