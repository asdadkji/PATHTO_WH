//图书路由
import {Router} from "express";
import {filter,showBooksAll,getBooksCategory,addBooks,deleteBooks,getMerchantBooks} from "@/controllers/bookController";

export const bookRouter = Router();
bookRouter.get("/search", filter);
bookRouter.get("/showAll/:id", showBooksAll);
bookRouter.get("/category", getBooksCategory);
bookRouter.post("/add", addBooks);
bookRouter.patch("/change/:merchantId/:bookId", deleteBooks);
bookRouter.get("/merchant/:merchantId", getMerchantBooks);

