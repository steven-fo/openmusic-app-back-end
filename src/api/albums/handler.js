/* eslint-disable require-jsdoc */
class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumsHandler = this.getAlbumsHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);

    this.postAlbumCoverHandler = this.postAlbumCoverHandler.bind(this);
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
    const songs = await this._service.getSongByAlbumId(id);
    if (!songs) {
      return {
        status: 'success',
        data: {
          album,
        },
      };
    } else {
      return {
        status: 'success',
        data: {
          album: {
            ...album,
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
    const {data} = request.payload;
    this._validator.validateUploadPayload(data.hapi.headers);

    const filename = await this._service.writeFile(data, data.hapi);
    const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`;

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
    } else {
      return response;
    }
  }
}

module.exports = AlbumsHandler;
