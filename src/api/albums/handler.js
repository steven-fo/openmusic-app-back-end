/* eslint-disable require-jsdoc */
const config = require('../../utils/config');
const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(service, storageService, validator) {
    this._service = service;
    this._storageService = storageService;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const {name, year} = request.payload;

    const albumId = await this._service.addAlbum({name, year});

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler() {
    const albums = await this._service.getAlbums();
    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getAlbumByIdHandler(request, h) {
    const {id} = request.params;
    const album = await this._service.getAlbumById(id);
    const {id: albumId, name, year, cover} = album;
    const songs = await this._service.getSongByAlbumId(id);
    if (!songs) {
      return {
        status: 'success',
        data: {
          album: {
            id: albumId,
            name,
            coverUrl: cover,
          },
        },
      };
    } else {
      return {
        status: 'success',
        data: {
          album: {
            id: albumId,
            name,
            year,
            coverUrl: cover,
            songs,
          },
        },
      };
    }
  }

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const {id} = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request, h) {
    const {id} = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumCoverHandler(request, h) {
    const {id} = request.params;
    const {cover} = request.payload;
    this._validator.validateUploadPayload(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const fileLocation = `http://${config.app.host}:${config.app.port}/upload/images/${filename}`;

    await this._service.addCover(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
      data: {
        fileLocation,
      },
    });
    response.code(201);
    return response;
  }

  async postLikeAlbumHandler(request, h) {
    const {id} = request.params;
    const {owner} = request.auth.credentials;

    await this._service.addLike(id, owner);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil disukai',
    });
    response.code(201);
    return response;
  }

  async deleteLikeAlbumHandler(request) {
    const {id} = request.params;
    const {owner} = request.auth.credentials;

    await this._service.deleteLike(id, owner);

    return {
      status: 'success',
      message: 'Album berhasil tidak disukai',
    };
  }

  async getLikeAlbumHandler(request, h) {
    const {id} = request.params;

    const [likes, flag] = await this._service.getLike(id);

    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    if (flag) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }
}

module.exports = AlbumsHandler;
