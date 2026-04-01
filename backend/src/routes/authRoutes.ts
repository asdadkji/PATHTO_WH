//认证路由
import {Router} from "express";
import {register, login, resetPwd, applySeller, beforeResetPwd,isMerchant} from "@/controllers/authController";

export const authRouter = Router();
authRouter.post('/register',register);
authRouter.post('/login',login);
authRouter.post('/resetPwd',resetPwd);
authRouter.post('/seller',applySeller);
authRouter.post('/beforeResetPwd',beforeResetPwd);
authRouter.get('/isMerchant',isMerchant);
/*
import {AuthReq, mustLogin} from "@/middleware/authMiddleware";
authRouter.get('profile',mustLogin, (req:AuthReq, res)=>{
    res.json({user:req.user})
})*/
