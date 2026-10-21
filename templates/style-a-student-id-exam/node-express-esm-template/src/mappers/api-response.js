import httpStatus from "http-status";

export async function apiResponse(
    res, data, pagination = null, status = httpStatus.OK) {
    return await (pagination ?
            paginate(res, data, pagination, status.valueOf()) :
            success(res, data, status.valueOf())
    )
}

/**
 * ส่ง Success Response ทั่วไป
 */
async function success(res, data, statusCode) {
    return res.status(statusCode).json({
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
    });
}

/**
 * ส่ง Success Response สำหรับข้อมูลแบบ Paginated
 */
async function paginate(res, data, pagination, statusCode) {
    //console.log('data:',data);
    const {limit, page} = pagination
    const total = data.totalItems;
    return res.status(statusCode).json({
        success: true,
        data,
        pagination: {
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        },
        timestamp: new Date().toISOString()
    });
}