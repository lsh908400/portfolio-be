import { Router } from 'express';
import { deleteTimeline, getTimelines, postTimeline } from '../ctrl/timelineCtrl';

const timelinePath = {
    root : "/",
}
const router = Router();

router.get(`${timelinePath.root}`,getTimelines)
router.post(``,postTimeline)
router.delete(`${timelinePath.root}:id`,deleteTimeline)

export default router;