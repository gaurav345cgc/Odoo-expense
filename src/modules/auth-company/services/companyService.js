const Company = require('../models/Company');
const { isValidCurrencyCode } = require('../../../utils/currencyValidator'); // Import the validator

exports.getCompanyByAdmin = async (adminId) => {
  const company = await Company.findOne({ createdBy: adminId });
  if (!company) {
    const error = new Error('Company not found for this admin.');
    error.statusCode = 404;
    throw error;
  }
  return company;
};

exports.updateCompany = async (companyId, updateData) => {
  // Only allow specific fields to be updated
  const allowedUpdates = ['name', 'country', 'baseCurrency'];
  const updates = {};
  
  // Check if the provided currency code is valid before attempting the update
    if (updateData.baseCurrency && !isValidCurrencyCode(updateData.baseCurrency)) {
        const error = new Error('Invalid currency code provided.');
        error.statusCode = 400; // Bad Request
        throw error;
    }
    
  for (const key in updateData) {
    if (allowedUpdates.includes(key)) {
      updates[key] = updateData[key];
    }
  }

  const company = await Company.findByIdAndUpdate(companyId, updates, {
    new: true, // Return the updated document
    runValidators: true,
  });

  if (!company) {
    const error = new Error('Company not found.');
    error.statusCode = 404;
    throw error;
  }
  
  return company;
}; 
