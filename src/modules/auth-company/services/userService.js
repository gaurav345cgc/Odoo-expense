const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createUser = async (adminUser, userData) => {
  const { name, email, password, role, managerId } = userData;

  if (!name || !email || !password || !role) {
    const error = new Error('Please provide name, email, password, and role.');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role, // 'Manager' or 'Employee'
    companyId: adminUser.companyId, // Assign to the admin's company
    managerId: managerId || null,
  });

  newUser.password = undefined;
  return newUser;
};

exports.getAllUsersInCompany = async (companyId) => {
  // Find all users in the company and exclude their passwords from the result
  const users = await User.find({ companyId }).select('-password');
  return users;
};

exports.updateUserRole = async (adminUser, targetUserId, newRole) => {
  if (!['Manager', 'Employee'].includes(newRole)) {
    const error = new Error('Invalid role specified.');
    error.statusCode = 400;
    throw error;
  }
  
  const userToUpdate = await User.findById(targetUserId);

  if (!userToUpdate || userToUpdate.companyId.toString() !== adminUser.companyId.toString()) {
    const error = new Error('User not found in your company.');
    error.statusCode = 404;
    throw error;
  }

  userToUpdate.role = newRole;
  await userToUpdate.save();
  userToUpdate.password = undefined;
  return userToUpdate;
};

exports.assignUserManager = async (adminUser, targetUserId, newManagerId) => {
  const userToUpdate = await User.findById(targetUserId);
  const newManager = await User.findById(newManagerId);

  // Security checks
  if (!userToUpdate || userToUpdate.companyId.toString() !== adminUser.companyId.toString()) {
    const error = new Error('Employee not found in your company.');
    error.statusCode = 404;
    throw error;
  }
  if (!newManager || newManager.companyId.toString() !== adminUser.companyId.toString() || newManager.role !== 'Manager') {
    const error = new Error('Manager not found or invalid in your company.');
    error.statusCode = 404;
    throw error;
  }

  userToUpdate.managerId = newManagerId;
  await userToUpdate.save();
  userToUpdate.password = undefined;
  return userToUpdate;
}; 
