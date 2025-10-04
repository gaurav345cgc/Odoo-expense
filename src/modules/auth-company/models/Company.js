 
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
  },
  baseCurrency: {
    type: String,
    required: [true, 'Base currency is required'],
    uppercase: true,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  // This option adds 'createdAt' and 'updatedAt' fields automatically
  timestamps: true,
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;