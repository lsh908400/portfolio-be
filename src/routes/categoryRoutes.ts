import { Router } from 'express';
import { deleteCategory, getCategory, postCategory, putCategories } from '../ctrl/categoryCtrl';

const categoryPath = {
    root : "/"
}
const router = Router();

router.post(`${categoryPath.root}`, postCategory)
router.get(`${categoryPath.root}:type`, getCategory)
router.delete(`${categoryPath.root}:id`, deleteCategory)
router.put(`${categoryPath.root}`, putCategories)


export default router;