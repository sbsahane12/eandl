const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const adminController = require('../controllers/adminController');
const  { isLoggedIn, isAdmin} = require('../middleware');

router.get('/profile', adminController.dashboard);
router.get('/manageUsers',adminController.manageUsers);
router.get('/users/:year',adminController.usersByYear);
router.get('/createUser',adminController.createUserForm);
router.post('/createUser',adminController.createUser);
router.get('/editUser/:userId',adminController.editUser);
router.post('/updateUser/:userId',adminController.updateUser);
router.delete('/deleteUser/:userId/:year',adminController.deleteUser);

router.get('/schemes',adminController.manageSchemes);
router.get('/schemes/earn-learn-student/new',adminController.newSchemeForm);
router.post('/schemes/earn-learn-student/new',adminController.addScheme);

router.get('/schemes/earn-learn-student/:year',adminController.getUsersByYear);
router.get('/schemes/earn-learn-student/:year/schemes/:userId',adminController.schemesByUserAndYear);
router.get('/schemes/earn-learn-student/:year/schemes/:scheme_id/edit',adminController.editSchemeForm);
router.put('/schemes/earn-learn-student/:year/schemes/:scheme_id/update',adminController.updateScheme);
router.delete('/schemes/earn-learn-student/:year/schemes/:scheme_id/delete',adminController.deleteScheme);



router.get('/users/:year/word',adminController.downloadUsersDataWord);
router.get('/users/:year/excel',adminController.downloadUsersDataExcel);


router.get('/schemes/earn-learn-student/:userId/:year/schemes/download-ground-excel/:month',adminController.downloadGroundExcel);
router.get('/schemes/earn-learn-student/:userId/:year/schemes/download-ground-word/:month',adminController.downloadGroundWord);

router.get('/schemes/earn-learn-student/:userId/:year/schemes/download-department-excel/:month',adminController.downloadDepartmentExcel);
router.get('/schemes/earn-learn-student/:userId/:year/schemes/download-department-word/:month',adminController.downloadDepartmentWord);
module.exports= router;


