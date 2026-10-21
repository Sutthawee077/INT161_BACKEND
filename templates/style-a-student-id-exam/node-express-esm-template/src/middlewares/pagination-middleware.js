//src/middlewares/pagination-middleware.js

export const queryParser = () => {
    return (req, res, next) => {
        const query = req.query || {};
        if (!query || query.page == undefined || query.limit == undefined) {
            req.pagination = null
            return next();
        }
        let page = query.page || 1 //if empty, null set to 1
        const pageSize = query.limit || 20
        // console.log('page: ', page, 'size: ', pageSize)
        page = Math.max(parseInt(page), 1) //if page is negative
        const limit = Math.min(parseInt(pageSize), 100) //if page size > 100
        const offset = (page - 1) * pageSize
        req.pagination = {page, limit, offset}
        next();
    }
}