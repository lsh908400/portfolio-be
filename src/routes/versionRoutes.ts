import { Router } from 'express';
import { getVersions } from '../ctrl/versionCtrl';

const versionPath = {
    root : "/",
}
const router = Router();

router.get('',getVersions)

export default router;