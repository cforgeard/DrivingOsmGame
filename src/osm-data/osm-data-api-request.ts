import { OsmNode } from "./osm-node";
import { HighwayType, OneWayType, OsmWay } from "./osm-way";
import { OsmTile } from "./osm-tile";

import axios from "axios";
import axiosRetry from "axios-retry";
axiosRetry(axios, { retries: 3 });

const OVERPASS_ENDPOINT = "https://overpass.kumi.systems/api/interpreter";

export class OsmDataApiRequest {

    private _downloadedWays: Map<number, OsmWay>;
    private _downloadedNodes: Map<number, OsmNode>;
    private _tile: OsmTile;

    constructor(tile: OsmTile) {
        this._tile = tile;
        this._downloadedNodes = new Map<number, OsmNode>();
        this._downloadedWays = new Map<number, OsmWay>();
    }

    public async execute() {
        const areaToLoad = this._tile.toLngLatBounds();
        const overpassRequest = `[out:json];(way(${areaToLoad[1]}, ${areaToLoad[0]}, ${areaToLoad[3]}, ${areaToLoad[2]})["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|living_street|service)$"];);(._;>;);out body;`
        return axios.get(`${OVERPASS_ENDPOINT}?data=${overpassRequest}`,{
            responseType: "json"
        }).then((res)=>this._parseApiResponse(res.data.elements));
    }

    public get downloadedNodes() {
        return Array.from(this._downloadedNodes.values());
    }

    public get downloadedWays() {
        return Array.from(this._downloadedWays.values());
    }

    private async _parseApiResponse(elements: any[]) {
        for (const element of elements) {
            if (element.type === "node") {
                this._parseNode(element);
            } else if (element.type === "way") {
                this._parseWay(element);
            } else {
                throw new Error(`Unknown element type '${element.type}'`);
            }
        }
    }

    private _parseNode(obj: any) {
        this._downloadedNodes.set(obj.id, new OsmNode(obj.id, obj.lat, obj.lon, this._objectAllowPublicAccess(obj.tags)));
    }

    private _parseWay(obj: any) {
        const way = new OsmWay(obj.id, obj.nodes, this._objectAllowPublicAccess(obj.tags));

        for (const nodeId of obj.nodes) {
            const node = this._downloadedNodes.get(nodeId);
            if (node && node.ways.indexOf(obj.id) === -1) {
                node.ways.push(obj.id);
                this._downloadedNodes.set(node.id, node);
            }
        }

        way.highwayType = HighwayType[obj.tags.highway as string];
        way.name = obj.tags.name;
        way.ref = obj.tags.ref;
        way.isRoundabout = obj.tags.junction !== undefined;

        const oneWayTag: string = obj.tags.oneway;
        if (["-1", "reverse"].indexOf(oneWayTag) !== -1) {
            way.oneWayType = OneWayType.Reverse;
        } else if (["yes", "true", "1"].indexOf(oneWayTag) !== -1) {
            way.oneWayType = OneWayType.Yes;
        } else if (["no", "false", "0"].indexOf(oneWayTag) !== -1) {
            way.oneWayType = OneWayType.No;
        } else if (way.isRoundabout || way.highwayType === HighwayType.motorway) {
            way.oneWayType = OneWayType.Yes;
        } else {
            way.oneWayType = OneWayType.No;
        }

        this._downloadedWays.set(obj.id, way);
    }

    private _objectAllowPublicAccess(tags: any | null) {
        if (!tags) {
            return true;
        }

        if (tags.access && tags.access !== "yes" && tags.access !== "permissive") {
            return false;
        }

        if (tags.barrier && tags.barrier !== "border_control" && tags.barrier !== "height_restrictor" && tags.barrier !== "toll_booth") {
            return false;
        }

        return true;
    }
}