import { Router } from 'express';
import { deleteFolder, getFolder, postFolder } from '../ctrl/folderCtrl';


const router = Router();

router.get('', getFolder);
router.post('', postFolder);
router.delete('',deleteFolder);

export default router;