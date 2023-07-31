exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('collaborations', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
    },
    user_id: {
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
          references: 'users(id)',
          columns: 'user_id',
          onDelete: 'CASCADE',
        },
      ],
    },
  });

  pgm.addConstraint('collaborations',
      'unique_playlist_id_and_user_id', 'UNIQUE(playlist_id, user_id)',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('collaborations');
};
