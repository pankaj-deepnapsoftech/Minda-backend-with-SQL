import {Router} from "express";

// ---------------------- local imports --------------------------
import { GetAllemployees, LogedInUser, LoginUser, LogoutUser, RefreshToken, registerUser, SearchEmployees, UpdateUser } from "../controller/user.controller.js";
import { Validater } from "../middleware/validator.js";
import { userValidationSchema } from "../validation/users.validation.js";
import { Authorization } from "../middleware/Authorization.js";


const routes = Router();

routes.route("/register-user").post(Validater(userValidationSchema),registerUser);
routes.route("/login-user").post(LoginUser);
routes.route("/logout-user").get(Authorization,LogoutUser);
routes.route("/loged-in-user").get(Authorization,LogedInUser);
routes.route("/update-user-by-admin/:id").put(Authorization,UpdateUser);
routes.route("/refresh-token").post(RefreshToken);
routes.route("/get-employees").get(Authorization,GetAllemployees);
routes.route("/search-employee").get(Authorization,SearchEmployees);






export default routes;