const userService = require('../services/userService');
const ApiResponse = require('../../../utils/apiResponse');

exports.createUser = async (req, res, next) => {
  try {
    // req.user is the logged-in admin
    const newUser = await userService.createUser(req.user, req.body);
    res.status(201).json(new ApiResponse(201, newUser, 'User created successfully'));
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsersInCompany(req.user.companyId);
    res.status(200).json(new ApiResponse(200, users));
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updatedUser = await userService.updateUserRole(req.user, id, role);
    res.status(200).json(new ApiResponse(200, updatedUser, 'User role updated'));
  } catch (error) {
    next(error);
  }
};

exports.assignUserManager = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;
    const updatedUser = await userService.assignUserManager(req.user, id, managerId);
    res.status(200).json(new ApiResponse(200, updatedUser, 'Manager assigned successfully'));
  } catch (error) {
    next(error);
  }
}; 
