const express = require("express");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: "us-east-1",
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const app = express();
app.use(bodyParser.json());

const tableName = "reserve";

app.get("/reserves", async (req, res) => {
  const params = {
    TableName: tableName, // Replace with your actual DynamoDB table name
  };

  try {
    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.get("/userReserves", async (req, res) => {
  const userId = req.query.userId;

  const params = {
    TableName: tableName, // Replace with your actual DynamoDB table name
    FilterExpression: "#userId = :userId",
    ExpressionAttributeNames: {
      "#userId": "userId",
    },
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };

  try {
    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.get("/reserveById", async (req, res) => {
  const id = req.query.id;

  const params = {
    TableName: tableName, // Replace with your actual DynamoDB table name
    KeyConditionExpression: "#id = :id",
    ExpressionAttributeNames: {
      "#id": "id",
    },
    ExpressionAttributeValues: {
      ":id": id,
    },
  };

  try {
    const data = await dynamoDB.query(params).promise();
    res.json(data.Items[0]); // Assuming that id is unique
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.post("/reserve", async (req, res) => {
  const item = req.body;
  item.id = item._id;
  delete item._id;

  const params = {
    TableName: "reserve",
    Item: item,
  };

  try {
    await dynamoDB.put(params).promise();
    res.status(200).send(item.id);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put("/reserve", async (req, res) => {
  const item = req.body;
  item.id = item._id;
  delete item._id;

  const params = {
    TableName: tableName,
    Key: { id: item.id },
    UpdateExpression:
      "set userId=:userId, roomId=:roomId, equipmentsId=:equipmentsId, reserveFrom=:reserveFrom, reserveTo=:reserveTo, timestamp=:timestamp, status=:status",
    ExpressionAttributeValues: {
      ":userId": item.userId,
      ":roomId": item.roomId,
      ":equipmentsId": item.equipmentsId,
      ":reserveFrom": item.reserveFrom,
      ":reserveTo": item.reserveTo,
      ":timestamp": item.timestamp,
      ":status": item.status,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamoDB.update(params).promise();
    res.status(200).send(`Updated Reserve ${item.id}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete("/reserve/:id", async (req, res) => {
  const params = {
    TableName: tableName,
    Key: {
      id: req.params.id,
    },
  };

  try {
    await dynamoDB.delete(params).promise();
    res.status(200).send(`Deleted Reserve ${req.params.id}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
