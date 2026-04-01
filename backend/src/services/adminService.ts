//后台服务
import {AdminModel} from '@/models/Admin'

export const adminService = {
    //获取用户总数
    async getUserCountS() {
        try {
            return await AdminModel.getUserCount()
        }catch (e) {
            console.log('获取用户总数失败',e)
        }
    },
    //获取性别占比
    async getSexRatioS() {
        try {
            return await AdminModel.getGenderCount()
        }catch (e) {
            console.log('获取性别占比失败',e)
        }
    },
    //总图表
    async getChartS() {
        try {
            return await AdminModel.getDashboardData()
        }catch (e) {
            console.log('获取总图表失败',e)
        }
    },
    //判定是否为管理员
    async isAdminS(id: number) {
        try {
            return await AdminModel.isAdmin(id)
        }catch (e) {
            console.log('判定是否为管理员失败',e)
        }
    },
    //获取管理员列表
    async getAdminListS() {
        try {
            return await AdminModel.getAdminList()
        }catch (e) {
            console.log('获取管理员列表失败',e)
        }
    },
    //赋予管理权限
    async setAdminS(phone:string,username:string) {
        try {
            if (!username || !phone) {
                throw new Error('用户名和手机号不能为空');
            }
            const isExist = await AdminModel.checkUserExist(phone,username)
            if(!isExist) {
                throw new Error('用户不存在');
            }
            return await AdminModel.grantAdminPermission(phone,username)
        }catch (e) {
            console.log('赋予管理权限失败',e)
            throw e
        }
    },
    //取消管理权限
    async removeAdminS(id: number) {
        try {
            return await AdminModel.cancelAdminPermission(id)
        }catch (e) {
            console.log('取消管理权限失败',e)
        }
    },
    //获得商家列表
    async getShopListS(page:number,pageSize:number) {
        try {
            return await AdminModel.getBusinessList(page,pageSize)
        }catch (e) {
            console.log('获取商家列表失败',e)
        }
    },
    //冻结商家权限
    async freezeShopS(id: number,reason: string) {
        try {
            if(reason.length === 0) {
                throw new Error('请输入冻结原因')
            }
            return await AdminModel.freezeBusiness(id,reason)
        }catch (e) {
            console.log('冻结商家权限失败',e)
        }
    },
    //解冻商家权限
    async unfreezeShopS(id: number) {
        try {
            return await AdminModel.unfreezeBusiness(id)
        }catch (e) {
            console.log('解冻商家权限失败',e)
        }
    },
    //获取已送达的图书
    async getDeliveredBooksS() {
        try {
            return await AdminModel.getDeliveredGoods()
        }catch (e) {
            console.log('获取已送达的图书失败',e)
        }
    }
}