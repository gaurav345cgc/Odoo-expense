const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Finds a user by their ID, excluding their password.
 * @param {string} userId - The ID of the user to find.
 * @returns {Promise<User|null>} The user document or null if not found.
 */
const getUserById = async (userId) => {
  return await User.findById(userId).select('-password');
};

/**
 * Finds a company by its ID.
 * @param {string} companyId - The ID of the company to find.
 * @returns {Promise<Company|null>} The company document or null if not found.
 */
const getCompanyById = async (companyId) => {
  return await Company.findById(companyId);
};

/**
 * Traverses the user hierarchy to find the chain of managers for an employee.
 * This is crucial for the multi-level approval workflow.
 * @param {string} userId - The ID of the starting employee.
 * @returns {Promise<Array>} An array of manager user objects.
 */
const getManagerChain = async (userId) => {
  const managerChain = [];
  let currentUser = await User.findById(userId).select('-password');

  // Loop upwards as long as the current user has a manager
  while (currentUser && currentUser.managerId) {
    const manager = await User.findById(currentUser.managerId).select('-password');
    if (manager) {
      managerChain.push(manager);
      currentUser = manager; // Move up the chain
    } else {
      break; // Stop if a manager in the chain is not found
    }
  }

  return managerChain;
};

// Export all the helper functions in a single object
module.exports = {
  getUserById,
  getCompanyById,
  getManagerChain,
};