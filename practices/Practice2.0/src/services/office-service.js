/**
 * ==============================================================================================
 * 📁 File: Practice2.0/src/services/office-service.js
 * 🏷️ Layer: Service (Business Logic สำหรับตาราง offices)
 * ==============================================================================================
 */

import * as officeRepo from '../repositories/office-repo.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getOfficeById(officeCode) {
  const office = await officeRepo.findByCode(officeCode);
  if (!office) {
    throw new AppError(`Office with code '${officeCode}' was not found`, 404, 'OFFICE_NOT_FOUND');
  }
  return office;
}
