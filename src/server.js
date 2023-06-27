require('dotenv').config();

const hapi = require('@hapi/hapi');

const init = async () => {
  const server = hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register({
    plugin: '',
    options: {
      service: '',
      validator: '',
    },
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
