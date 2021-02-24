import { tileToBBOX } from "@mapbox/tilebelt";
import { LngLatBounds } from "mapbox-gl";

/**
 * An OSM Tile
 * https://wiki.openstreetmap.org/wiki/Tiles
 */
export class OsmTile {

    constructor(public x: number, public y: number, public z: number) { }

    public equals(other: OsmTile){
        return this.x == other.x && this.y == other.y && this.z == other.z;
    }

    public toLngLatBounds() {
        const rawBounds = tileToBBOX([this.x, this.y, this.z]); // return [w, s, e, n]
        return rawBounds;
    }

}