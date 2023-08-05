exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('playlist_songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
    },
    song_id: {
      type: 'VARCHAR(50)',
    },
  }, {
    constraints: {
      foreignKeys: [
        {
          references: 'playlists(id)',
          columns: 'playlist_id',
          onDelete: 'CASCADE',
        },
        {
          references: 'songs(id)',
          columns: 'song_id',
          onDelete: 'CASCADE',
        },
      ],
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('playlist_songs');
};
