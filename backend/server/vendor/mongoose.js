const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

const connection = {
  readyState: 0,
  db: {
    databaseName: 'test',
    admin: () => ({
      ping: async () => ({ ok: 1 }),
    }),
    collection: () => ({
      createIndex: async () => undefined,
    }),
    command: async () => ({ ok: 1 }),
  },
};

const Types = {
  ObjectId: {
    isValid(value) {
      return OBJECT_ID_PATTERN.test(String(value));
    },
  },
};

class Schema {
  constructor(definition, options) {
    this.definition = definition;
    this.options = options;
  }
}

Schema.Types = {
  ObjectId: function ObjectId() {},
};

const model = (name, schema) => ({ name, schema });

const connect = async () => {
  connection.readyState = 1;
  return connection;
};

const disconnect = async () => {
  connection.readyState = 0;
};

module.exports = {
  Types,
  Schema,
  model,
  connection,
  connect,
  disconnect,
};
