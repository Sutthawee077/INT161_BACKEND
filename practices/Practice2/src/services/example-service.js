import * as repo from "../repositories/example-repo.js"

export async function getObject(id) {
    return await repo.findOne(id)
}

export async function getAllObjects() {
    return await repo.findAll()
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
