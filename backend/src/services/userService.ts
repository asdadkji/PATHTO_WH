//用户服务
import {UserModel} from "@/models/User";
import type {UserInfo,UpdateUserRequest} from "@/types/apis/User";

export const UserService = {
    //获取用户信息
    async getUserInfo(userId: number): Promise<UserInfo | null> {
        const dbUser = await UserModel.findById(userId);
        if (!dbUser) return null;
        return {
            id: dbUser.id,
            username: dbUser.username,
            phone:dbUser.phone,
            student_id:dbUser.student_id,
            avatar_url: dbUser.avatar_url,
            college: dbUser.college,
            bio: dbUser.bio,
            gender: dbUser.gender,
            signature: dbUser.signature,
            is_active: dbUser.is_active,
            is_banned: dbUser.is_banned,
            ban_reason: dbUser.ban_reason,
            total_transactions: dbUser.total_transactions,
            rating: dbUser.rating,
            qq:dbUser.qq
        }
    },
    //更新用户信息
    async updateUserProfile(userId: number, updateData: UpdateUserRequest) {
        try {
            //数据验证-防止在无更新数据情况下提交
            if (Object.keys(updateData).length === 0) {
                return { code: 1, message: 'No update data provided' };
            }
            // 验证用户是否真实存在
            const existingUser = await UserModel.findById(userId);
            if (!existingUser) {
                return { code: 1, message: 'User not found' };
            }
            //开始更新
            const updated = await UserModel.update(userId, updateData);
            if (!updated) {
                return { code: 1, message: 'Failed to update user' };
            }
            //返回更新后的用户信息
            const updatedUser = await this.getUserInfo(userId);
            return { success: true, data: updatedUser, message: 'User updated successfully' };
        } catch (e) {
            console.error('更新用户资料错误',e)
            return { code: 1, message: '服务器内部错误' };
        }
    }
}
