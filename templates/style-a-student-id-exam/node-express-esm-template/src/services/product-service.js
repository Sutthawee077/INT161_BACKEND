import * as repo from "../repositories/product-repo.js"
import mapper from "../mappers/product-mapper.js"

export async function getObject(id,viewType) {
    return mapper.map(await repo.findOne(id));
}

export async function getAllObjects(pagination, viewType) {
    const objects = await repo.findAll(pagination)
    const objectsDto = mapper.maps(objects,viewType)
    console.log(objectsDto)
    return objectsDto
}

export async function updateObject(id, data) {
    return await repo.update(id, data)
}

export async function removeObject(id) {
    return await repo.remove(id)
}

export async function createObject(data) {
    return await repo.create(data)
}
