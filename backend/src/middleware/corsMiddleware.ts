//反向代理中间件
import cors from "cors";
import {APP} from "@/config";

const whiteList = APP.NODE_ENV === 'development' ? ['http://localhost:8080'] : ['https://your-domain.com'];

export const corsMiddleware = cors({
    origin(origin, callback){
        if (!origin || whiteList.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'))
    },
    credentials: true
})
