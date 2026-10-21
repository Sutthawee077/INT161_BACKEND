import * as service from "../services/example-service.js"
import express from "express"

const router = express.Router()

router.get("/", async (req, res) => {
    const objects = await service.getAllObjects()
    res.json(objects)
})

router.get("/:id", async (req, res) => {
    const id = req.params.id
    const object = await service.getObject(id)
    res.json(object)
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