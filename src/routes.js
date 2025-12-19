import { Router } from "express";

// ------------------  local imports -------------------
import { Authorization } from "./middleware/Authorization.js";
import companyRoutes from "./routes/company.routes.js";
import plantRoutes from "./routes/plant.routes.js";
import roleRoutes from "./routes/role.routes.js";
import usersRoutes from "./routes/users.routes.js";
import processRoutes from "./routes/process.routes.js";
import AssemblyRoutes from "./routes/assembly.routes.js";
import PartRoutes from "./routes/parts.routes.js";
import CheckItemRoutes from "./routes/checklist.routes.js";
import CheckListHistoryRoutes from "./routes/checkListHostory.routes.js";
import DashboardRoutes from "./routes/dashboards.routes.js"




const routes = Router();


routes.use("/users", usersRoutes);
routes.use("/company",           Authorization, companyRoutes);
routes.use("/plant",             Authorization, plantRoutes);
routes.use("/roles",             Authorization, roleRoutes);
routes.use("/process",           Authorization, processRoutes);
routes.use("/assembly",          Authorization, AssemblyRoutes);
routes.use("/parts",             Authorization, PartRoutes);
routes.use("/checkitem",         Authorization, CheckItemRoutes);
routes.use("/checkitem-history", Authorization, CheckListHistoryRoutes);
routes.use("/dashboard",         Authorization, DashboardRoutes);



export default routes;


