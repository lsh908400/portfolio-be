import { Router } from 'express';
import { getProject } from '../ctrl/projectCtrl';

const projectPath = {
    root : "/",
}
const router = Router();

router.get(`${projectPath.root}:type`,getProject)

export default router;