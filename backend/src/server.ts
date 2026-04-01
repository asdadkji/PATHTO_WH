import {app} from './app';
import {APP} from './config';
import { pool } from './database';
app.listen(APP.PORT, () => {
    console.log(`Server is running on port ${APP.PORT}`);
})
pool.query('SELECT 1 + 1 AS ok')
    .then(() => console.log('✅ DB connected'))
    .catch((e) => {
        console.error('❌ DB failed', e);
        // 若想让 DB 不通就退出进程，加下面一行：
        // process.exit(1);
    });