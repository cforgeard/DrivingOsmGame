import { SimpleEventDispatcher } from "ste-simple-events";
import { OsmDataApiRequest } from "./osm-data-api-request";
import { OsmNode } from "./osm-node";
import { OsmWay } from "./osm-way";
import { OsmTile } from './osm-tile';

/**
 * This class stores in memory osm data (node and ways)
 * Each time the program download data for a tile, osm nodes are stored in nodeStorages, osm ways are stored in wayStorages
 * and the tile in loadedAreas
 */
export class OsmDataProvider {

    private _onOsmDataLoaded = new SimpleEventDispatcher<[OsmTile, Error | null]>();
    private _tilesInMemoryCount: number;
    private _wayStorages: Array<Map<number, OsmWay>>;
    private _nodeStorages: Array<Map<number, OsmNode>>;
    private _loadedTiles: Array<OsmTile | undefined>;

    /**
     * Create an OsmDataProvider object
     * @param tilesInMemoryCount number of tile data stored in memory
     */
    constructor(tilesInMemoryCount = 256 + 128) {
        if (tilesInMemoryCount < 1) {
            throw new Error("Invalid value for tilesInMemoryCount parameter. Must be positive");
        }

        this._tilesInMemoryCount = tilesInMemoryCount;
        this._wayStorages = new Array<Map<number, OsmWay>>(tilesInMemoryCount);
        this._nodeStorages = new Array<Map<number, OsmNode>>(tilesInMemoryCount);
        this._loadedTiles = new Array<OsmTile>(tilesInMemoryCount);

        for (let i = 0; i < tilesInMemoryCount; i++) {
            this._wayStorages[i] = new Map<number, OsmWay>();
            this._nodeStorages[i] = new Map<number, OsmNode>();
            this._loadedTiles[i] = undefined;
        }
    }

    public get onOsmDataLoaded(){
        return this._onOsmDataLoaded.asEvent();
    }

    /**
     * Load OSM data for a tile
     * @param tile tile
     */
    public loadDataForTile(tile: OsmTile) {
        const request = new OsmDataApiRequest(tile);
        request.execute().then(() => {
            this._processDownloadedData(tile, request.downloadedNodes, request.downloadedWays);
            this._onOsmDataLoaded.dispatchAsync([tile, null]);
        }).catch(e => {
            this._onOsmDataLoaded.dispatchAsync([tile, e]);
        });
    }

    public isTileLoaded(tile: OsmTile){
        for (const loadedTile of this._loadedTiles){
            if (loadedTile && tile.equals(loadedTile)){
                return true;
            }
        }
        return true;
    }

    public hasNode(id: number) {
        for (const nodeStorage of this._nodeStorages) {
            if (nodeStorage.has(id)) {
                return true;
            }
        }
        return false;
    }

    public hasWay(id: number) {
        for (const wayStorage of this._wayStorages) {
            if (wayStorage.has(id)) {
                return true;
            }
        }
        return false;
    }

    public getNode(id: number) {
        let node: OsmNode | undefined;
        for (const nodeStorage of this._nodeStorages) {
            const item = nodeStorage.get(id);
            if (item) {
                if (node && nodeStorage.get(id)) {
                    // In case if the node is in multiple storages
                    for (const way of item.ways) {
                        if (node.ways.indexOf(way) === -1) {
                            node.ways.push(way);
                        }
                    }
                } else {
                    node = item;
                }
            }
        }

        if (!node) {
            throw new Error(`Unknow node with id ${id}`);
        }

        return node;
    }

    public getWay(id: number) {
        for (const wayStorage of this._wayStorages) {
            const item = wayStorage.get(id);
            if (item) { return item; }
        }
        throw new Error(`Unknow way with id ${id}`);
    }

    private _processDownloadedData(tile: OsmTile, nodes: OsmNode[], ways: OsmWay[]) {
        for (let i = this._tilesInMemoryCount - 1; i > 0; i--) {
            this._nodeStorages[i] = this._nodeStorages[i - 1];
            this._wayStorages[i] = this._wayStorages[i - 1];
            this._loadedTiles[i] = this._loadedTiles[i - 1];
        }

        const nodesMap = new Map<number, OsmNode>();
        const waysMap = new Map<number, OsmWay>();

        for (const node of nodes) {
            nodesMap.set(node.id, node);
        }

        for (const way of ways) {
            waysMap.set(way.id, way);
        }

        this._nodeStorages[0] = nodesMap;
        this._wayStorages[0] = waysMap;
        this._loadedTiles[0] = tile;
    }
}