/* eslint-disable require-jsdoc */
const autoBind = require('auto-bind');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const {name} = request.payload;
    const {owner} = request.auth.credentials;

    const playlistId = await this._service.addPlaylist(name, owner);

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const {owner} = request.auth.credentials;

    const playlists = await this._service.getAllPlaylists(owner);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const {id} = request.params;
    const {owner} = request.auth.credentials;

    await this._service.verifyPlaylistOwner(id, owner);
    await this._service.deletePlaylistById(id);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongToPlaylistHandler(request, h) {
    const {id: playlistId} = request.params;
    const {songId} = request.payload;
    const {owner} = request.auth.credentials;

    this._validator.validatePlaylistWithSongPayload(request.payload);
    await this._service.verifyPlaylistAccess(playlistId, owner);
    await this._service.addSongToPlaylist(playlistId, songId, owner);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan',
    });
    response.code(201);
    return response;
  }

  async getPlaylistWithSongsHandler(request) {
    const {id: playlistId} = request.params;
    const {owner: credentialId} = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    const playlist = await this._service.getPlaylistById(playlistId);
    const songs = await this._service.getSongsByPlaylistId(playlistId);

    return {
      status: 'success',
      data: {
        playlist: {
          ...playlist,
          songs: songs,
        },
      },
    };
  }

  async deleteSongFromPlaylistHandler(request) {
    const {id: playlistId} = request.params;
    const {songId} = request.payload;
    const {owner: credentialId} = request.auth.credentials;

    this._validator.validatePlaylistWithSongPayload(request.payload);
    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.deleteSongFromPlaylist(
        playlistId, songId, credentialId,
    );

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const {id: playlistId} = request.params;
    const {owner: credentialId} = request.auth.credentials;

    if (!credentialId) {
      throw new InvariantError('Wajib login terlebih dahulu');
    }

    await this._service.verifyPlaylistOwner(playlistId, credentialId);
    const activities = await this._service.getPlaylistActivities(playlistId);

    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
