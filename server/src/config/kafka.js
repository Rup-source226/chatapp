const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'chatapp-server',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'chatapp-group' });

let isProducerConnected = false;
let isConsumerConnected = false;

const connectProducer = async () => {
  try {
    await producer.connect();
    isProducerConnected = true;
    console.log('Kafka Producer Connected');
    return producer;
  } catch (error) {
    console.error('Kafka Producer Connection Error:', error.message);
    isProducerConnected = false;
  }
};

const connectConsumer = async () => {
  try {
    await consumer.connect();
    isConsumerConnected = true;
    console.log('Kafka Consumer Connected');
    return consumer;
  } catch (error) {
    console.error('Kafka Consumer Connection Error:', error.message);
    isConsumerConnected = false;
  }
};

// Send message to Kafka topic
const sendMessage = async (topic, message) => {
  try {
    if (!isProducerConnected) {
      await connectProducer();
    }
    
    await producer.send({
      topic,
      messages: [
        {
          key: message.key || null,
          value: JSON.stringify(message.value),
          timestamp: Date.now().toString(),
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Kafka Send Message Error:', error.message);
    return false;
  }
};

// Subscribe to a Kafka topic
const subscribeToTopic = async (topic, fromBeginning = false) => {
  try {
    if (!isConsumerConnected) {
      await connectConsumer();
    }
    
    await consumer.subscribe({ topic, fromBeginning });
    return true;
  } catch (error) {
    console.error('Kafka Subscribe Error:', error.message);
    return false;
  }
};

// Consume messages from subscribed topics
const consumeMessages = async (callback) => {
  try {
    if (!isConsumerConnected) {
      await connectConsumer();
    }
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageData = {
          topic,
          partition,
          offset: message.offset,
          key: message.key?.toString(),
          value: JSON.parse(message.value.toString()),
          timestamp: message.timestamp,
        };
        callback(messageData);
      },
    });
  } catch (error) {
    console.error('Kafka Consume Error:', error.message);
  }
};

// Message topics
const TOPICS = {
  NEW_MESSAGE: 'chat-messages',
  TYPING_INDICATOR: 'typing-indicator',
  SEEN_STATUS: 'seen-status',
  USER_STATUS: 'user-status',
};

module.exports = {
  kafka,
  producer,
  consumer,
  connectProducer,
  connectConsumer,
  sendMessage,
  subscribeToTopic,
  consumeMessages,
  TOPICS,
  isProducerConnected: () => isProducerConnected,
  isConsumerConnected: () => isConsumerConnected,
};
