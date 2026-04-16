//认证路由
import {Router} from "express";
import {register, login, resetPwd, applySeller, beforeResetPwd,isMerchant, getMerchantId} from "@/controllers/authController";

export const authRouter = Router();
authRouter.post('/register',register);
authRouter.post('/login',login);
authRouter.post('/resetPwd',resetPwd);
authRouter.post('/seller',applySeller);
authRouter.post('/beforeResetPwd',beforeResetPwd);
authRouter.get('/isMerchant',isMerchant);
authRouter.get('/merchantId',getMerchantId);
/*
import {AuthReq, mustLogin} from "@/middleware/authMiddleware";
authRouter.get('profile',mustLogin, (req:AuthReq, res)=>{
    res.json({user:req.user})
})*/
