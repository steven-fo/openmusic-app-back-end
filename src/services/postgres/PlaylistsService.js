/* eslint-disable require-jsdoc */
const {Pool} = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const {nanoid} = require('nanoid');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist(name, credentialId) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, credentialId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAllPlaylists(credentialId) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      LEFT JOIN users ON playlists.owner = users.id
      WHERE playlists.owner = $1 OR collaborations.user_id = $1
      GROUP BY playlists.id, users.username`,
      values: [credentialId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async verifySongId(songId) {
    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE id = $1',
      values: [songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return result.rows[0];
  }

  async addSongToPlaylist(playlistId, songId, credentialId) {
    await this.verifySongId(songId);

    const activityId = `activity-${nanoid(16)}`;
    const action = 'add';
    const date = new Date();
    const time = date.toISOString();
    const activityQuery = {
      text: `INSERT INTO playlist_song_activities
      VALUES($1, $2, $3, $4, $5, $6)`,
      values: [activityId, playlistId, songId, credentialId, action, time],
    };

    await this._pool.query(activityQuery);

    const id = `playlist-songs-${nanoid(16)}`;
    const query = {
      text: `INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id`,
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }
  }

  async getPlaylistById(playlistId) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
      INNER JOIN users ON playlists.owner = users.id
      WHERE playlists.id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows[0];
  }

  async getSongsByPlaylistId(playlistId) {
    const query = {
      text: `SELECT songs.id, songs.title, songs.performer FROM songs
      INNER JOIN playlist_songs ON songs.id = playlist_songs.song_id
      WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deleteSongFromPlaylist(playlistId, songId, credentialId) {
    const activityId = `activity-${nanoid(16)}`;
    const action = 'delete';
    const date = new Date();
    const time = date.toISOString();
    const activityQuery = {
      text: `INSERT INTO playlist_song_activities
      VALUES($1, $2, $3, $4, $5, $6)`,
      values: [activityId, playlistId, songId, credentialId, action, time],
    };

    await this._pool.query(activityQuery);

    const query = {
      text: `DELETE FROM playlist_songs
      WHERE playlist_id = $1 AND song_id = $2
      RETURNING id`,
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus');
    }
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE playlists.id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch (error) {
        throw new AuthorizationError(
            'Anda tidak berhak mengakses resource ini');
      }
    }
  }

  async getPlaylistActivities(playlistId) {
    await this.getPlaylistById(playlistId);

    const query = {
      text: `SELECT users.username, songs.title, action, time
      FROM playlist_song_activities
      INNER JOIN users ON users.id = playlist_song_activities.user_id
      INNER JOIN songs ON songs.id = playlist_song_activities.song_id
      WHERE playlist_song_activities.playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

module.exports = PlaylistsService;
