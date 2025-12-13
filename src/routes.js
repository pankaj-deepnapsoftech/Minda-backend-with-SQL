import {Router} from "express";

// ------------------  local imports -------------------
import companyRoutes from "./routes/company.routes.js";
import plantRoutes from "./routes/plant.routes.js";
import roleRoutes from "./routes/role.routes.js"
import usersRoutes from "./routes/users.routes.js"
import { Authorization } from "./middleware/Authorization.js";

const routes = Router();


routes.use("/company",Authorization,companyRoutes);
routes.use("/plant",Authorization,plantRoutes);
routes.use("/roles",Authorization,roleRoutes);
routes.use("/users",usersRoutes);


export default routes;


