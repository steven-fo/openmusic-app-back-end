const hapi = require('@hapi/hapi');

const init = async () => {
  const server = hapi.server({
    port: '',
    host: '',
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
