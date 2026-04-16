//认证逻辑
import jwt from 'jsonwebtoken'
import {AUTH} from '@/config'
import bcrypt from 'bcryptjs'
import {AuthModel} from "@/models/Auth";

export const AuthService = {
    //注册
    async register(username: string, password: string, phone: number) {
        const exist = await AuthModel.findByUsername(username)
        if (exist) throw new Error('用户已存在');
        const hash = await bcrypt.hash(password, AUTH.BCRYPT_ROUNDS);
        const userId = await AuthModel.create({username, password_hash: hash, phone});
        return { userId };
    },
    //登录
    async login(username: string, password: string) {
        const user = await AuthModel.findByUsername(username);
        if (!user) throw new Error('用户不存在');
        // 检查用户是否被封禁
        if (user.is_banned) throw new Error('账号已被封禁，无法登录');
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) throw new Error('密码错误');
        const payload = { userId: user.id,role: user.role };
        const token = jwt.sign(payload, AUTH.JWT_SECRET as string, { expiresIn: '1d' });
        return {token, user: {id: user.id, username: user.username, phone: user.phone}}
    },
    //重置密码前置验证
    async beforeResetPwdS(username: string,phone:number) {
        const isExist = await AuthModel.checkAccount(username,phone)
        if(!isExist) throw new Error('用户不存在或手机号未绑定');
        return isExist
    },
    //重置密码
    async resetPwd(username: string, newPwd: string) {
        const user = await AuthModel.findByUsername(username);
        if (!user) throw new Error('用户不存在');
        const hash = await bcrypt.hash(newPwd, AUTH.BCRYPT_ROUNDS);
        await AuthModel.updatePwd(user.id, hash);
    },
    //商家登录认证
    async applyForMerchant(userId: number, realUserName: string) {
        const exist = await AuthModel.existByUserId(userId)
        if(exist) throw new Error('您已提交过商家认证申请')
        await AuthModel.createMerchant(userId, realUserName)
        return exist
    },
    //判定是否为商家用户
    async isMerchantS(userId: number) {
        const isMerchant = await AuthModel.existByUserId(userId)
        /*if(!isMerchant) throw new Error('您不是商家用户')*/
        return isMerchant
    },
    
    //获取商家ID
    async getMerchantId(userId: number) {
        const merchantId = await AuthModel.getMerchantIdByUserId(userId)
        if(!merchantId) throw new Error('您还不是商家，请先完成商家认证')
        return merchantId
    }
}


