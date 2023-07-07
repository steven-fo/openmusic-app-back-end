require('dotenv').config();

const hapi = require('@hapi/hapi');
const albums = require('./api/albums');
const AlbumsService = require('./services/inMemory/AlbumsService');
const AlbumsValidator = require('./validator/albums');

const init = async () => {
  const albumsService = new AlbumsService();
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
    plugin: albums,
    options: {
      service: albumsService,
      validator: AlbumsValidator,
    },
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
