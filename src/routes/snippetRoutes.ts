import { Router } from 'express';
import { deleteSnippet, getSnippets, postSnippet, putSnippet } from '../ctrl/snippetCtrl';

const snippetPath = {
    root : "/",
}
const router = Router();

router.get(``,getSnippets)
router.post(``,postSnippet)
router.put(``,putSnippet)
router.delete(`${snippetPath.root}:id`,deleteSnippet)

export default router;