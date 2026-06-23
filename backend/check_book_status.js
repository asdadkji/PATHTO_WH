const mysql = require('mysql2');

// 创建数据库连接
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'campus_book_exchange'
});

// 连接数据库
connection.connect((err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('数据库连接成功');

  // 查询图书记录
  connection.query(
    'SELECT id, title, status, merchant_id FROM books WHERE id = 1 AND merchant_id = 1',
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        connection.end();
        return;
      }

      console.log('图书记录:', results);

      // 尝试下架图书
      connection.query(
        'UPDATE books SET status = "pending" WHERE id = 1 AND merchant_id = 1',
        (err, updateResults) => {
          if (err) {
            console.error('更新失败:', err);
            connection.end();
            return;
          }

          console.log('更新结果:', updateResults);

          // 再次查询图书记录，看看状态是否改变
          connection.query(
            'SELECT id, title, status, merchant_id FROM books WHERE id = 1 AND merchant_id = 1',
            (err, updatedResults) => {
              if (err) {
                console.error('查询失败:', err);
                connection.end();
                return;
              }

              console.log('更新后的图书记录:', updatedResults);
              connection.end();
            }
          );
        }
      );
    }
  );
});