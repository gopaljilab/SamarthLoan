import { Router, type IRouter } from "express";
import healthRouter from "./health";
import schemeRouter from "./schemes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(schemeRouter);

export default router;
