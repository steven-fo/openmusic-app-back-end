exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('user_album_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
    },
    album_id: {
      type: 'VARCHAR(50)',
    },
  }, {
    constraints: {
      foreignKeys: [
        {
          references: 'users(id)',
          columns: 'user_id',
          onDelete: 'CASCADE',
        },
        {
          references: 'albums(id)',
          columns: 'album_id',
          onDelete: 'CASCADE',
        },
      ],
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('user_album_likes');
};
