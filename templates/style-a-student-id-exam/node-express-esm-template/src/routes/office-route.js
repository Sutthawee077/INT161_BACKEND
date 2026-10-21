import * as service from "../services/office-service.js"
import express from "express"
import {apiResponse} from "../mappers/api-response.js";
import httpStatus from "http-status";

const router = express.Router()

router.get("/", async (req, res) => {
    const {pagination} = req;
    const objects = await service.getAllObjects(pagination)
    await apiResponse(res, objects, pagination)
})

router.get("/:id", async (req, res) => {
    const id = req.params.id
    const object = await service.getObject(id)
    apiRespone.success(res, object)
})

router.post("/", async (req, res) => {
    const object = req.body
    const result = await service.createObject(object)
    apiRespone(res, result, httpStatus.CREATED)
})
router.put("/:id", async (req, res) => {
    const id = req.params.id
    const object = await service.updateObject(id, req.body)
    res.json(object)
})
router.delete("/:id", async (req, res) => {
    const id = req.params.id
    await service.removeObject(id)
    res.status(204).end()
})

export default router