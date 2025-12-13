import {Router} from "express";

// ------------------  local imports -------------------
import companyRoutes from "./routes/company.routes.js";
import plantRoutes from "./routes/plant.routes.js";
import roleRoutes from "./routes/role.routes.js"

const routes = Router();


routes.use("/company",companyRoutes);
routes.use("/plant",plantRoutes);
routes.use("/roles",roleRoutes);


export default routes;


