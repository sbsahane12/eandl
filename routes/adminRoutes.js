const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const  { isLoggedIn, isAdmin} = require('../middleware');

router.get('/profile',isLoggedIn, isAdmin, adminController.dashboard);
router.get('/manageUsers',isLoggedIn, isAdmin,adminController.manageUsers);
router.get('/users/:year',isLoggedIn, isAdmin,adminController.usersByYear);
router.get('/createUser',isLoggedIn, isAdmin,adminController.createUserForm);
router.post('/createUser',isLoggedIn, isAdmin,adminController.createUser);
router.get('/editUser/:userId',isLoggedIn, isAdmin,adminController.editUser);
router.post('/updateUser/:userId',isLoggedIn, isAdmin,adminController.updateUser);
router.delete('/deleteUser/:userId/:year',isLoggedIn, isAdmin,adminController.deleteUser);

router.get('/schemes',isLoggedIn, isAdmin,adminController.manageSchemes);
router.get('/schemes/earn-learn-student/new',isLoggedIn, isAdmin,adminController.newSchemeForm);
router.post('/schemes/earn-learn-student/new',isLoggedIn, isAdmin,adminController.addScheme);

router.get('/schemes/earn-learn-student/:year',isLoggedIn, isAdmin,adminController.getUsersByYear);
router.get('/schemes/earn-learn-student/:year/schemes/:userId',isLoggedIn, isAdmin,adminController.schemesByUserAndYear);
router.get('/schemes/earn-learn-student/:year/schemes/:scheme_id/edit',isLoggedIn, isAdmin,adminController.editSchemeForm);
router.put('/schemes/earn-learn-student/:year/schemes/:scheme_id/update',isLoggedIn, isAdmin,adminController.updateScheme);
router.delete('/schemes/earn-learn-student/:year/schemes/:scheme_id/delete',isLoggedIn, isAdmin,adminController.deleteScheme);



router.get('/users/:year/word',isLoggedIn, isAdmin,adminController.downloadUsersDataWord);
router.get('/users/:year/excel',isLoggedIn, isAdmin,adminController.downloadUsersDataExcel);


router.get('/schemes/earn-learn-student/:userId/:year/schemes/download-ground-excel/:month',isLoggedIn, isAdmin,adminController.downloadGroundExcel);
router.get('/schemes/earn-learn-student/:userId/:year/schemes/download-ground-word/:month',isLoggedIn, isAdmin,adminController.downloadGroundWord);

router.get('/schemes/earn-learn-student/:userId/:year/schemes/download-department-excel/:month',isLoggedIn, isAdmin,adminController.downloadDepartmentExcel);
router.get('/schemes/earn-learn-student/:userId/:year/schemes/download-department-word/:month',isLoggedIn, isAdmin,adminController.downloadDepartmentWord);

router.get('/contacts',isLoggedIn,isAdmin, adminController.getContacts);
router.get('/handle-query/:contactId',isLoggedIn,isAdmin, adminController.handleQuery);
module.exports= router;


