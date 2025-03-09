import { Router } from 'express';
import { 
    getIntroduction,
    getUser, 
    putAdventage, 
    putGoals, 
    putGrowth, 
    putMotivation,
} from '../ctrl/profileCtrl';

const profilePath = {
    "root" : "/",
    "introduction" : "/introduction",
    "motivation" : "/introduction/motivation",
    "growth" : "/introduction/growth",
    "adventage" : "/introduction/adventage",
    "goals" : "/introduction/goals",
}
const router = Router();

router.get(`${profilePath.root}`, getUser)
router.get(`${profilePath.introduction}`, getIntroduction)
router.put(`${profilePath.motivation}`, putMotivation)
router.put(`${profilePath.growth}`, putGrowth)
router.put(`${profilePath.adventage}`, putAdventage)
router.put(`${profilePath.goals}`, putGoals)

export default router;