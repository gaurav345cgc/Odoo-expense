const companyService = require('../services/companyService');
const ApiResponse = require('../../../utils/apiResponse');

exports.getMyCompany = async (req, res, next) => {
  try {
    // The user object is attached by the authMiddleware
    const company = await companyService.getCompanyByAdmin(req.user.id);
    res.status(200).json(new ApiResponse(200, company));
  } catch (error) {
    next(error);
  }
};

exports.updateMyCompany = async (req, res, next) => {
  try {
    const updatedCompany = await companyService.updateCompany(req.user.companyId, req.body);
    res.status(200).json(new ApiResponse(200, updatedCompany, 'Company updated successfully'));
  } catch (error) {
    next(error);
  }
}; 
