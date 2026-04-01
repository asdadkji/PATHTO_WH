//用户路由
import {Router} from "express";
import {UserController} from "@/controllers/userController";

export const userRouter = Router();
userRouter.get("/profile/:userId", UserController.getUserInfo);
userRouter.put("/profile/:userId/change", UserController.updateUser);