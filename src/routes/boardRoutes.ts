import { Router } from 'express';
import { deleteBoards, getBoards, patchBoardTitle, postBoard, searchBoards } from '../ctrl/boardCtrl';

const boardPath = {
    root : "/",
    search : "/search",
    title : "/title"
}
const router = Router();

router.get(`/:categoryId`, getBoards)
router.post(``, postBoard)
router.delete(``, deleteBoards)
router.patch(`${boardPath.title}`,patchBoardTitle)
router.get(`${boardPath.search}/:option/:keyword/:categoryId`,searchBoards)


export default router;