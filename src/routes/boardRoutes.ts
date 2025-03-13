import { Router } from 'express';
import { deleteBoards, getBoards, postBoard, searchBoards } from '../ctrl/boardCtrl';

const boardPath = {
    root : "/",
    search : "/search",
}
const router = Router();

router.get(`/:categoryId`, getBoards)
router.post(``, postBoard)
router.delete(``, deleteBoards)
router.get(`${boardPath.search}/:option/:keyword/:categoryId`,searchBoards)


export default router;