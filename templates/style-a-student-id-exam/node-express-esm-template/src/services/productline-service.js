import * as repo from "../repositories/productline-repo.js"
import mapper from "../mappers/productline-mapper.js";

export async function getObject(id, viewType) {
    const object =  await repo.findOne(id);
    return mapper.map(object,viewType)
}

export async function getAllObjects(pagination, viewType) {
    const objects =  await repo.findAll(pagination);
    return mapper.maps(objects , viewType)
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
