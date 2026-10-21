/**
 * ==============================================================================================
 * 📁 File: Practice2.0/src/routes/office-route.js
 * 🏷️ Layer: Route / Controller (Office API)
 * ==============================================================================================
 */

import express from 'express';
import * as officeService from '../services/office-service.js';

const router = express.Router();

router.get('/:officeCode', async (req, res, next) => {
  try {
    const { officeCode } = req.params;
    const office = await officeService.getOfficeById(officeCode);
    res.status(200).json({
      status: 'success',
      data: office
    });
  } catch (err) {
    next(err);
  }
});

export default router;
