import { latlon } from "sgeo";

/**
 * An OSM node
 * https://wiki.openstreetmap.org/wiki/Node
 */
export class OsmNode extends latlon {

    /**
     * ways IDs of all OsmWays containing this node
     */
    public ways: number[] = [];

    /**
     * Create an OsmNode object
     * @param id ID
     * @param lat latitude
     * @param lng longitude 
     * @param publicAccess true if anyone can go in this node, else false 
     */
    constructor(public id: number, lat: number, lng: number, public publicAccess: boolean) {
        super(lat, lng);
    }
}
