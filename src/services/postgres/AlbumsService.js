/* eslint-disable require-jsdoc */
const {Pool} = require('pg');
const {nanoid} = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const {mapDBToModel} = require('../../utils/albums');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({name, year}) {
    const id = 'album-'+nanoid(16);

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, name, year, null],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result.rows.map(mapDBToModel);
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return result.rows.map(mapDBToModel)[0];
  }

  async editAlbumById(id, {name, year}) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async getSongByAlbumId(id) {
    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE "albumId" = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async addCover(albumId, coverUrl) {
    const query = {
      text: `UPDATE albums SET cover = $1
      WHERE albums.id = $2 RETURNING id`,
      values: [coverUrl, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Cover gagal dimasukkan');
    }
  }

  async addLike(albumId, userId) {
    const cekQuery = {
      text: `SELECT * FROM albums WHERE id = $1`,
      values: [albumId],
    };

    const cek = await this._pool.query(cekQuery);
    if (!cek.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const checkQuery = {
      text: `SELECT * FROM user_album_likes
      WHERE user_id = $1 AND album_id = $2`,
      values: [userId, albumId],
    };

    const flag = await this._pool.query(checkQuery);
    if (!flag.rowCount) {
      const id = `likes-${nanoid(16)}`;
      const query = {
        text: `INSERT INTO user_album_likes VALUES($1, $2, $3)
        RETURNING id`,
        values: [id, userId, albumId],
      };

      const result = await this._pool.query(query);

      if (!result.rows[0].id) {
        throw new NotFoundError('Album gagal disukai');
      }
    } else {
      throw new InvariantError('Album sudah disukai');
    }

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async deleteLike(albumId, userId) {
    const query = {
      text: `DELETE FROM user_album_likes
      WHERE album_id = $1 AND user_id = $2
      RETURNING id`,
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal tidak disukai');
    }

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async getLike(albumId) {
    try {
      const result = await this._cacheService.get(`albums:${albumId}`);
      return [JSON.parse(result), true];
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);

      await this._cacheService.set(`albums:${albumId}`,
          JSON.stringify(result.rowCount));

      if (!result.rowCount) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      return [result.rowCount, false];
    }
  }
}

module.exports = AlbumsService;
