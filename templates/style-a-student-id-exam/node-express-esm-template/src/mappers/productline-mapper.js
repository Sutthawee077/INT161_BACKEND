// src/mappers/productline-mapper.js
import e from "express";

export default class ProductLineMapper {
    // แปลงเป็น Less Data DTO (Summary)
    static toSummaryDTO(entity) {
        return {
            id: entity.productLine,
        };
    }

    // แปลงเป็น Full Data DTO
    static toDetailDTO(entity) {
        return entity
    }
    static map(entity, viewType) {
        if(viewType == 'summary') {
            return toSummaryDTO(entity)
        } else {
            return entity
        }
    }

    static maps(entities, viewType) {
        const {totalItems} = entities
        let entitiesMap = {}
        if(viewType == 'full') {
            entitiesMap = entities.map(item => this.toDetailDTO(item))
        } else {
            entitiesMap = entities.map(item => this.toSummaryDTO(item))
        }
        if(totalItems) {
            entitiesMap.totalItems = totalItems
        }
        return entitiesMap
    }
}