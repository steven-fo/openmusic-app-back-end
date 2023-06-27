/* eslint-disable require-jsdoc */
const {nanoid} = require('nanoid');

class SongsService {
  constructor() {
    this._songs = [];
  }

  addSong({title, year, genre, performer, duration, albumId}) {
    const id = nanoid(16);
    const newSong = {
      id, title, year, performer, genre, duration, albumId,
    };

    this._songs.push(newSong);

    const isSuccess = this._songs.filter((song) => song.id === id).length > 0;

    if (!isSuccess) {
      throw new Error('Lagu gagal ditambahkan');
    }

    return id;
  }

  getSongs() {
    return this._songs;
  }

  getSongById(id) {
    const song = this._songs.filter((n) => n.id === id)[0];

    if (!song) {
      throw new Error('Lagu tidak ditemukan');
    }
    return song;
  }

  editSongById(id, {title, year, genre, performer, duration, albumId}) {
    const index = this._songs.findIndex((n) => n.id === id);

    if (index === -1) {
      throw new Error('Gagal memperbarui lagu. Lagu tidak ditemukan');
    }

    this._songs[index] = {
      ...this._songs[index],
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    };
  }

  deleteSongById(id) {
    const index = this._songs.findIndex((n) => n.id === id);

    if (index === -1) {
      throw new Error('Lagu gagal dihapus. Lagu tidak ditemukan');
    }

    this._songs.splice(index, 1);
  }
}

module.exports = SongsService;
