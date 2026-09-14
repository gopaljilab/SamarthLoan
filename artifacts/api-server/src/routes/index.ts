import { Router, type IRouter } from "express";
import healthRouter from "./health";
import schemeRouter from "./schemes";
import applicationsRouter from "./applications";
import profilesRouter from "./profiles";
import dataRouter from "./data";

const router: IRouter = Router();

router.use(healthRouter);
router.use(schemeRouter);
router.use(applicationsRouter);
router.use(profilesRouter);
router.use(dataRouter);

export default router;
