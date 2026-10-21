import * as service from "../services/product-service.js"
import express from "express"
import {apiResponse} from "../mappers/api-response.js";

const router = express.Router()

router.get("/", async (req, res) => {
    const pagination = req.pagination
    const viewType = req.query.view || "summary"
    const objects = await service.getAllObjects(pagination, viewType)
    apiResponse(res, objects, pagination)
})

router.get("/:id", async (req, res) => {
    const viewType = req.query.view || "full"
    const id = req.params.id
    const object = await service.getObject(id,viewType)
    apiResponse(res, object)
})

router.post("/", async (req, res) => {
    const object = req.body
    const result = await service.createObject(object)
    res.status(201).json({result})
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