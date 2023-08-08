/* eslint-disable require-jsdoc */
const ClientError = require('../../exceptions/ClientError');

class ExportsHandler {
  constructor(service, playlistsService, validator) {
    this._service = service;
    this._playlistsService = playlistsService;
    this._validator = validator;

    this.postExportPlaylistsHandler =
    this.postExportPlaylistsHandler.bind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    try {
      this._validator.validateExportPlaylistPayload(request.payload);

      const {playlistId} = request.params;
      const {owner} = request.auth.credentials;

      await this._playlistsService.verifyPlaylistOwner(playlistId, owner);

      const message = {
        playlistId: request.params,
        targetEmail: request.payload.targetEmail,
      };

      await this._service.sendMessage(
          'export:playlists', JSON.stringify(message));

      const response = h.response({
        status: 'success',
        message: 'Permintaan Anda sedang kami proses',
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
    }
  }
}

module.exports = ExportsHandler;
